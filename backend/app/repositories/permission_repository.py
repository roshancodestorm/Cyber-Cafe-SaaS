from sqlalchemy.orm import Session
from app.models.permission import Permission
from app.models.permission_request import PermissionRequest
from app.schemas.permission import PermissionCreate
from app.schemas.permission_request import PermissionRequestCreate
import uuid
from datetime import datetime, timedelta

class PermissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_permission_request(self, request: PermissionRequestCreate) -> PermissionRequest:
        db_request = PermissionRequest(**request.dict())
        self.db.add(db_request)
        self.db.commit()
        self.db.refresh(db_request)
        return db_request

    def get_permission_request(self, request_id: uuid.UUID) -> PermissionRequest | None:
        return self.db.query(PermissionRequest).filter(PermissionRequest.id == request_id).first()

    def update_permission_request_status(self, request_id: uuid.UUID, status: str) -> PermissionRequest | None:
        db_request = self.get_permission_request(request_id)
        if db_request:
            db_request.status = status
            db_request.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(db_request)
        return db_request

    def create_permission(self, permission: PermissionCreate) -> Permission:
        db_permission = Permission(**permission.dict())
        self.db.add(db_permission)
        self.db.commit()
        self.db.refresh(db_permission)
        return db_permission

    def get_permission(self, user_id: uuid.UUID, document_id: uuid.UUID, permission_type: str) -> Permission | None:
        return self.db.query(Permission).filter(
            Permission.user_id == user_id,
            Permission.document_id == document_id,
            Permission.permission_type == permission_type,
            Permission.is_active == True
        ).first()

    def revoke_permission(self, permission_id: uuid.UUID) -> Permission | None:
        db_permission = self.db.query(Permission).filter(Permission.id == permission_id).first()
        if db_permission:
            db_permission.is_active = False
            db_permission.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(db_permission)
        return db_permission
