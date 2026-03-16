import json
import math
from typing import Any, Dict, Optional, Set
from fastapi import HTTPException
from config import ALLOWED_DATA_TYPES, ALLOWED_ARCH, ALLOWED_CLIENT_IDS


def require_int(name: str, params: Dict[str, Any], *,
                min_: Optional[int] = None, max_: Optional[int] = None) -> int:
    if name not in params:
        raise HTTPException(400, f"Missing param: {name}")
    try:
        val = int(params[name])
    except (TypeError, ValueError):
        raise HTTPException(400, f"{name} must be an integer")
    if min_ is not None and val < min_:
        raise HTTPException(400, f"{name} must be >= {min_}")
    if max_ is not None and val > max_:
        raise HTTPException(400, f"{name} must be <= {max_}")
    return val


def require_str(name: str, params: Dict[str, Any],
                allowed: Optional[Set[str]] = None) -> str:
    if name not in params:
        raise HTTPException(400, f"Missing param: {name}")
    val = params[name]
    if not isinstance(val, str):
        raise HTTPException(400, f"{name} must be a string")
    if allowed is not None and val not in allowed:
        raise HTTPException(400, f"{name} must be one of {sorted(allowed)}")
    return val


def require_float(name: str, params: Dict[str, Any], *,
                  min_: Optional[float] = None, max_: Optional[float] = None,
                  finite: bool = True) -> float:
    if name not in params:
        raise HTTPException(400, f"Missing param: {name}")
    try:
        val = float(params[name])
    except (TypeError, ValueError):
        raise HTTPException(400, f"{name} must be a float")
    if finite and not math.isfinite(val):
        raise HTTPException(400, f"{name} must be a finite float")
    if min_ is not None and val < min_:
        raise HTTPException(400, f"{name} must be >= {min_}")
    if max_ is not None and val > max_:
        raise HTTPException(400, f"{name} must be <= {max_}")
    return val


ARCH_SPECS: Dict[str, Dict[str, Any]] = {
    "Dirac-1": {
        "allowed":    {"relaxation_schedule", "num_samples", "num_qubits_per_weight", "shift"},
        "required":   {"num_samples", "num_qubits_per_weight", "shift"},
        "defaults":   {"relaxation_schedule": 1},
        "validators": {
            "relaxation_schedule":  lambda p: require_int("relaxation_schedule", p, min_=1, max_=3),
            "num_samples":          lambda p: require_int("num_samples", p, min_=1, max_=99),
            "num_qubits_per_weight":lambda p: require_int("num_qubits_per_weight", p, min_=1, max_=32),
            "shift":                lambda p: require_int("shift", p, min_=-16, max_=16),
        },
    },
    "Dirac-3": {
        "allowed":    {"variables_type", "num_levels", "relaxation_schedule",
                       "num_samples", "num_qubits_per_weight", "shift"},
        "required":   {"num_samples", "num_qubits_per_weight", "shift"},
        "defaults":   {"variables_type": "integer", "num_levels": 2, "relaxation_schedule": 1},
        "validators": {
            "variables_type":       lambda p: require_str("variables_type", p, allowed={"integer", "continuous"}),
            "num_levels":           lambda p: require_int("num_levels", p, min_=1),
            "relaxation_schedule":  lambda p: require_int("relaxation_schedule", p, min_=1, max_=3),
            "num_samples":          lambda p: require_int("num_samples", p, min_=1, max_=99),
            "num_qubits_per_weight":lambda p: require_int("num_qubits_per_weight", p, min_=1, max_=32),
            "shift":                lambda p: require_int("shift", p, min_=-16, max_=16),
        },
    },
    "Simulator": {
        "allowed":    {"num_qubits_per_weight", "shift"},
        "required":   {"num_qubits_per_weight", "shift"},
        "defaults":   {},
        "validators": {
            "num_qubits_per_weight":lambda p: require_int("num_qubits_per_weight", p, min_=1, max_=32),
            "shift":                lambda p: require_int("shift", p, min_=-16, max_=16),
        },
    },
    "AXB": {
        "allowed":    {"damping"},
        "required":   {},
        "defaults":   {"damping": 0.01},
        "validators": {
            "damping": lambda p: require_float("damping", p, min_=0.0, max_=100.0),
        },
    },
}


def validate_request_envelope(data_type: str, arch: str, x_client_id: str) -> None:
    if x_client_id not in ALLOWED_CLIENT_IDS:
        raise HTTPException(400, f"Unknown client id: {x_client_id}")
    if data_type not in ALLOWED_DATA_TYPES:
        raise HTTPException(400, f"Unsupported data_type: {data_type}")
    if arch not in ALLOWED_ARCH:
        raise HTTPException(400, f"Unsupported arch: {arch}")


def parse_params(params: str) -> Dict[str, Any]:
    try:
        params_dict = json.loads(params) if params else {}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="params must be valid JSON")
    if not isinstance(params_dict, dict):
        raise HTTPException(status_code=400, detail="params must decode to an object/dict")
    return params_dict


def validate_params_for_arch(arch: str, params: Dict[str, Any]) -> Dict[str, Any]:
    spec = ARCH_SPECS.get(arch)
    if spec is None:
        raise HTTPException(400, f"No parameter schema configured for arch={arch}")
    unknown = set(params.keys()) - set(spec["allowed"])
    if unknown:
        raise HTTPException(400, f"Unknown params for {arch}: {sorted(unknown)}")
    for k, v in spec["defaults"].items():
        params.setdefault(k, v)
    missing = [k for k in spec["required"] if k not in params]
    if missing:
        raise HTTPException(400, f"Missing required params for {arch}: {missing}")
    validated: Dict[str, Any] = {}
    for key, fn in spec["validators"].items():
        if key in params:
            validated[key] = fn(params)
    return validated


