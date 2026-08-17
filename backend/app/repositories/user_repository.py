from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.security.password import get_password_hash
import uuid

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, user: UserCreate, tenant_id: uuid.UUID) -> User:
        hashed_password = get_password_hash(user.password)
        db_user = User(email=user.email, hashed_password=hashed_password, tenant_id=tenant_id,
                       first_name=user.first_name, last_name=user.last_name,
                       is_active=user.is_active, is_superuser=user.is_superuser)
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
