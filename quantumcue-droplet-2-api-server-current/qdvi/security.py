from fastapi import HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from config import API_KEY_INTERNAL

INTERNAL_KEY_HEADER = APIKeyHeader(
    name="X-API-Key-Internal",
    scheme_name="InternalKey",
    auto_error=False,
)

def verify_internal_api_key(api_key: str = Security(INTERNAL_KEY_HEADER)) -> bool:
    """Verify internal API key."""
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing internal API key")
    if api_key != API_KEY_INTERNAL:
        raise HTTPException(status_code=403, detail="Invalid internal API key")
    return True

