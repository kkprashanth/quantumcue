import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text
import uuid

async def create_master_code():
    async with AsyncSessionLocal() as db:
        try:
            # Generate a UUID manually
            uid = str(uuid.uuid4())
            # Use columns that actually exist: id, created_at, updated_at, email, code, status
            sql = text("""
                INSERT INTO early_access_codes (id, code, status, email, created_at, updated_at)
                VALUES (:id, 'QC-MASTER-TEST', 'unused', NULL, NOW(), NOW())
                ON CONFLICT (code) DO NOTHING
            """)
            await db.execute(sql, {"id": uid})
            await db.commit()
            print("Access code 'QC-MASTER-TEST' ensured via raw SQL (using verified columns).")
        except Exception as e:
            print(f"Error: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(create_master_code())
