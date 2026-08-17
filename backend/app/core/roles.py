from enum import Enum

class UserRole(str, Enum):
    USER = "USER"
    CAFE_OWNER = "CAFE_OWNER"
    CAFE_STAFF = "CAFE_STAFF"
    SUPER_ADMIN = "SUPER_ADMIN"
