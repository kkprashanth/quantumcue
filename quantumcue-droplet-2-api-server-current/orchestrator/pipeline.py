# pipeline.py module for orchestrator

import logging
import requests
import numpy as np
import numpy.typing as npt
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
import uuid

import sys
import os

sys.path.append("./modules")
sys.path.append("./result_generators")

import helper, quantum

# Import your generators
from metrics_generator import generate_ml_metrics
from f1_generator import generate_multi_f1_curves
from roc_pr_generator import generate_multi_roc_curves, generate_multi_pr_curves
from confusion_generator import generate_multi_confusion_rates

from config import API_KEY_INTERNAL 
from job_store import job_update

logger = logging.getLogger(__name__)

#====================================
# API functions
#====================================

def get_AB_logical_AND(path: Path) -> Tuple[npt.NDArray, npt.NDArray, npt.NDArray, npt.NDArray]:
    A_train = np.array([[0, 0, 1], [0, 1, 1], [1, 0, 1], [1, 1, 1]])
    B_train = np.array([0, 0, 0, 1])
    A_val   = np.array([[0, 0, 1], [0, 1, 1], [1, 0, 1], [1, 1, 1]])
    B_val   = np.array([0, 0, 0, 1])
    return A_train, B_train, A_val, B_val


def make_qdvi_payload(A: Any, B: Any, *, shift: int,
                      num_qubits_per_weight: int) -> Dict[str, Any]:
    A_np = np.asarray(A)
    B_np = np.asarray(B)
    if A_np.ndim != 2:
        raise ValueError("A must be a 2D array-like")
    if B_np.ndim != 1:
        raise ValueError("B must be a 1D array-like")
    if A_np.shape[0] != B_np.shape[0]:
        raise ValueError("A rows must match len(B)")
    return {
        "A": A_np.tolist(), "B": B_np.tolist(),
        "N_QUBTS": int(num_qubits_per_weight),
        "shift": int(shift),
    }


def call_qdvi_service(qdvi_url: str, api_key_internal: str,
                      payload: Dict[str, Any]) -> Dict[str, Any]:
    headers = {"X-API-Key-Internal": api_key_internal,
               "Content-Type": "application/json"}
    logger.info("orchestrator:: call_qdvi_service:: calling qdvi microservice")
    resp = requests.post(qdvi_url, headers=headers, json=payload, timeout=30)
    if not resp.ok:
        logger.error("HTTP %s %s", resp.status_code, resp.url)
        resp.raise_for_status()
    obj  = resp.json()
    arch = obj.get("ARCH") or obj.get("arch")
    data = obj["data"]
    qdvi = helper.deserialize_qdvi(data["qdvi"])
    return {"status": obj.get("status", "OK"), "arch": arch,
            "data": {"qdvi": qdvi, "v": data["v"], "c": data["c"]}}


