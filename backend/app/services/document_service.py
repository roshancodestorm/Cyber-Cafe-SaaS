import uuid
import hashlib
import magic # python-magic
from typing import IO
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.repositories.document_repository import DocumentRepository # Will create this next
from app.services.s3_service import S3Service

class DocumentService:
    def __init__(self, db: Session, s3_service: S3Service):
        self.db = db
        self.document_repo = DocumentRepository(db)
        self.s3_service = s3_service

    async def upload_document(self, file: UploadFile, user_id: uuid.UUID, tenant_id: uuid.UUID, cafe_id: uuid.UUID | None = None) -> Document:
        # 1. File type and size validation
        if not self._validate_file(file):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type or size")

        file_content = await file.read()
        file_size = len(file_content)
        checksum = self._generate_checksum(file_content)
        object_storage_key = f"{tenant_id}/{user_id}/{uuid.uuid4()}-{file.filename}"

        # 2. Encryption (placeholder for actual encryption logic)
        encrypted_content = self._encrypt_data(file_content)

        # 3. Upload to S3
        if not self.s3_service.upload_file(encrypted_content, object_storage_key, file.content_type):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload document to storage")

        # 4. Store metadata in PostgreSQL
        document = self.document_repo.create_document(
            user_id=user_id,
            cafe_id=cafe_id,
            filename=file.filename,
            file_type=file.content_type,
            file_size=file_size,
            object_storage_key=object_storage_key,
            checksum=checksum,
            is_encrypted=True,
            tenant_id=tenant_id
        )
        return document

    def increment_open_count(self, document: Document) -> Document:
        if document.max_opens is not None and document.open_count >= document.max_opens:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Document has reached maximum open limit")
        document.open_count += 1
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return document

    def _validate_file(self, file: UploadFile) -> bool:
        # File size limit
        if file.size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            return False

        # MIME type validation (using python-magic for content-based detection)
        mime = magic.Magic(mime=True)
        detected_mime_type = mime.from_buffer(file.file.read(1024)) # Read first 1KB for magic byte detection
        file.file.seek(0) # Reset file pointer

        if detected_mime_type != file.content_type:
            # Mismatch between declared and detected MIME type
            return False
        
        # Add more specific file type checks if needed
        allowed_mime_types = ["application/pdf", "image/jpeg", "image/png", "text/plain"]
        if file.content_type not in allowed_mime_types:
            return False

        return True

    def _generate_checksum(self, data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()

    def _encrypt_data(self, data: bytes) -> bytes:
        # Placeholder for actual encryption logic (e.g., using AES)
        # For now, just return the data as is.
        # In a real application, you would use a library like cryptography.fernet
        return data

    def soft_delete_document(self, document_id: uuid.UUID, tenant_id: uuid.UUID) -> Document:
        document = self.document_repo.get_document_by_id(document_id)
        if not document or document.tenant_id != tenant_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
        if document.deleted_at:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document already soft-deleted")

        document.deleted_at = datetime.utcnow()
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        # TODO: Trigger a background job for permanent deletion after a retention period
        return document

    def _decrypt_data(self, data: bytes) -> bytes:
        # Placeholder for actual decryption logic
        return data
