from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File
from pydantic import BaseModel
import logging
import os
import shutil
import httpx
from utils.spaces import download_dataset
from training.pipeline import train_placeholder_model, predict_sample

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="QuantumCue ML Worker", version="1.0.0")

class TrainJobRequest(BaseModel):
    job_id: str
    dataset_url: str
    dataset_type: str = "png"

DROPLET1_URL = os.getenv("DROPLET1_URL", "http://backend:8000")
API_KEY_INTERNAL = os.getenv("API_KEY_INTERNAL", "qckey_internal_v1_secure_8822")

@app.post("/worker/train")
async def worker_train(request: TrainJobRequest, background_tasks: BackgroundTasks):
    """Receive training job and handle it in background"""
    logger.info(f"Received job {request.job_id}")
    background_tasks.add_task(process_training_job, request)
    return {"status": "accepted", "job_id": request.job_id}

@app.post("/worker/predict/{job_id}")
async def worker_predict(job_id: str, file: UploadFile = File(...)):
    """Predict class for an uploaded image based on a previously trained job"""
    # In a real system, the work_dir for the job should be persistent or model saved
    # For Project 1 validation, we're using /tmp/worker/{job_id}
    work_dir = f"/tmp/worker/{job_id}"
    
    # Save uploaded file temporarily
    temp_img = f"/tmp/predict_{job_id}_{file.filename}"
    with open(temp_img, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        result = predict_sample(work_dir, temp_img)
        return result
    finally:
        if os.path.exists(temp_img):
            os.remove(temp_img)

async def process_training_job(request: TrainJobRequest):
    """Background task to download, train, and report"""
    work_dir = f"/tmp/worker/{request.job_id}"
    os.makedirs(work_dir, exist_ok=True)
    
    try:
        # 1. Download dataset
        success = await download_dataset(request.dataset_url, work_dir)
        if not success:
            await report_failure(request.job_id, "Failed to download dataset")
            return

        # 2. Update status to running
        await report_progress(request.job_id, progress=20)

        # 3. Train model
        metrics = train_placeholder_model(work_dir)
        
        # 4. Report success
        await report_success(request.job_id, metrics)
        
    except Exception as e:
        logger.error(f"Error processing job {request.job_id}: {e}")
        await report_failure(request.job_id, str(e))
    # Note: We DON'T delete work_dir here for Project 1 so we can test prediction
    # In production, we would save the model and then cleanup.

async def report_progress(job_id: str, progress: int):
    url = f"{DROPLET1_URL}/api/v1/jobs/{job_id}/progress"
    headers = {"X-API-KEY-INTERNAL": API_KEY_INTERNAL}
    async with httpx.AsyncClient() as client:
        try:
            await client.post(url, params={"progress_percentage": progress}, headers=headers)
        except Exception as e:
            logger.error(f"Failed to report progress: {e}")

async def report_success(job_id: str, metrics: dict):
    url = f"{DROPLET1_URL}/api/v1/jobs/{job_id}/training-metrics"
    headers = {"X-API-KEY-INTERNAL": API_KEY_INTERNAL}
    async with httpx.AsyncClient() as client:
        try:
            await client.post(url, json={"final_metrics": metrics}, headers=headers)
            logger.info(f"Reported success for job {job_id}")
        except Exception as e:
            logger.error(f"Failed to report success: {e}")

async def report_failure(job_id: str, error: str):
    logger.error(f"Job {job_id} failed: {error}")
    url = f"{DROPLET1_URL}/api/v1/jobs/{job_id}/fail"
    headers = {"X-API-KEY-INTERNAL": API_KEY_INTERNAL}
    async with httpx.AsyncClient() as client:
        try:
            await client.post(url, params={"error_message": error}, headers=headers)
            logger.info(f"Reported failure for job {job_id}")
        except Exception as e:
            logger.error(f"Failed to report failure: {e}")

@app.get("/health")
def health():
    return {"status": "healthy"}