def process_job(job_id: str, *, data_type: str, arch: str, x_client_id: str,
                file_path: str, validated_params: Dict[str, Any]) -> None:
    try:
        job_update(job_id, status="running", message="Starting processing", progress=5)

        if data_type == "logical_AND":
            job_update(job_id, message="Generating A/B for logical_AND", progress=20)
            A_train, B_train, A_val, B_val = get_AB_logical_AND(Path(file_path))
        else:
            raise RuntimeError(f"data_type={data_type} not implemented")

        if arch == "AXB":
            job_update(job_id, message="Data sent to AXB solver", progress=40)
            try:
                w_AXB = quantum.correctAnswer_np(
                    A=A_train, B=B_train, damp=validated_params["damping"])
            except Exception as e:
                logger.exception("Job failed: %s", job_id)
                job_update(job_id, status="failed", message="Failed", error=str(e))
                return
            job_update(job_id, status="succeeded", message="Completed", progress=100,
                       result={"validated_params": validated_params,
                               "weights": w_AXB.tolist(), "file_path": file_path})

        elif arch in ("DWave", "Dirac-1", "Dirac-3", "Classic_optimize", "Simulator"):
            job_update(job_id, message="Converting data to quantum device independent format", progress=40)
            try:
                qdvi_payload = make_qdvi_payload(
                    A_train, B_train,
                    shift=validated_params["shift"],
                    num_qubits_per_weight=validated_params["num_qubits_per_weight"])
                qdvi_result = call_qdvi_service(
                    qdvi_url="http://localhost:3000/internal/api/v1/qdvi",
                    api_key_internal=API_KEY_INTERNAL,
                    payload=qdvi_payload)
                data = qdvi_result["data"]
                qdvi = data["qdvi"]
                v, c = data["v"], data["c"]

                if arch in ("Dirac-1", "Dirac-3", "Simulator"):
                    q_dirac_1, qci_qbt_num = quantum.Q_dict_2_QCI_np(
                        Q_dict=qdvi, N_VAR=len(A_train[0]),
                        N_QUBTS=validated_params["num_qubits_per_weight"])
                if arch == "Dirac-3":
                    q_dirac_3 = quantum.convert_dirac1_to_dirac3_fmt(
                        q_dirac_1, num_levels=validated_params["num_levels"])

                job_update(job_id, message="Data converted to architecture-specific format", progress=60)

                if arch == "Dirac-1":
                    Qci_answer_list, E = quantum.minimize_QCI_Dirac1_Ex(
                        Q_np=q_dirac_3, num_samples=validated_params["num_samples"])
                elif arch == "Dirac-3":
                    Qci_answer_list, E = quantum.minimize_QCI_Dirac3_Ex(
                        data_QCI=q_dirac_3,
                        num_samples=validated_params["num_samples"],
                        num_levels=validated_params["num_levels"],
                        relaxation_schedule=validated_params["relaxation_schedule"],
                        total_num_qubits=len(q_dirac_1))
                elif arch == "Simulator":
                    Qci_answer_list, E = quantum.mimic_QCI_response_E(q_dirac_1)

                vars_list_qci = quantum.get_weights_from_QCI_response(
                    Qci_answer_list, N_VAR=len(A_train[0]), v=v, c=c, qci_qbt_num=qci_qbt_num)

                job_update(job_id, message="Model weights calculated", progress=80)
                job_update(job_id, status="succeeded", message="Completed", progress=100,
                           result={"validated_params": validated_params,
                                   "weights": np.asarray(vars_list_qci).tolist(), "file_path": file_path})
            except Exception as e:
                logger.exception("Job failed: %s", job_id)
                job_update(job_id, status="failed", message="Failed", error=str(e))
        else:
            job_update(job_id, status="error",
                       message=f"Architecture {arch} not implemented yet")

    except Exception as e:
        logger.exception("Job failed: %s", job_id)
        job_update(job_id, status="failed", message="Failed", error=str(e))



#====================================
# Metrics Payload Generator
#====================================

