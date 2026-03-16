import os
import boto3
from botocore.client import Config
from dotenv import load_dotenv

load_dotenv('c:/Users/Admin/Desktop/New folder (10)/quantumcue-demo-Fahad-2026-current/backend/.env')

def check_bucket(bucket_name):
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
        print(f"Listing files in bucket: {bucket_name}")
        response = client.list_objects_v2(Bucket=bucket_name)
        if 'Contents' in response:
            for obj in response['Contents']:
                print(f"- {obj['Key']} ({obj['Size']} bytes)")
        else:
            print(f"Bucket {bucket_name} is empty or not found.")
    except Exception as e:
        print(f"Failed to access bucket {bucket_name}: {e}")

if __name__ == "__main__":
    check_bucket('quantumcue-data')
