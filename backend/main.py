from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, users, documents, permissions, cafes, jobs, print_queue, notifications, image, payments, security, audit
from app.core.config import settings
from app import models

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.31.248:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(security.router, prefix="/api/v1/security", tags=["Security & QR"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["Audit"])


@app.get("/api/v1/health", tags=["Health Check"])
async def health_check():
    return {"status": "healthy"}
