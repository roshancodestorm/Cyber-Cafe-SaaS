from sqlalchemy.orm import Session
from app.models.document import Document
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

    def update(self, document: Document) -> Document:
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return document

    def list_by_tenant(self, tenant_id: uuid.UUID, skip: int = 0, limit: int = 50) -> list[Document]:
        return (
            self.db.query(Document)
            .filter(Document.tenant_id == tenant_id, Document.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
            .all()
        )
