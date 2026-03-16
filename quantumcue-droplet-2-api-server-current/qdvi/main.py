#!/usr/bin/env python3
"""
QDVI Microservice — entry point.
All logic lives in: config.py, security.py, compute.py
Run: uvicorn qdvi.main:app --host 0.0.0.0 --port 3000
"""

import logging
import uvicorn
from fastapi import FastAPI, Depends
from typing import Any, Dict

from config import logger
from security import verify_internal_api_key
from compute import extract_qdvi_params, run_qdvi

app = FastAPI(title="QDVI Service", version="0.0.1")


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status":  "OK",
        "service": "qdvi",
        "version": "0.0.1",
    }

#@app.get("/health",
#         dependencies=[Depends(verify_internal_api_key)])
#def health() -> Dict[str, str]:
#    return {"status": "OK", "service": "qdvi"}


@app.post("/internal/api/v1/qdvi",
          dependencies=[Depends(verify_internal_api_key)])
def get_qdvi(params: dict) -> Dict[str, Any]:
    """
    Calculate device-independent QDVI.

    Request body:
        A       : list[list[float]]  — 2D input matrix
        B       : list[float]        — 1D target vector
        N_QUBTS : int                — qubits per weight
        shift   : int                — shift parameter
        quantum_flags : dict         — optional, defaults applied if omitted

    Returns:
        { "status": "OK", "ARCH": "qdvi",
          "data": { "qdvi": ..., "v": ..., "c": ... } }
    """
    logger.info("qdvi:: /internal/api/v1/qdvi accessed")
    logger.info("qdvi:: params keys = %s", list(params.keys()))

    A, B, N_QUBTS, shift, quantum_flags = extract_qdvi_params(params)
    result = run_qdvi(A, B, N_QUBTS, shift, quantum_flags)

    logger.info("qdvi:: Returning QDVI JSON (dict)")
    return result


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)

