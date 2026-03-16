#!/usr/bin/env python3
"""
Orchestrator — entry point.
All logic lives in: config.py, security.py, validation.py, job_store.py, pipeline.py
"""

import os
import shutil
import time
import logging
from typing import Any, Dict

import uvicorn
from fastapi import (
    FastAPI, BackgroundTasks, Depends, File, Form, Header, HTTPException, UploadFile
)

from config import WORK_DIR, DATA_DIR, ALLOWED_CLIENT_IDS
from security import verify_external_api_key, enforce_content_length
from validation import validate_request_envelope, parse_params, validate_params_for_arch
from job_store import JOBS, job_update
from pipeline import process_job, build_ml_result_payload

import sys
#sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append("./modules")
import helper
import random

logger = logging.getLogger(__name__)

app = FastAPI(title="QDVI Orchestrator", version="0.0.3")

@app.post(
    "/external/api/v0/results",
    dependencies=[Depends(verify_external_api_key)],
)
def get_ml_results_v0(
    body: dict,
    x_client_id: str = Header(...),
) -> Dict[str, Any]:
    """
    DEBUG/SYNTHETIC endpoint (v0).
    - Accepts any job_id without checking JOBS store.
    - 50% chance returns full synthetic ML payload.
    - 50% chance returns 'not ready' status.

    Returns full v1.1 schema.
    
    POST body: { "job_id": "...", "num_classes": 4 }
    
    CURL call:
        curl -s -X POST http://localhost:8000/external/api/v0/results \
          -H "Content-Type: application/json" \
          -H "X-API-Key-External: qc_12345" \
          -H "X-Client-Id: German123" \
          -d '{"job_id": "test-job-001", "num_classes": 4}'
          
    Expected: 200 → either full ML payload or {"status":"running", ...} (50/50 random)    
    """
    
    # x_client_id validation - simple check for testing purpose
    if x_client_id not in ALLOWED_CLIENT_IDS:
        raise HTTPException(status_code=403, detail=f"Unknown client id: {x_client_id}")

    job_id      = body.get("job_id")
    num_classes = body.get("num_classes")

    if not job_id:
        raise HTTPException(status_code=400, detail="Missing field: job_id")
    if num_classes is None:
        raise HTTPException(status_code=400, detail="Missing field: num_classes")
    try:
        num_classes = int(num_classes)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="num_classes must be an integer")

    # 50/50 coin flip
    if random.random() < 0.5:
        return {
            "job_id":   job_id,
            "status":   "running",
            "message":  "Job not yet complete (synthetic debug response)",
            "progress": random.randint(10, 90),
        }

    # Return full synthetic payload with caller's job_id
    return build_ml_result_payload(job_id=job_id, num_classes=num_classes)


@app.post(
    "/external/api/v1/process",
    status_code=202,
    dependencies=[Depends(enforce_content_length), Depends(verify_external_api_key)],
)
def external_process(
    background_tasks: BackgroundTasks,
    data_type: str = Form(...),
    arch: str = Form(...),
    params: str = Form("{}"),
    data: UploadFile = File(...),
    x_client_id: str = Header(...),
) -> Dict[str, Any]:

    job_id = helper.get_job_id()
    validate_request_envelope(data_type, arch, x_client_id)
    params_dict     = parse_params(params)
    validated_params = validate_params_for_arch(arch, params_dict)

    dir_path  = os.path.join(WORK_DIR, x_client_id, job_id, DATA_DIR)
    file_path = os.path.join(dir_path, "user_data.zip")
    os.makedirs(dir_path, exist_ok=True)

    if not (data.filename or "").lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="data must be a .zip file")
    try:
        with open(file_path, "wb") as out:
            shutil.copyfileobj(data.file, out)
    except Exception:
        logger.exception("failed saving uploaded zip")
        raise HTTPException(status_code=500, detail="Failed to save uploaded zip")
    finally:
        try:
            data.file.close()
        except Exception:
            pass

    now = time.time()
    JOBS[job_id] = {
        "job_id": job_id, "status": "queued", "progress": 0,
        "message": "Queued", "created_at": now, "updated_at": now,
        "x_client_id": x_client_id, "data_type": data_type, "arch": arch,
        "filename": data.filename, "content_type": data.content_type,
        "status_url": f"/external/api/v1/jobs/{job_id}",
    }

    background_tasks.add_task(
        process_job, job_id,
        data_type=data_type, arch=arch, x_client_id=x_client_id,
        file_path=file_path, validated_params=validated_params,
    )
    return JOBS[job_id]


@app.get(
    "/external/api/v1/jobs/{job_id}",
    dependencies=[Depends(verify_external_api_key)],
)
def get_job(job_id: str, x_client_id: str = Header(...)) -> Dict[str, Any]:
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Unknown job_id")
    if job.get("x_client_id") != x_client_id:
        raise HTTPException(status_code=403, detail="Forbidden for this client")
    return job


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status":  "OK",
        "service": "orchestrator",
        "version": "0.0.3",
    }


@app.get("/")
def health() -> Dict[str, Any]:
    return {
        "status":  "OK",
        "service": "orchestrator",
        "version": "0.0.3",
    }

if __name__ == "__main__":
    print("\n=== Starting FastAPI orchestration server ===")
    uvicorn.run(app, host="0.0.0.0", port=8000)

