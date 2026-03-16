import boto3
from botocore.client import Config
import os
from dotenv import load_dotenv

# Load .env from the backend directory
load_dotenv('c:/Users/Admin/Desktop/New folder (10)/quantumcue-demo-Fahad-2026-current/backend/.env')

def verify_connection():
    endpoint = os.getenv('SPACES_ENDPOINT')
    region = os.getenv('SPACES_REGION')
    bucket = os.getenv('SPACES_BUCKET')
    access_key = os.getenv('SPACES_ACCESS_KEY')
    secret_key = os.getenv('SPACES_SECRET_KEY')
    
    print(f"Testing connection to {endpoint} in region {region}...")
    print(f"Bucket: {bucket}")
    
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
        # Lists objects in the bucket
        response = client.list_objects_v2(Bucket=bucket, MaxKeys=5)
        print("Success! Connection established.")
        if 'Contents' in response:
            print("Found objects in bucket:")
            for obj in response['Contents']:
                print(f"- {obj['Key']}")
        else:
            print("Bucket is empty.")
        return True
    except Exception as e:
        print(f"Connection failed: {e}")
        return False

if __name__ == "__main__":
    verify_connection()
