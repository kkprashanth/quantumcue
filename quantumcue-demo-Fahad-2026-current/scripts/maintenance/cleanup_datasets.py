
import asyncio
import boto3
from botocore.client import Config
import os
import re
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.dataset import Dataset, DatasetStatus
from app.config import settings
from app.utils.filename import sanitize_filename

async def cleanup_datasets():
    # Initialize Spaces client
    session = boto3.session.Session()
    client = session.client(
        's3',
        region_name=settings.SPACES_REGION,
        endpoint_url=settings.SPACES_ENDPOINT,
        aws_access_key_id=settings.SPACES_ACCESS_KEY,
        aws_secret_access_key=settings.SPACES_SECRET_KEY,
        config=Config(signature_version='s3v4')
    )
    bucket = settings.SPACES_BUCKET

    async with AsyncSessionLocal() as db:
        # Find all ready datasets
        query = select(Dataset).where(Dataset.status == DatasetStatus.READY)
        result = await db.execute(query)
        datasets = result.scalars().all()
        
        print(f"Checking {len(datasets)} ready datasets...")
        
        for dataset in datasets:
            old_path = dataset.file_path
            if not old_path:
                continue
            
            # parts: datasets, id, filename
            parts = old_path.split('/')
            if len(parts) < 3:
                continue
            
            filename = parts[-1]
            sanitized = sanitize_filename(filename)
            
            if sanitized != filename:
                new_path = "/".join(parts[:-1] + [sanitized])
                print(f"Renaming {old_path} to {new_path} in Spaces...")
                
                try:
                    # Copy object to new key
                    client.copy_object(
                        Bucket=bucket,
                        CopySource={'Bucket': bucket, 'Key': old_path},
                        Key=new_path
                    )
                    # Delete old object
                    client.delete_object(Bucket=bucket, Key=old_path)
                    
                    # Update database
                    dataset.file_path = new_path
                    
                    # Re-generate presigned URL
                    print(f"Updating database for dataset {dataset.id}...")
                    url = client.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': bucket, 'Key': new_path},
                        ExpiresIn=3600 * 24 * 7 # 7 days
                    )
                    
                    if dataset.custom_metadata is None:
                        dataset.custom_metadata = {}
                    dataset.custom_metadata["dataset_url"] = url
                    dataset.custom_metadata["original_filename"] = sanitized
                    
                    await db.commit()
                    print(f"Successfully updated dataset {dataset.id}")
                except Exception as e:
                    print(f"Failed to update dataset {dataset.id}: {e}")
            else:
                print(f"Dataset {dataset.id} filename is already sanitized: {filename}")

if __name__ == "__main__":
    asyncio.run(cleanup_datasets())
