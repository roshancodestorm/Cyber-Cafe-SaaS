from fastapi import FastAPI
from app.api.v1 import auth, users, documents, permissions, cafes, jobs, print_queue, notifications, image, payments
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json"
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(permissions.router, prefix="/api/v1/permissions", tags=["Permissions"])
app.include_router(cafes.router, prefix="/api/v1/cafes", tags=["Cafes & Discovery"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(print_queue.router, prefix="/api/v1/print", tags=["Print Queue"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(image.router, prefix="/api/v1/images", tags=["Images"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])


@app.get("/api/v1/health", tags=["Health Check"])
async def health_check():
    return {"status": "healthy"}
