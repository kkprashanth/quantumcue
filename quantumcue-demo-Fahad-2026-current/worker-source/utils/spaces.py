import httpx
import os
import zipfile
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

async def download_dataset(url: str, target_dir: str):
    """Download and extract dataset from presigned URL"""
    os.makedirs(target_dir, exist_ok=True)
    zip_path = Path(target_dir) / "dataset.zip"
    
    logger.info(f"Downloading dataset from {url}")
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=60.0)
            resp.raise_for_status()
            with open(zip_path, "wb") as f:
                f.write(resp.content)
            logger.info(f"Downloaded zip to {zip_path}")
            
            # Extract
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(target_dir)
            logger.info(f"Extracted dataset to {target_dir}")
            
            # Clean up zip
            os.remove(zip_path)
            return True
        except Exception as e:
            if 'resp' in locals():
                logger.error(f"Failed to download dataset. Status: {resp.status_code}")
                logger.debug(f"Response body: {resp.text}")
            logger.error(f"Failed to download/extract dataset: {e}")
            return False
