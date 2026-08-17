from fastapi import APIRouter, Depends
from app.schemas.user import UserResponse
from app.api.v1.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
