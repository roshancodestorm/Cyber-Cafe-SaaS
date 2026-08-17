import os
import uuid
import base64
from urllib.request import urlopen
from urllib.error import URLError

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, HttpUrl

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")


class ImageUrlRequest(BaseModel):
    image_url: HttpUrl


class ImageProcessResponse(BaseModel):
    message: str
    filename: str
    local_path: str
    base64_preview: str


def _ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post(
    "/process-url",
    response_model=ImageProcessResponse,
    status_code=status.HTTP_200_OK,
    summary="Fetch an image by URL, save locally, and return base64 preview",
)
def process_image_url(data: ImageUrlRequest):
    _ensure_upload_dir()

    try:
        with urlopen(str(data.image_url), timeout=15) as resp:
            image_bytes = resp.read()
    except (URLError, OSError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to fetch image: {exc}",
        )

    content_type = resp.headers.get("Content-Type", "image/jpeg")
    ext = "jpg"
    if "png" in content_type:
        ext = "png"
    elif "webp" in content_type:
        ext = "webp"
    elif "gif" in content_type:
        ext = "gif"

    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    b64 = base64.b64encode(image_bytes).decode("utf-8")

    return ImageProcessResponse(
        message="Image fetched and saved successfully",
        filename=filename,
        local_path=filepath,
        base64_preview=f"data:{content_type};base64,{b64}",
    )
