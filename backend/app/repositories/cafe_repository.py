import math
import uuid
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.cafe import Cafe


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlmb / 2.0) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def is_cafe_open(cafe: Cafe, ref_datetime=None) -> bool:
    import datetime as _dt
    ref = ref_datetime or _dt.datetime.utcnow()
    hours = cafe.opening_hours or {}
    if not hours:
        return True
    weekday = str(ref.weekday())
    day_schedule = hours.get(weekday) or hours.get(str(weekday))
    if day_schedule is None:
        return False
    if isinstance(day_schedule, bool):
        return bool(day_schedule)
    if isinstance(day_schedule, str):
        if day_schedule.lower() in ("closed", "off", "none"):
            return False
        return True
    if isinstance(day_schedule, dict):
        open_t = day_schedule.get("open")
        close_t = day_schedule.get("close")
        if open_t is None or close_t is None:
            return False
        try:
            now_minutes = ref.hour * 60 + ref.minute
            oh, om = map(int, str(open_t).split(":"))
            ch, cm = map(int, str(close_t).split(":"))
            open_min = oh * 60 + om
            close_min = ch * 60 + cm
            if close_min < open_min:
                return now_minutes >= open_min or now_minutes <= close_min
            return open_min <= now_minutes <= close_min
        except Exception:
            return True
    return True


class CafeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, cafe_id: uuid.UUID) -> Optional[Cafe]:
        return self.db.query(Cafe).filter(Cafe.id == cafe_id).first()

    def create(self, **kwargs) -> Cafe:
        cafe = Cafe(**kwargs)
        self.db.add(cafe)
        self.db.commit()
        self.db.refresh(cafe)
        return cafe

    def list_by_tenant(self, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Cafe]:
        return (
            self.db.query(Cafe)
            .filter(Cafe.tenant_id == tenant_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def find_nearby(
        self,
        lat: float,
        lon: float,
        radius_km: float,
        page: int = 1,
        page_size: int = 20,
        only_verified: bool = False,
        services_filter: Optional[List[str]] = None,
    ) -> Tuple[List[Cafe], int]:
        query = self.db.query(Cafe).filter(Cafe.is_active == True)
        if only_verified:
            query = query.filter(Cafe.is_verified == True)
        query = query.filter(Cafe.latitude.isnot(None), Cafe.longitude.isnot(None))
        all_candidates = query.all()
        scored = []
        for c in all_candidates:
            d = haversine_distance_km(lat, lon, float(c.latitude), float(c.longitude))
            if d <= radius_km:
                if services_filter:
                    cafe_services = set(c.available_services or [])
                    if not any(s in cafe_services for s in services_filter):
                        continue
                scored.append((d, c))
        scored.sort(key=lambda x: x[0])
        total = len(scored)
        offset = (page - 1) * page_size
        paged = scored[offset:offset + page_size]
        return [c for _, c in paged], total

    def compute_distance(self, cafe: Cafe, lat: float, lon: float) -> float:
        if cafe.latitude is None or cafe.longitude is None:
            return float("inf")
        return haversine_distance_km(lat, lon, float(cafe.latitude), float(cafe.longitude))

    def update(self, cafe_id: uuid.UUID, tenant_id: uuid.UUID, **kwargs) -> Optional[Cafe]:
        cafe = self.get_by_id(cafe_id)
        if not cafe or cafe.tenant_id != tenant_id:
            return None
        for k, v in kwargs.items():
            setattr(cafe, k, v)
        self.db.add(cafe)
        self.db.commit()
        self.db.refresh(cafe)
        return cafe
