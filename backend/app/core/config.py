from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Cyber Cafe SaaS Backend"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "API for Cyber Cafe SaaS project"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "postgresql+pg8000://user:password@db:5432/cybercafe"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    GOOGLE_CLIENT_ID: str = "your-google-client-id"
    GOOGLE_CLIENT_SECRET: str = "your-google-client-secret"
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    LOG_LEVEL: str = "INFO"

    # S3/Object Storage settings
    S3_BUCKET_NAME: str = "cyber-cafe-documents"
    S3_REGION: str = "us-east-1"
    DOCUMENT_ENCRYPTION_KEY: str = "a-very-secret-key-for-document-encryption-32-bytes"
    MAX_FILE_SIZE_MB: int = 10 # Maximum file size for documents in MB

    # Razorpay
    RAZORPAY_KEY_ID: str = "rzp_test_xxxxxxxxxxxxx"
    RAZORPAY_KEY_SECRET: str = "xxxxxxxxxxxxxxxxxxxxxxxx"
    RAZORPAY_WEBHOOK_SECRET: str = "your_webhook_secret"

settings = Settings()
