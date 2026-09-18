import io
import uuid
from datetime import datetime, timedelta

import cv2
import fitz  # PyMuPDF
import numpy as np
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from PIL import Image
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.schemas.document import (
    DocumentResponse,
    WatermarkInfo,
    WatermarkRemovalRequest,
    EnhancementResult,
)
from app.services.document_service import DocumentService
from app.services.s3_service import S3Service
from app.services.watermark_service import WatermarkService
from app.services.security_service import (
    check_document_expired,
    generate_access_token,
    verify_access_token,
    DOCUMENT_EXPIRY_HOURS,
)
from app.repositories.document_repository import DocumentRepository

router = APIRouter()


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s3_service = S3Service()
    document_service = DocumentService(db, s3_service)
    document = await document_service.upload_document(
        file, current_user.id, current_user.tenant_id, cafe_id=None
    )
    return DocumentResponse.from_orm(document)


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document_repo = DocumentRepository(db)
    document_service = DocumentService(db, S3Service())
    document = document_repo.get_document_by_id(document_id)
    if not document or document.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Lazy 24-hour auto-expiry enforcement (PRD section 20, feature 5)
    document = check_document_expired(document)
    if document.status == "EXPIRED":
        document_repo.update(document)
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Document expired (24-hour policy)")

    document = document_service.increment_open_count(document)
    return DocumentResponse.from_orm(document)


