import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.document import Document
from app.services.s3_service import S3Service

logger = logging.getLogger(__name__)

class DocumentDeletionWorker:
    def __init__(self):
        self.s3_service = S3Service()
        self.retention_period_days = 30 # Documents will be permanently deleted after 30 days of soft-deletion

    def run(self):
        logger.info("Document deletion worker started.")
        db: Session = SessionLocal()
        try:
            self._process_documents_for_deletion(db)
        finally:
            db.close()
        logger.info("Document deletion worker finished.")

    def _process_documents_for_deletion(self, db: Session):
        cutoff_date = datetime.utcnow() - timedelta(days=self.retention_period_days)
        documents_to_delete = db.query(Document).filter(
            Document.deleted_at.isnot(None),
            Document.deleted_at < cutoff_date
        ).all()

        for document in documents_to_delete:
            try:
                # Delete from S3
                if self.s3_service.delete_file(document.object_storage_key):
                    # Delete metadata from DB
                    db.delete(document)
                    db.commit()
                    logger.info(f"Permanently deleted document {document.id} from S3 and DB.")
                else:
                    logger.error(f"Failed to delete document {document.id} from S3. Retrying later.")
            except Exception as e:
                db.rollback()
                logger.error(f"Error during permanent deletion of document {document.id}: {e}")


if __name__ == "__main__":
    worker = DocumentDeletionWorker()
    worker.run()
