from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from datetime import datetime

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.document_service import DocumentService
from app.services.s3_service import S3Service
from app.repositories.document_repository import DocumentRepository

router = APIRouter()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    s3_service = S3Service()
    document_service = DocumentService(db, s3_service)
    
    # For simplicity, cafe_id is None for now. This would be determined by context in a real app.
    document = await document_service.upload_document(file, current_user.id, current_user.tenant_id, cafe_id=None)
    return DocumentResponse.from_orm(document)

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document_repo = DocumentRepository(db)
    document_service = DocumentService(db, S3Service()) # Initialize S3Service here
    document = document_repo.get_document_by_id(document_id)
    if not document or document.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    # Increment open count
    document = document_service.increment_open_count(document)

    return DocumentResponse.from_orm(document)

@router.delete("/{document_id}", response_model=DocumentResponse)
async def soft_delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document_service = DocumentService(db, S3Service())
    deleted_document = document_service.soft_delete_document(document_id, current_user.tenant_id)
    return DocumentResponse.from_orm(deleted_document)
