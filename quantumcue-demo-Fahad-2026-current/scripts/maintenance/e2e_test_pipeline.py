
import requests
import json
import time
import os
from uuid import uuid4
import asyncio
import httpx
from PIL import Image
import io
import zipfile

BASE_URL = "http://backend:8000/api/v1"

async def test_full_flow():
    print("Starting full E2E flow test (with JPG)...")
    
    # 1. Create a project (Submit Job)
    project_id = str(uuid4())
    payload = {
        "name": f"Test Project JPG {project_id[:8]}",
        "description": "Test project with JPG dataset",
        "job_type": "machine_learning",
        "provider_id": "787ea6dc-f881-4691-a334-c1b35a117e6a", # Rigetti (valid)
        "parameters": {"num_classes": 2, "test_data_percentage": 20}
    }
    
    from app.core.security import create_access_token
    # Use real user ID: efd6625d-85c2-4e6e-bf9f-1abdc1ceefd8
    token = create_access_token(subject="efd6625d-85c2-4e6e-bf9f-1abdc1ceefd8")
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        print("Creating project (submitting job)...")
        resp = await client.post(f"{BASE_URL}/projects/submit", json=payload, headers=auth_headers)
        if resp.status_code != 201:
            print(f"Error Detail: {resp.text}")
        resp.raise_for_status()
        job = resp.json()
        job_id = job["id"]
        dataset_id = job["dataset_id"]
        print(f"Project created. Job ID: {job_id}, Dataset ID: {dataset_id}")
        
        # 2. Upload dataset (using raw binary)
        print(f"Uploading JPG dataset (raw binary)...")
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for i in range(5):
                img = Image.new('RGB', (60, 30), color = (73, 109, 137))
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='JPEG')
                zip_file.writestr(f"class_a/image_{i}.jpg", img_byte_arr.getvalue())
            for i in range(5):
                img = Image.new('RGB', (60, 30), color = (255, 0, 0))
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='JPEG')
                zip_file.writestr(f"class_b/image_{i}.jpg", img_byte_arr.getvalue())
        
        upload_url = f"{BASE_URL}/datasets/{dataset_id}/upload"
        raw_headers = auth_headers.copy()
        raw_headers["Content-Type"] = "application/zip"
        raw_headers["X-Filename"] = "test_dataset.zip"
        
        resp = await client.post(upload_url, content=zip_buffer.getvalue(), headers=raw_headers, timeout=60.0)
        if resp.status_code != 200:
            print(f"Upload Error Response: {resp.text}")
        resp.raise_for_status()
        print("Dataset uploaded successfully!")
        
        # 3. Manually submit the job (since it was deferred)
        print(f"Submitting job {job_id} for execution...")
        resp = await client.post(f"{BASE_URL}/jobs/{job_id}/submit", headers=auth_headers)
        resp.raise_for_status()
        print("Job submitted successfully!")
        
        # 4. Wait for job to complete
        print(f"Monitoring job {job_id}...")
        for _ in range(60):
            resp = await client.get(f"{BASE_URL}/jobs/{job_id}", headers=auth_headers)
            job_status_data = resp.json()
            status = job_status_data["status"]
            print(f"Job Status: {status}, Progress: {job_status_data.get('progress_percentage')}%")
            if status == "completed":
                break
            if status == "failed":
                print(f"Job FAILED: {job_status_data.get('error_message') or job_status_data.get('error')}")
                return
            await asyncio.sleep(5)
            
        # 5. Run prediction
        print("Finding created model...")
        resp = await client.get(f"{BASE_URL}/models", params={"training_job_id": job_id}, headers=auth_headers)
        models_list = resp.json()["models"]
        if not models_list:
            print("Error: Model not found in database after job completion")
            return
        model_id = models_list[0]["id"]
        print(f"Model ID: {model_id}")
        
        print("Testing prediction with JPG...")
        img = Image.new('RGB', (60, 30), color = (73, 109, 137))
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)
        
        files = {"file": ("test_image.jpg", img_byte_arr, "image/jpeg")}
        resp = await client.post(f"{BASE_URL}/models/{model_id}/predict", files=files, headers=auth_headers)
        if resp.status_code != 201:
            print(f"Prediction Error: {resp.text}")
        resp.raise_for_status()
        result = resp.json()
        
        prediction = result["output_data"]["prediction"]
        confidence = result["output_data"]["confidence"]
        print(f"RESULT: Prediction={prediction}, Confidence={confidence}")
        
        if prediction in ['class_a', 'class_b']:
            print("SUCCESS: End-to-end flow verified with JPG and valid classification!")
        else:
            print(f"FAILURE: Prediction is {prediction}. Expected class_a or class_b.")

if __name__ == "__main__":
    import sys
    sys.path.append("/app")
    asyncio.run(test_full_flow())
