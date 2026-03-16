from typing import Optional
from fastapi import HTTPException, Security, Header
from fastapi.security.api_key import APIKeyHeader
from config import API_KEY_EXTERNAL, MAX_BYTES

EXTERNAL_KEY_HEADER = APIKeyHeader(
    name="X-API-Key-External",
    scheme_name="ExternalKey",
    auto_error=False,
)

def verify_external_api_key(api_key: str = Security(EXTERNAL_KEY_HEADER)) -> bool:
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing external API key")
    if api_key != API_KEY_EXTERNAL:
        raise HTTPException(status_code=403, detail="Invalid external API key")
    return True

def enforce_content_length(
    content_length: Optional[int] = Header(None, alias="Content-Length")
) -> None:
    if content_length is not None and content_length > MAX_BYTES:
        raise HTTPException(413, "Upload too large")


