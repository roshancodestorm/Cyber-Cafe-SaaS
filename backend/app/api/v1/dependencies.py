from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.roles import UserRole
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService, oauth2_scheme
from app.models.user import User

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)
    user = auth_service.get_current_user(token, HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    ))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def require_role(role: UserRole):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superuser:
            return current_user
        # In a real application, roles would be managed more dynamically, e.g., through a many-to-many relationship
        # For now, we'll assume a simple string comparison for demonstration.
        # This needs to be expanded to check against the actual roles assigned to the user.
        # For example, if a user has a 'roles' attribute that is a list of UserRole enums.
        # For the current User model, we only have is_superuser. We need to extend the User model or create a UserRole model.
        # For now, let's assume a user's role is determined by their `is_superuser` flag or other attributes.
        # This part will be refined when we implement proper RBAC.
        if role == UserRole.SUPER_ADMIN and not current_user.is_superuser:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        # Add more role checks here as needed
        return current_user
    return role_checker
