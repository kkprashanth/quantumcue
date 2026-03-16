# QDVI microservice compute.py

import logging
import sys
import os
import numpy as np
from typing import Any, Dict
from fastapi import HTTPException

#sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append("./modules")
import quantum, helper

logger = logging.getLogger(__name__)

DEFAULT_QUANTUM_FLAGS = {
    "READ_QCI_RESULTS_FROM_DATAFILE": False,
    "ADD_SPRING_POTENTIAL":           False,
    "GRAPH_MATRIX_Q":                 False,
    "SAVED_DATA_FILENAME":            "None",
}


def extract_qdvi_params(params: Dict[str, Any]) -> tuple:
    """Extract and validate required fields from request body."""
    try:
        A      = params["A"]
        B      = params["B"]
        N_QUBTS = params["N_QUBTS"]
        shift  = params["shift"]
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing required field: {e.args[0]}")
    
    quantum_flags = params.get("quantum_flags") or DEFAULT_QUANTUM_FLAGS
    return np.array(A), np.array(B), int(N_QUBTS), int(shift), quantum_flags


def run_qdvi(A: np.ndarray, B: np.ndarray, N_QUBTS: int,
             shift: int, quantum_flags: Dict[str, Any]) -> Dict[str, Any]:
    """Run QDVI computation and return serialized result dict."""
    try:
        qdvi, v, c = quantum.get_Q_dict(
            A=A, B=B, N_QUBTS=N_QUBTS,
            shift=shift, quantum_flags=quantum_flags,
        )
    except Exception as e:
        logger.exception("qdvi:: quantum.get_Q_dict failed")
        raise HTTPException(status_code=500, detail=f"qdvi compute failed: {e}")

    return {
        "status": "OK",
        "ARCH":   "qdvi",
        "data": {
            "qdvi": helper.serialize_qdvi(qdvi),
            "v":    v,
            "c":    c,
        },
    }

