import time
from typing import Any, Dict

JOBS: Dict[str, Dict[str, Any]] = {}

def job_update(job_id: str, **fields: Any) -> None:
    job = JOBS.get(job_id)
    if not job:
        return
    job.update(fields)
    job["updated_at"] = time.time()

