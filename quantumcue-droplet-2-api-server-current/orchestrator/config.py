import os
import sys
import logging
from dotenv import load_dotenv

load_dotenv()

API_KEY_EXTERNAL = os.getenv("API_KEY_EXTERNAL")
API_KEY_INTERNAL = os.getenv("API_KEY_INTERNAL")
MICRO_80_URL     = os.getenv("MICRO_80_URL")
#QDVI_URL         = os.getenv("QDVI_URL")

#if not all([API_KEY_EXTERNAL, API_KEY_INTERNAL, QDVI_URL]):
if not all([API_KEY_EXTERNAL, API_KEY_INTERNAL]):
    raise RuntimeError("Missing .env variables")

ALLOWED_DATA_TYPES = {"images", "logical_AND"}
ALLOWED_ARCH       = {"DWave", "Dirac-1", "Dirac-3", "Classic_optimize", "AXB", "Simulator"}
ALLOWED_CLIENT_IDS = {"German123"}

WORK_DIR  = "work"
DATA_DIR  = "data"
MB        = 1024 * 1024
MAX_BYTES = 50 * MB

os.makedirs(WORK_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
    stream=sys.stderr,
    force=True,
)
logger = logging.getLogger(__name__)

