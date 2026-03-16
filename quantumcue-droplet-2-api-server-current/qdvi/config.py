import os
import sys
import logging
from dotenv import load_dotenv

load_dotenv()

API_KEY_INTERNAL = os.getenv("API_KEY_INTERNAL")
if not API_KEY_INTERNAL:
    raise ValueError("API_KEY_INTERNAL missing from .env")

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


