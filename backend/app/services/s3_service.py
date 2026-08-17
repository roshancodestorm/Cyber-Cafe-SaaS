import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            region_name=settings.S3_REGION,
            # Add AWS credentials if not using IAM roles/profiles
            # aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            # aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        self.bucket_name = settings.S3_BUCKET_NAME

    def upload_file(self, file_content: bytes, object_name: str, content_type: str) -> bool:
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=object_name,
                Body=file_content,
                ContentType=content_type,
                ServerSideEncryption='AES256' # Ensure encryption at rest
            )
            return True
        except ClientError as e:
            logger.error(f"Failed to upload file to S3: {e}")
            return False

    def download_file(self, object_name: str) -> bytes | None:
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=object_name)
            return response["Body"].read()
        except ClientError as e:
            logger.error(f"Failed to download file from S3: {e}")
            return None

    def generate_presigned_url(self, object_name: str, expiration: int = 3600) -> str | None:
        """Generate a pre-signed URL to share an S3 object."""
        try:
            response = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": object_name},
                ExpiresIn=expiration,
            )
            return response
        except ClientError as e:
            logger.error(f"Failed to generate pre-signed URL: {e}")
            return None

    def delete_file(self, object_name: str) -> bool:
        """Delete a file from S3."""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_name)
            return True
        except ClientError as e:
            logger.error(f"Failed to delete file from S3: {e}")
            return False
