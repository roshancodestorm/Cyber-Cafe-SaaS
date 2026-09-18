import uuid
import math
import time
import threading
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import httpx
from app.repositories.cafe_repository import CafeRepository, is_cafe_open, haversine_distance_km
from app.models.cafe import Cafe
from app.schemas.cafe import (
    NearbyCafePublic,
    NearbyCafeSearchRequest,
    NearbyCafeSearchResponse,
    CafeCreate,
)

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

_osm_cache: dict = {}
_osm_cache_lock = threading.Lock()
_OSM_CACHE_TTL_SECONDS = 300


def _cache_key(lat: float, lon: float, radius_km: float) -> str:
    return f"{round(lat, 3)}:{round(lon, 3)}:{round(radius_km, 1)}"


def _overpass_query(lat: float, lon: float, radius_km: float) -> str:
    radius_m = int(radius_km * 1000)
    return (
        "[out:json][timeout:20];"
        "("
        f'node["amenity"="internet_cafe"](around:{radius_m},{lat},{lon});'
        f'way["amenity"="internet_cafe"](around:{radius_m},{lat},{lon});'
        ");"
        "out center tags;"
    )


def _build_osm_location(tags: dict, lat: float, lon: float) -> str:
    parts = []
    street = tags.get("addr:street")
    housenumber = tags.get("addr:housenumber")
    if street and housenumber:
        parts.append(f"{housenumber} {street}")
    elif street:
        parts.append(street)
    for key in ("addr:suburb", "addr:neighbourhood", "addr:village", "addr:city"):
        if tags.get(key):
            parts.append(tags[key])
            break
    if not parts:
        parts.append(f"{lat:.4f}, {lon:.4f}")
    return ", ".join(parts)


def _osm_element_to_cafe(el: dict, origin_lat: float, origin_lon: float) -> Optional[NearbyCafePublic]:
    el_type = el.get("type")
    el_id = el.get("id")
    tags = el.get("tags") or {}
    if el_type == "node":
        lat = el.get("lat")
        lon = el.get("lon")
    else:
        center = el.get("center") or {}
        lat = center.get("lat")
        lon = center.get("lon")
    if lat is None or lon is None:
        return None
    dist_km = haversine_distance_km(origin_lat, origin_lon, float(lat), float(lon))
    name = tags.get("name") or tags.get("brand") or tags.get("operator") or "Internet Cafe"
    services = ["internet"]
    if tags.get("internet_access"):
        services.append(str(tags["internet_access"]))
    stable_id = uuid.uuid5(uuid.NAMESPACE_URL, f"https://www.openstreetmap.org/{el_type}/{el_id}")
    return NearbyCafePublic(
        id=stable_id,
        name=name,
        public_location=_build_osm_location(tags, float(lat), float(lon)),
        approximate_distance_km=round(dist_km, 2),
        approximate_distance_miles=round(dist_km * 0.621371, 2),
        available_services=services,
        is_open=True,
        is_verified=False,
        description=tags.get("description"),
        latitude=float(lat),
        longitude=float(lon),
    )


def fetch_osm_internet_cafes(lat: float, lon: float, radius_km: float) -> List[NearbyCafePublic]:
    key = _cache_key(lat, lon, radius_km)
    with _osm_cache_lock:
        cached = _osm_cache.get(key)
        if cached and time.time() - cached[0] < _OSM_CACHE_TTL_SECONDS:
            return cached[1]
    query = _overpass_query(lat, lon, radius_km)
    elements: List[dict] = []
    for endpoint in OVERPASS_ENDPOINTS:
        try:
            resp = httpx.post(
                endpoint,
                data={"data": query},
                timeout=15.0,
                headers={"User-Agent": "CyberCafeSaas/1.0 (cafe discovery)"},
            )
            if resp.status_code == 200:
                elements = resp.json().get("elements", [])
                break
        except Exception:
            continue
    cafes: List[NearbyCafePublic] = []
    seen = set()
    for el in elements:
        ident = (el.get("type"), el.get("id"))
        if ident in seen:
            continue
        seen.add(ident)
        mapped = _osm_element_to_cafe(el, lat, lon)
        if mapped is not None:
            cafes.append(mapped)
    cafes.sort(key=lambda c: c.approximate_distance_km)
    with _osm_cache_lock:
        _osm_cache[key] = (time.time(), cafes)
    return cafes


class MapsProvider:
    def geocode(self, address_query: str) -> Optional[dict]:
        return None

    def reverse_geocode(self, lat: float, lon: float) -> Optional[dict]:
        return None

    def get_static_map_url(self, markers: List[dict], **kwargs) -> Optional[str]:
        return None


