from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import uuid
from typing import Optional

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.schemas.cafe import (
    NearbyCafeSearchRequest,
    NearbyCafeSearchResponse,
    NearbyCafePublic,
    CafeCreate,
    CafeResponse,
)
from app.services.cafe_discovery_service import (
    CafeDiscoveryService,
    GeocodingService,
    MapsProvider,
)

router = APIRouter()


@router.post("/nearby", response_model=NearbyCafeSearchResponse)
def search_nearby_cafes(
    req: NearbyCafeSearchRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CafeDiscoveryService(db)
    return service.search_nearby(req)


@router.get("/nearby", response_model=NearbyCafeSearchResponse)
def search_nearby_cafes_query(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(5.0, gt=0, le=500),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    only_verified: bool = False,
    only_open: bool = False,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = NearbyCafeSearchRequest(
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        page=page,
        page_size=page_size,
        only_verified=only_verified,
        only_open=only_open,
    )
    return CafeDiscoveryService(db).search_nearby(req)


@router.get("/{cafe_id}/public", response_model=NearbyCafePublic)
def get_cafe_public(
    cafe_id: uuid.UUID,
    viewer_lat: Optional[float] = Query(None, ge=-90, le=90),
    viewer_lon: Optional[float] = Query(None, ge=-180, le=180),
    db: Session = Depends(get_db),
):
    service = CafeDiscoveryService(db)
    return service.get_cafe_public(cafe_id, viewer_lat, viewer_lon)


@router.post("/geocode")
async def geocode_address(
    q: str = Query(..., min_length=1, max_length=200),
    current_user: Optional[User] = Depends(get_current_user),
):
    service = GeocodingService(MapsProvider())
    results = await service.search_location(q)
    return {"results": results}


@router.get("/lookup/reverse")
async def reverse_geocode(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    current_user: Optional[User] = Depends(get_current_user),
):
    svc = GeocodingService(MapsProvider())
    result = await svc.reverse_lookup(lat, lon)
    return {"result": result}


@router.post("", response_model=CafeResponse, status_code=status.HTTP_201_CREATED)
def create_cafe(
    data: CafeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if str(current_user.tenant_id) != str(data.tenant_id) and not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create cafe for other tenants")
    svc = CafeDiscoveryService(db)
    created = svc.create_cafe(data)
    return CafeResponse.from_orm(created)


@router.get("", response_model=list[CafeResponse])
def list_my_cafes(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    from app.repositories.cafe_repository import CafeRepository
    repo = CafeRepository(db)
    cafes = repo.list_by_tenant(current_user.tenant_id, skip=skip, limit=limit)
    return [CafeResponse.from_orm(c) for c in cafes]
