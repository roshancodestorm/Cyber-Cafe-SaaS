from sqlalchemy.orm import Session
from app.models.document import Document
from app.schemas.document import DocumentCreate
import uuid

class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_document_by_id(self, document_id: uuid.UUID) -> Document | None:
        return self.db.query(Document).filter(Document.id == document_id).first()

    def create_document(self, **kwargs) -> Document:
        db_document = Document(**kwargs)
        self.db.add(db_document)
        self.db.commit()
        self.db.refresh(db_document)
        return db_document
