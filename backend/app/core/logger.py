import logging
from python_logging_json import setup_json_logging
from app.core.config import settings

def setup_logging():
    setup_json_logging(
        json_ensure_ascii=False,
        json_indent=2,
        json_default=str,
        level=settings.LOG_LEVEL,
        log_format="%(levelname)s %(name)s %(asctime)s %(filename)s:%(lineno)d %(message)s",
    )
    logging.getLogger("uvicorn").handlers = []
    logging.getLogger("uvicorn.access").handlers = []
    logging.getLogger("sqlalchemy").handlers = []
    logging.getLogger("alembic").handlers = []

    # Set log level for specific modules
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("boto3").setLevel(logging.WARNING)
    logging.getLogger("botocore").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)

    logger = logging.getLogger(__name__)
    logger.info("Logging configured.")
