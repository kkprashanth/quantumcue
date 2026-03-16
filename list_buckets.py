import boto3
from botocore.client import Config
import os
from dotenv import load_dotenv

load_dotenv('c:/Users/Admin/Desktop/New folder (10)/quantumcue-demo-Fahad-2026-current/backend/.env')

def list_buckets():
    endpoint = os.getenv('SPACES_ENDPOINT')
    region = os.getenv('SPACES_REGION')
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
        response = client.list_buckets()
        print("Available buckets:")
        for bucket in response['Buckets']:
            print(f"- {bucket['Name']}")
        return True
    except Exception as e:
        print(f"Failed to list buckets: {e}")
        return False

if __name__ == "__main__":
    list_buckets()