class GeocodingService:
    def __init__(self, provider: Optional[MapsProvider] = None):
        self.provider = provider or MapsProvider()

    async def search_location(self, query: str) -> List[dict]:
        result = self.provider.geocode(query)
        if result:
            return [result] if isinstance(result, dict) else list(result)
        return []

    async def reverse_lookup(self, lat: float, lon: float) -> Optional[dict]:
        return self.provider.reverse_geocode(lat, lon)


class CafeDiscoveryService:
    def __init__(self, db: Session):
        self.db = db
        self.cafe_repo = CafeRepository(db)

    def get_cafe_public_name(self, cafe: Cafe) -> str:
        return cafe.public_display_name or cafe.name

    def get_public_location(self, cafe: Cafe) -> str:
        parts = [cafe.city, cafe.state]
        if cafe.address:
            try:
                addr_parts = str(cafe.address).split(",")
                if addr_parts:
                    first = addr_parts[0].strip()
                    digits = sum(c.isdigit() for c in first)
                    if digits < 4 and len(first) < 40:
                        parts.insert(0, first)
            except Exception:
                pass
        return ", ".join(p for p in parts if p)

    def search_nearby(self, req: NearbyCafeSearchRequest, viewer_timezone: Optional[str] = None) -> NearbyCafeSearchResponse:
        cafes, _ = self.cafe_repo.find_nearby(
            lat=req.latitude,
            lon=req.longitude,
            radius_km=req.radius_km,
            page=1,
            page_size=100000,
            only_verified=req.only_verified,
            services_filter=req.services_filter,
        )
        combined: List[NearbyCafePublic] = []
        for c in cafes:
            dist_km = self.cafe_repo.compute_distance(c, req.latitude, req.longitude)
            open_now = is_cafe_open(c)
            if req.only_open and not open_now:
                continue
            combined.append(
                NearbyCafePublic(
                    id=c.id,
                    name=self.get_cafe_public_name(c),
                    public_location=self.get_public_location(c),
                    approximate_distance_km=round(dist_km, 2),
                    approximate_distance_miles=round(dist_km * 0.621371, 2),
                    available_services=list(c.available_services or []),
                    is_open=open_now,
                    is_verified=bool(c.is_verified),
                    description=c.description,
                    latitude=c.latitude,
                    longitude=c.longitude,
                )
            )
        try:
            osm_cafes = fetch_osm_internet_cafes(req.latitude, req.longitude, req.radius_km)
        except Exception:
            osm_cafes = []
        if not req.only_verified:
            combined.extend(osm_cafes)
        seen_ids = set()
        deduped: List[NearbyCafePublic] = []
        for cafe in sorted(combined, key=lambda r: r.approximate_distance_km):
            if cafe.id in seen_ids:
                continue
            seen_ids.add(cafe.id)
            deduped.append(cafe)
        total = len(deduped)
        offset = (req.page - 1) * req.page_size
        paged = deduped[offset:offset + req.page_size]
        total_pages = max(1, math.ceil(total / req.page_size))
        return NearbyCafeSearchResponse(
            results=paged,
            total=total,
            page=req.page,
            page_size=req.page_size,
            total_pages=total_pages,
            search_center={"latitude": req.latitude, "longitude": req.longitude, "radius_km": req.radius_km},
        )

    def get_cafe_public(self, cafe_id: uuid.UUID, viewer_lat: Optional[float] = None, viewer_lon: Optional[float] = None) -> NearbyCafePublic:
        cafe = self.cafe_repo.get_by_id(cafe_id)
        if not cafe or not cafe.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cafe not found")
        if viewer_lat is not None and viewer_lon is not None:
            dist_km = self.cafe_repo.compute_distance(cafe, viewer_lat, viewer_lon)
        else:
            dist_km = 0.0
        return NearbyCafePublic(
            id=cafe.id,
            name=self.get_cafe_public_name(cafe),
            public_location=self.get_public_location(cafe),
            approximate_distance_km=round(dist_km, 2),
            approximate_distance_miles=round(dist_km * 0.621371, 2),
            available_services=list(cafe.available_services or []),
            is_open=is_cafe_open(cafe),
            is_verified=bool(cafe.is_verified),
            description=cafe.description,
            latitude=cafe.latitude,
            longitude=cafe.longitude,
        )

    def create_cafe(self, data: CafeCreate) -> Cafe:
        payload = data.model_dump()
        return self.cafe_repo.create(**payload)

    def update_cafe(self, cafe_id: uuid.UUID, tenant_id: uuid.UUID, **fields) -> Optional[Cafe]:
        return self.cafe_repo.update(cafe_id, tenant_id, **fields)