@router.get("/{document_id}/watermark-info", response_model=WatermarkInfo)
async def get_watermark_info(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document_repo = DocumentRepository(db)
    document = document_repo.get_document_by_id(document_id)
    if not document or document.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    watermark_service = WatermarkService(document_repo, S3Service())
    return watermark_service.get_watermark_info(document)


@router.post("/{document_id}/watermark", response_model=WatermarkInfo)
async def add_watermark(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add watermark to document. Free documents get the app watermark (cafe name if available)."""
    document_repo = DocumentRepository(db)
    document = document_repo.get_document_by_id(document_id)
    if not document or document.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if document.watermark_status == "paid":
        raise HTTPException(status_code=400, detail="Document already has watermark removed")

    watermark_service = WatermarkService(document_repo, S3Service())
    watermark_service.add_watermark(document, cafe_name=None)
    return watermark_service.get_watermark_info(document)


@router.post("/{document_id}/remove-watermark", response_model=WatermarkRemovalRequest)
async def remove_watermark(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a payment quote for watermark removal. Clean version is generated only after verified payment."""
    document_repo = DocumentRepository(db)
    document = document_repo.get_document_by_id(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.watermark_status == "paid":
        return WatermarkRemovalRequest(
            document_id=str(document_id),
            removal_price_inr=0,
            payment_required=False,
            message="Watermark already removed via previous payment",
        )

    if document.watermark_status != "active":
        raise HTTPException(status_code=400, detail="Document has no active watermark")

    return WatermarkRemovalRequest(
        document_id=str(document_id),
        removal_price_inr=10,
        payment_required=True,
        message="Payment required to remove watermark",
    )


@router.post("/{document_id}/enhance", response_model=EnhancementResult)
async def enhance_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Assess and enhance document quality using the image processing pipeline."""
    document_repo = DocumentRepository(db)
    document = document_repo.get_document_by_id(document_id)
    if not document or document.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Document not found")

    document_service = DocumentService(db, S3Service())
    pdf_bytes = document_service.s3_service.download_file(document.object_storage_key)
    if not pdf_bytes:
        raise HTTPException(status_code=404, detail="Document not found in storage")

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    enhanced_pages = []
    quality_score = 100

    for page_num in range(len(doc)):
        page = doc[page_num]
        pix = page.get_pixmap()
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        if pix.n == 4:
            img = img[:, :, :3]

        quality = document_service.assess_document_quality(img)
        quality_score = min(quality_score, quality["quality_score"])

        if quality["quality_score"] < 70:
            enhanced = document_service.enhance_document(img, quality["quality_score"])
            enhanced_pil = Image.fromarray(cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB))
        else:
            enhanced_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        enhanced_pages.append(enhanced_pil)

    doc.close()

    output_buffer = io.BytesIO()
    if enhanced_pages:
        enhanced_pages[0].save(
            output_buffer, format="PDF", save_all=True, append_images=enhanced_pages[1:]
        )
    pdf_bytes_out = output_buffer.getvalue()

    enhanced_key = (
        f"enhanced/{document.tenant_id}/{document.user_id}/{uuid.uuid4()}-enhanced.pdf"
    )
    document_service.s3_service.upload_file(pdf_bytes_out, enhanced_key, "application/pdf")

    document.status = "enhanced"
    document.object_storage_key = enhanced_key
    document_repo.update(document)

    return EnhancementResult(
        enhanced_document_key=enhanced_key,
        original_quality_score=quality_score,
        enhancement_applied=quality_score < 70,
        text_extracted=False,
        message="Document enhanced and stored successfully",
    )


def _get_owned_document(db: Session, document_id: uuid.UUID, user: User):
    repo = DocumentRepository(db)
    document = repo.get_document_by_id(document_id)
    if not document or document.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.get("/{document_id}/policy")
async def get_document_policy(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the composed document security policy (FR-03)."""
    from app.models.permission import Permission

    document = _get_owned_document(db, document_id, current_user)
    document = check_document_expired(document)

    grant = (
        db.query(Permission)
        .filter(
            Permission.document_id == document.id,
            Permission.user_id == current_user.id,
            Permission.is_active == True,  # noqa: E712
        )
        .order_by(Permission.created_at.desc())
        .first()
    )

    is_owner = document.user_id == current_user.id
    expires_at = None
    if document.created_at:
        expires_at = (
            document.created_at + timedelta(hours=DOCUMENT_EXPIRY_HOURS)
        ).isoformat()

    return {
        "document_id": str(document.id),
        "view_allowed": bool(is_owner or (grant and grant.can_view)),
        "print_allowed": bool(is_owner or (grant and grant.can_print)),
        "download_allowed": False,  # platform rule: downloads disabled for cafes
        "share_allowed": False,  # platform rule: sharing disabled
        "max_opens": document.max_opens,
        "current_opens": document.open_count or 0,
        "expires_at": expires_at,
        "watermark_enabled": document.watermark_status == "active",
        "status": document.status or "UPLOADED",
    }


@router.put("/{document_id}/policy")
async def update_document_policy(
    document_id: uuid.UUID,
    policy: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Owner updates configurable policy fields (max_opens, watermark)."""
    document = _get_owned_document(db, document_id, current_user)
    if document.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the document owner can change the policy")

    if "max_opens" in policy:
        value = policy["max_opens"]
        if value is not None and (not isinstance(value, int) or value < 1 or value > 100):
            raise HTTPException(status_code=400, detail="max_opens must be an integer between 1 and 100")
        document.max_opens = value

    if "watermark_enabled" in policy:
        document.watermark_status = "active" if policy["watermark_enabled"] else "removed"

    DocumentRepository(db).update(document)
    return {"status": "updated", "document_id": str(document.id)}


@router.post("/{document_id}/access")
async def create_document_access_session(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a short-lived secure access session for viewing a document (FR-06)."""
    from app.models.permission import Permission

    document = _get_owned_document(db, document_id, current_user)
    document = check_document_expired(document)

    if document.status == "EXPIRED":
        raise HTTPException(status_code=410, detail="Document expired")
    if document.status == "LOCKED":
        raise HTTPException(status_code=423, detail="Document is locked")

    if document.user_id != current_user.id:
        grant = (
            db.query(Permission)
            .filter(
                Permission.document_id == document.id,
                Permission.user_id == current_user.id,
                Permission.is_active == True,  # noqa: E712
            )
            .first()
        )
        if not grant or not grant.can_view:
            raise HTTPException(status_code=403, detail="View permission required")

    if document.max_opens is not None and (document.open_count or 0) >= document.max_opens:
        raise HTTPException(status_code=403, detail="Maximum open limit reached")

    return generate_access_token(document.id, current_user.id, settings.SECRET_KEY)


@router.post("/{document_id}/access/verify")
async def verify_document_access_session(
    document_id: uuid.UUID,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Validate a secure access token before serving document content."""
    document = _get_owned_document(db, document_id, current_user)
    token = (data or {}).get("access_token", "")
    try:
        verify_access_token(token, document.id, current_user.id, settings.SECRET_KEY)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    return {"valid": True, "document_id": str(document.id)}
