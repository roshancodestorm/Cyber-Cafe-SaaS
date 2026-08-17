import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.document import Document
from app.models.permission import Permission
from app.models.permission_request import PermissionRequest
from app.schemas.permission import PermissionCreate
from app.schemas.permission_request import PermissionRequestCreate, PermissionRequestResponse
from app.repositories.permission_repository import PermissionRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.user_repository import UserRepository

class PermissionService:
    def __init__(self, db: Session):
        self.db = db
        self.permission_repo = PermissionRepository(db)
        self.document_repo = DocumentRepository(db)
        self.user_repo = UserRepository(db)

    def request_document_access(self, document_id: uuid.UUID, requester: User, permission_type: str) -> PermissionRequestResponse:
        document = self.document_repo.get_document_by_id(document_id)
        if not document or document.tenant_id != requester.tenant_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

        owner = self.user_repo.get_user_by_id(document.user_id)
        if not owner:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document owner not found")

        if requester.id == owner.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot request permission for your own document")

        permission_request_create = PermissionRequestCreate(
            document_id=document_id,
            requester_id=requester.id,
            owner_id=owner.id,
            permission_type=permission_type,
            tenant_id=requester.tenant_id
        )
        permission_request = self.permission_repo.create_permission_request(permission_request_create)
        # TODO: Notify owner about the permission request
        return PermissionRequestResponse.from_orm(permission_request)

    def approve_permission_request(self, request_id: uuid.UUID, approver: User, expires_in_minutes: int = 60) -> PermissionRequestResponse:
        permission_request = self.permission_repo.get_permission_request(request_id)
        if not permission_request or permission_request.tenant_id != approver.tenant_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission request not found")

        if permission_request.owner_id != approver.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the document owner can approve this request")

        if permission_request.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Permission request already processed")

        # Create the actual permission
        expires_at = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
        permission_create = PermissionCreate(
            user_id=permission_request.requester_id,
            document_id=permission_request.document_id,
            permission_type=permission_request.permission_type,
            expires_at=expires_at,
            tenant_id=approver.tenant_id
        )
        self.permission_repo.create_permission(permission_create)

        # Update the request status
        updated_request = self.permission_repo.update_permission_request_status(request_id, "approved")
        # TODO: Notify requester about the approval
        return PermissionRequestResponse.from_orm(updated_request)

    def deny_permission_request(self, request_id: uuid.UUID, denier: User) -> PermissionRequestResponse:
        permission_request = self.permission_repo.get_permission_request(request_id)
        if not permission_request or permission_request.tenant_id != denier.tenant_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission request not found")

        if permission_request.owner_id != denier.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the document owner can deny this request")

        if permission_request.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Permission request already processed")

        updated_request = self.permission_repo.update_permission_request_status(request_id, "denied")
        # TODO: Notify requester about the denial
        return PermissionRequestResponse.from_orm(updated_request)

    def check_permission(self, user_id: uuid.UUID, document_id: uuid.UUID, permission_type: str) -> bool:
        permission = self.permission_repo.get_permission(user_id, document_id, permission_type)
        if permission and permission.is_active and (permission.expires_at is None or permission.expires_at > datetime.utcnow()):
            return True
        return False

    def revoke_permission(self, permission_id: uuid.UUID, revoker: User) -> Permission | None:
        permission = self.permission_repo.revoke_permission(permission_id)
        if not permission or permission.tenant_id != revoker.tenant_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")
        # TODO: Add more robust checks for who can revoke permissions (e.g., owner, super_admin)
        return permission
