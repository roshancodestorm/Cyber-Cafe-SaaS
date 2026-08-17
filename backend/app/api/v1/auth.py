from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import uuid

from app.core.database import get_db
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_create: UserCreate, db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    existing_user = user_repo.get_user_by_email(user_create.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    # For simplicity, tenant_id is generated here. In a real app, it might come from context or another service.
    tenant_id = uuid.uuid4()
    new_user = user_repo.create_user(user_create, tenant_id)
    return UserResponse.from_orm(new_user)

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)
    # For simplicity, tenant_id is assumed to be part of the username for now (e.g., "email@domain.com:tenant_id")
    # In a real application, tenant_id would be passed via a header or subdomain.
    try:
        email, tenant_id_str = form_data.username.split(":")
        token = auth_service.authenticate_user(email, form_data.password, tenant_id_str)
        return token
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be in the format 'email:tenant_id'"
        )
