import boto3
from botocore.client import Config
import os
from dotenv import load_dotenv

load_dotenv('c:/Users/Admin/Desktop/New folder (10)/quantumcue-demo-Fahad-2026-current/backend/.env')

def create_bucket():
    endpoint = os.getenv('SPACES_ENDPOINT')
    region = os.getenv('SPACES_REGION')
    bucket = os.getenv('SPACES_BUCKET')
    access_key = os.getenv('SPACES_ACCESS_KEY')
    secret_key = os.getenv('SPACES_SECRET_KEY')
    
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
        print(f"Attempting to create bucket: {bucket} at {endpoint}...")
        client.create_bucket(Bucket=bucket)
        print("Success! Bucket created.")
        return True
    except client.exceptions.BucketAlreadyExists:
        print("Bucket already exists.")
        return True
    except client.exceptions.BucketAlreadyOwnedByYou:
        print("Bucket already owned by you.")
        return True
    except Exception as e:
        print(f"Failed to create bucket: {e}")
        return False

if __name__ == "__main__":
    create_bucket()
