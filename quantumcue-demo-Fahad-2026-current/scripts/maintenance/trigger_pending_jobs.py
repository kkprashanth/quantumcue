
import asyncio
import sys
from uuid import UUID
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.job import Job, JobStatus, JobType
from app.models.dataset import DatasetStatus
from app.services.job import JobService
from app.models.user import User

from sqlalchemy.orm import selectinload

async def trigger_pending_jobs():
    async with AsyncSessionLocal() as db:
        # Find all pending ML jobs where the dataset is READY
        query = select(Job).options(selectinload(Job.dataset)).where(
            Job.status == JobStatus.PENDING,
            Job.job_type == JobType.MACHINE_LEARNING
        )
        result = await db.execute(query)
        jobs = result.scalars().all()
        
        print(f"Found {len(jobs)} pending ML jobs")
        
        if not jobs:
            return

        job_service = JobService(db)
        
        for job in jobs:
            if job.dataset and job.dataset.status == DatasetStatus.READY:
                dataset_url = job.dataset.custom_metadata.get("dataset_url") if job.dataset.custom_metadata else None
                if dataset_url and not dataset_url.startswith("s3://"):
                    print(f"Triggering job {job.id} for dataset {job.dataset_id}")
                    worker_payload = {
                        "job_id": str(job.id),
                        "dataset_url": dataset_url,
                        "dataset_type": "png"
                    }
                    # We can't use create_task easily here because the script will exit
                    # So we'll call the private method directly and await it for this script
                    await job_service._submit_to_worker(worker_payload)
                else:
                    print(f"Job {job.id} dataset URL is missing or mocked: {dataset_url}")
            else:
                print(f"Job {job.id} dataset is not ready: {job.dataset.status if job.dataset else 'No Dataset'}")

if __name__ == "__main__":
    asyncio.run(trigger_pending_jobs())
