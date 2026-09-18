import io
import uuid
from typing import Optional, List
from io import BytesIO

from fastapi import HTTPException, status
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER

from app.models.document import Document


class WatermarkService:
    """Service for adding and removing watermarks from documents."""

    def __init__(self, db_repo=None, s3_service=None):
        self.db_repo = db_repo
        self.s3_service = s3_service

    def add_watermark(
        self,
        document: Document,
        cafe_name: Optional[str] = None,
        cafe_logo: Optional[bytes] = None,
    ) -> bytes:
        """Add watermark to a document's PDF content. Returns watermarked PDF bytes."""
        original_pdf = self.s3_service.download_file(document.object_storage_key)
        if not original_pdf:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found in storage",
            )

        watermarked_pdf = self._apply_watermark_pdf(original_pdf, cafe_name, cafe_logo)

        document.watermark_type = "both" if cafe_name else "app"
        document.watermark_status = "active"
        if self.db_repo:
            self.db_repo.update(document)

        return watermarked_pdf

    def remove_watermark(self, document: Document, payment_verified: bool = False):
        """Remove watermark from document after payment verification."""
        if not payment_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Payment verification required to remove watermark",
            )

        document.watermark_status = "paid"
        document.payment_id = f"paid_{uuid.uuid4().hex[:12]}"
        document.clean_document_key = (
            f"clean/{document.tenant_id}/{document.user_id}/{uuid.uuid4()}-{document.filename}"
        )
        if self.db_repo:
            self.db_repo.update(document)

        return document

    def _apply_watermark_pdf(
        self, original_pdf: bytes, cafe_name: Optional[str], cafe_logo: Optional[bytes]
    ) -> bytes:
        """Apply a diagonal repeated watermark pattern using ReportLab."""
        output_buffer = BytesIO()
        page_size = LETTER

        c = canvas.Canvas(output_buffer, pagesize=page_size)
        width, height = page_size

        # Repeated diagonal pattern across the page
        label = "CYBER CAFE SAAS"
        if cafe_name:
            label = f"{cafe_name.upper()}  •  {label}"

        c.saveState()
        c.setFillColor(colors.grey, alpha=0.18)
        c.setFont("Helvetica-Bold", 28)
        step_x, step_y = 260, 180
        for x in range(-width, width * 2, step_x):
            for y in range(-height, height * 2, step_y):
                c.saveState()
                c.translate(x, y)
                c.rotate(45)
                c.drawString(0, 0, label)
                c.restoreState()
        c.restoreState()

        c.showPage()
        c.save()
        return output_buffer.getvalue()

    def get_watermark_info(self, document: Document) -> dict:
        """Return watermark information for frontend display."""
        return {
            "watermark_type": document.watermark_type or "none",
            "watermark_status": document.watermark_status or "none",
            "opacity": document.watermark_opacity or 18,
            "has_clean_version": document.watermark_status == "paid",
            "payment_verified": document.watermark_status == "paid",
        }
