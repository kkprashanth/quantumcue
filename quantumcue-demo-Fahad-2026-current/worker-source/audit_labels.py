import os
import numpy as np
from training.pipeline import load_images

def audit_labels(work_dir):
    if not os.path.exists(work_dir):
        print(f"Directory {work_dir} not found")
        return
        
    X, y = load_images(work_dir)
    unique_labels, counts = np.unique(y, return_counts=True)
    
    print(f"Audit Results for {work_dir}:")
    print(f"Total Images: {len(X)}")
    print(f"Unique Labels found: {len(unique_labels)}")
    for label, count in zip(unique_labels, counts):
        print(f"  - {label}: {count} images")

if __name__ == "__main__":
    # The job_id is usually found in /tmp/worker/
    worker_dirs = os.listdir("/tmp/worker/") if os.path.exists("/tmp/worker/") else []
    for d in worker_dirs:
        audit_labels(os.path.join("/tmp/worker/", d))
