from datetime import timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.repositories.user_repository import UserRepository
from app.security.jwt import create_access_token, verify_token
from app.security.password import verify_password
from app.schemas.token import Token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/token")

class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def authenticate_user(self, email: str, password: str, tenant_id: str) -> Token:
        user = self.user_repo.get_user_by_email(email)
        if not user or not verify_password(password, user.hashed_password) or str(user.tenant_id) != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "tenant_id": str(user.tenant_id), "user_id": str(user.id), "is_superuser": user.is_superuser},
            expires_delta=access_token_expires
        )
        return Token(access_token=access_token, token_type="bearer")

    def get_current_user(self, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        payload = verify_token(token, credentials_exception)
        email: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id")
        user_id: str = payload.get("user_id")
        is_superuser: bool = payload.get("is_superuser")

        if email is None or tenant_id is None or user_id is None:
            raise credentials_exception

        user = self.user_repo.get_user_by_id(user_id)
        if user is None or str(user.tenant_id) != tenant_id or user.email != email or user.is_superuser != is_superuser:
            raise credentials_exception
        return user
