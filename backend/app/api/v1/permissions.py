from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.schemas.permission_request import PermissionRequestCreate, PermissionRequestResponse
from app.schemas.permission import PermissionResponse
from app.services.permission_service import PermissionService

router = APIRouter()

@router.post("/request", response_model=PermissionRequestResponse, status_code=status.HTTP_201_CREATED)
async def request_access(
    document_id: uuid.UUID,
    permission_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    permission_service = PermissionService(db)
    return permission_service.request_document_access(document_id, current_user, permission_type)

@router.post("/request/{request_id}/approve", response_model=PermissionRequestResponse)
async def approve_access_request(
    request_id: uuid.UUID,
    expires_in_minutes: int = 60,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    permission_service = PermissionService(db)
    return permission_service.approve_permission_request(request_id, current_user, expires_in_minutes)

@router.post("/request/{request_id}/deny", response_model=PermissionRequestResponse)
async def deny_access_request(
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    permission_service = PermissionService(db)
    return permission_service.deny_permission_request(request_id, current_user)

@router.post("/revoke/{permission_id}", response_model=PermissionResponse)
async def revoke_permission(
    permission_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    permission_service = PermissionService(db)
    permission = permission_service.revoke_permission(permission_id, current_user)
    if not permission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")
    return PermissionResponse.from_orm(permission)

@router.get("/check", response_model=bool)
async def check_permission(
    document_id: uuid.UUID,
    permission_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    permission_service = PermissionService(db)
    return permission_service.check_permission(current_user.id, document_id, permission_type)
