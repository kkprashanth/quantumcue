import os
import boto3
from botocore.client import Config
from dotenv import load_dotenv

load_dotenv('c:/Users/Admin/Desktop/New folder (10)/quantumcue-demo-Fahad-2026-current/backend/.env')

def list_all_files():
    endpoint = os.getenv('SPACES_ENDPOINT')
    region = os.getenv('SPACES_REGION')
    access_key = os.getenv('SPACES_ACCESS_KEY')
    secret_key = os.getenv('SPACES_SECRET_KEY')
    bucket_name = os.getenv('SPACES_BUCKET')

    session = boto3.session.Session()
    client = session.client(
        's3',
        region_name=region,
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version='s3v4')
    )

    try:
        print(f"Listing internal files in bucket: {bucket_name}")
        paginator = client.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=bucket_name)

        found = False
        for page in pages:
            if 'Contents' in page:
                for obj in page['Contents']:
                    print(f"- {obj['Key']} ({obj['Size']} bytes)")
                    found = True
        
        if not found:
            print("No files found in bucket.")
            
    except Exception as e:
        print(f"Failed to list files: {e}")

if __name__ == "__main__":
    list_all_files()
