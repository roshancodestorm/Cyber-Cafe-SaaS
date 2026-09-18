import io
import json
import uuid
import hashlib
from datetime import datetime
import magic  # python-magic
from typing import IO, Optional, Tuple, Dict, Any
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from PIL import Image
import cv2
import numpy as np

from app.core.config import settings
from app.models.document import Document
from app.repositories.document_repository import DocumentRepository
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

    def assess_document_quality(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Analyze document quality: blur, brightness, contrast, noise, rotation, edges.
        Returns quality score and diagnostic information.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # 1. Blur detection via Laplacian variance
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        is_blurry = laplacian_var < 100
        
        # 2. Brightness check
        mean_brightness = np.mean(gray)
        is_dark = mean_brightness < 100
        is_overexposed = mean_brightness > 200
        
        # 3. Rotation/skew detection
        edges = cv2.Canny(gray, 50, 150)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=100, maxLineGap=10)
        avg_angle = 0
        is_tilted = False
        if lines is not None:
            angles = [np.degrees(np.arctan2(line[3] - line[1], line[2] - line[0])) for line in lines]
            if angles:
                avg_angle = np.median(angles)
                is_tilted = abs(avg_angle) > 5
        
        # 4. Compute overall quality score (0-100)
        score = 100
        score -= 20 if is_blurry else 0
        score -= 20 if is_dark else 0
        score -= 20 if is_tilted else 0
        quality_score = max(0, min(100, score))
        
        return {
            "quality_score": quality_score,
            "is_blurry": is_blurry,
            "is_dark": is_dark,
            "is_overexposed": is_overexposed,
            "is_tilted": is_tilted,
            "avg_angle": round(avg_angle, 2),
            "laplacian_var": int(laplacian_var),
        }

    def enhance_document(self, image: np.ndarray, quality_score: int) -> np.ndarray:
        """
        Apply enhancement pipeline based on quality assessment.
        Returns the enhanced image.
        """
        enhanced = image.copy()
        
        # If quality is very low, apply all enhancements
        if quality_score < 40:
            # 1. Perspective correction - detect document contours
            gray = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edged = cv2.Canny(blurred, 75, 200)
            contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Find the largest contour (assumed to be the document)
                largest_contour = max(contours, key=cv2.contourArea)
                epsilon = 0.02 * cv2.arcLength(largest_contour, True)
                approx = cv2.approxPolyDP(largest_contour, epsilon, True)
                
                if len(approx) == 4:
                    # Four-point perspective transform
                    pts = approx.reshape(4, 2)
                    (tl, tr, br, bl) = pts
                    
                    # Compute width and height of the document
                    width_a = np.sqrt((br[0] - bl[0]) ** 2 + (br[1] - bl[1]) ** 2)
                    width_b = np.sqrt((tr[0] - tl[0]) ** 2 + (tr[1] - tl[1]) ** 2)
                    max_width = int(max(width_a, width_b))
                    
                    height_a = np.sqrt((tr[0] - br[0]) ** 2 + (tr[1] - br[1]) ** 2)
                    height_b = np.sqrt((tl[0] - bl[0]) ** 2 + (tl[1] - bl[1]) ** 2)
                    max_height = int(max(height_a, height_b))
                    
                    # Set the destination points for the perspective transform
                    dst = np.array([
                        [0, 0],
                        [max_width - 1, 0],
                        [max_width - 1, max_height - 1],
                        [0, max_height - 1]], dtype="float32")
                    
                    # Compute the perspective transform matrix and apply it
                    M = cv2.getPerspectiveTransform(pts.astype("float32"), dst)
                    enhanced = cv2.warpPerspective(enhanced, M, (max_width, max_height))
        
        # 2. If low resolution, upscale
        if self._is_low_resolution(enhanced):
            enhanced = cv2.resize(enhanced, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        
        # 3. Denoising
        enhanced = cv2.fastNlMeansDenoisingColored(enhanced, None, 10, 10, 7, 21)
        
        # 4. Brightness and contrast correction
        enhanced = cv2.convertScaleAbs(enhanced, alpha=1.2, beta=10)
        
        # 5. Edge enhancement (sharpening)
        kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        enhanced = cv2.filter2D(enhanced, -1, kernel)
        
        return enhanced

    def _is_low_resolution(self, image: np.ndarray) -> bool:
        """Check if image resolution is below acceptable threshold."""
        h, w = image.shape[:2]
        return w < 1000 or h < 1000

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
