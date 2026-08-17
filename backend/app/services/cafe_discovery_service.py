import uuid
import math
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.cafe_repository import CafeRepository, is_cafe_open, haversine_distance_km
from app.models.cafe import Cafe
from app.schemas.cafe import (
    NearbyCafePublic,
    NearbyCafeSearchRequest,
    NearbyCafeSearchResponse,
    CafeCreate,
)


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
        cafes, total = self.cafe_repo.find_nearby(
            lat=req.latitude,
            lon=req.longitude,
            radius_km=req.radius_km,
            page=req.page,
            page_size=req.page_size,
            only_verified=req.only_verified,
            services_filter=req.services_filter,
        )
        results: List[NearbyCafePublic] = []
        for c in cafes:
            dist_km = self.cafe_repo.compute_distance(c, req.latitude, req.longitude)
            open_now = is_cafe_open(c)
            if req.only_open and not open_now:
                continue
            results.append(
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
        if req.only_open:
            total = len(results)
        total_pages = max(1, math.ceil(total / req.page_size))
        return NearbyCafeSearchResponse(
            results=results,
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
