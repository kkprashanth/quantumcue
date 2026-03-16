import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text
import uuid

async def create_master_code():
    async with AsyncSessionLocal() as db:
        try:
            # Generate a UUID manually
            uid = str(uuid.uuid4())
            # Now we can use ALL columns expected by the model
            sql = text("""
                INSERT INTO early_access_codes (id, code, status, email, expires_in, created_at, updated_at)
                VALUES (:id, 'QC-MASTER-TEST', 'unused', NULL, 8760, NOW(), NOW())
                ON CONFLICT (code) DO UPDATE 
                SET status = 'unused', expires_in = 8760, updated_at = NOW()
            """)
            await db.execute(sql, {"id": uid})
            await db.commit()
            print("Access code 'QC-MASTER-TEST' ensured with full column set.")
        except Exception as e:
            print(f"Error: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(create_master_code())
