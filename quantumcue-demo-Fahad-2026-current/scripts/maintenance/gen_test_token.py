
import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserStatus
from app.core.security import create_access_token

async def generate_token():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.status == UserStatus.ACTIVE).limit(1))
        user = result.scalar_one_or_none()
        
        if not user:
            print("No active user found in database.")
            return None
        
        token = create_access_token(subject=user.id)
        print(f"TOKEN_START:{token}:TOKEN_END")
        with open("latest_token.txt", "w") as f:
            f.write(token)
        return token

if __name__ == "__main__":
    asyncio.run(generate_token())