def compute_averages(
    metrics: Dict[str, np.ndarray],
    f1_thresholds: np.ndarray, f1_scores: np.ndarray,
    roc_curves: List[Tuple[np.ndarray, np.ndarray]],
    pr_curves: List[Tuple[np.ndarray, np.ndarray]],
    confusion_thresholds: np.ndarray,
    confusion_tpr: np.ndarray, confusion_fpr: np.ndarray,
    confusion_tnr: np.ndarray, confusion_fnr: np.ndarray,
    num_classes: int, num_points: int
) -> Dict[str, Any]:
    """Compute all averages per the v1.1 schema."""
    
    # Metrics averages (simple mean)
    avg_metrics = {k: float(np.mean(v)) for k, v in metrics.items()}
    
    # F1 average (shared thresholds → direct mean)
    f1_avg = np.mean(f1_scores, axis=0).tolist()
    
    # Confusion averages (shared thresholds → direct mean)
    avg_confusion = {
        'tpr': np.mean(confusion_tpr, axis=0).tolist(),
        'fpr': np.mean(confusion_fpr, axis=0).tolist(),
        'tnr': np.mean(confusion_tnr, axis=0).tolist(),
        'fnr': np.mean(confusion_fnr, axis=0).tolist()
    }
    
    # ROC macro-average (interpolate to common FPR grid)
    common_fpr = np.linspace(0, 1, num_points)
    roc_avg_tpr = []
    for fpr, tpr in roc_curves:
        tpr_interp = np.interp(common_fpr, fpr, tpr, left=0.0, right=1.0)
        roc_avg_tpr.append(tpr_interp)
    roc_avg_tpr = np.mean(roc_avg_tpr, axis=0)
    
    # PR macro-average (interpolate to common recall grid)
    common_recall = np.linspace(0, 1, num_points)
    pr_avg_precision = []
    for recall, precision in pr_curves:
        prec_interp = np.interp(common_recall, recall, precision, left=1.0, right=0.0)
        pr_avg_precision.append(prec_interp)
    pr_avg_precision = np.mean(pr_avg_precision, axis=0)
    
    return {
        'metrics': avg_metrics,
        'f1': f1_avg,
        'confusion_rates': avg_confusion,
        'roc': {'fpr': common_fpr.tolist(), 'tpr': roc_avg_tpr.tolist()},
        'pr': {'recall': common_recall.tolist(), 'precision': pr_avg_precision.tolist()}
    }

def build_ml_result_payload(
        job_id: str,
        num_classes: int = 4,
        num_points: int = 50,
        seed: int = 42
    ) -> Dict[str, Any]:
    """Generate complete v1.1 schema payload."""
    np.random.seed(seed)
    
    # Generate raw data
    metrics = generate_ml_metrics(num_classes, seed)
    f1_thresholds, f1_scores = generate_multi_f1_curves(num_classes, 50, seed)
    roc_curves = generate_multi_roc_curves(num_classes, num_points, seed)
    pr_curves = generate_multi_pr_curves(num_classes, num_points, seed)
    confusion_thresholds, confusion_tpr, confusion_fpr, confusion_tnr, confusion_fnr = \
        generate_multi_confusion_rates(num_classes, 20, seed)
    
    # Compute averages
    avgs = compute_averages(
        metrics, f1_thresholds, f1_scores, roc_curves, pr_curves,
        confusion_thresholds, confusion_tpr, confusion_fpr, confusion_tnr, confusion_fnr,
        num_classes, num_points
    )
    
    # conversion of numpy arrays to lists for serialization
    roc_curves_json = [{"fpr": fpr.tolist(), "tpr": tpr.tolist()} for (fpr, tpr) in roc_curves]
    pr_curves_json  = [{"recall": r.tolist(), "precision": p.tolist()} for (r, p) in pr_curves]
    
    # Build full payload
    return {
        "job_id": job_id,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "num_classes": num_classes,
        "num_points": num_points,
        "metrics": {
            "per_class": {k: v.tolist() for k, v in metrics.items()},
            "averages": avgs['metrics']
        },
        "curves": {
            "f1": {
                "thresholds": f1_thresholds.tolist(),
                "per_class": f1_scores.tolist(),
                "average": avgs['f1']
            },
            #"roc": roc_curves,  # already list of dicts after .tolist()
            #"pr": pr_curves,
            "roc": roc_curves_json,
            "pr": pr_curves_json,
            "confusion_rates": {
                "thresholds": confusion_thresholds.tolist(),
                "per_class": {
                    "tpr": confusion_tpr.tolist(),
                    "fpr": confusion_fpr.tolist(),
                    "tnr": confusion_tnr.tolist(),
                    "fnr": confusion_fnr.tolist()
                },
                "averages": avgs['confusion_rates']
            },
            "averages": {
                "roc": avgs['roc'],
                "pr": avgs['pr']
            }
        }
    }
