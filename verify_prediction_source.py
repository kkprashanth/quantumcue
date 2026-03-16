
import asyncio
from uuid import UUID
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import json

# Connection details - matches Settings in app/config.py
DATABASE_URL = "postgresql+asyncpg://quantumcue:quantumcue_dev@localhost:5432/quantumcue"

async def verify_predictions():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Import models locally to avoid path issues
        # Since this is a standalone script on the host, we'll use raw SQL or just query the table
        from sqlalchemy import text
        
        # Query latest interactions
        result = await session.execute(text("SELECT id, model_id, input_data, prediction_data FROM model_interactions ORDER BY created_at DESC LIMIT 5"))
        interactions = result.all()
        
        if not interactions:
            print("No model interactions found.")
            return

        print(f"Found {len(interactions)} recent interactions:\n")
        for i, row in enumerate(interactions):
            print(f"--- Interaction {i+1} ---")
            print(f"ID: {row.id}")
            print(f"Model ID: {row.model_id}")
            # input_data and prediction_data are JSONB
            pred_data = row.prediction_data
            if isinstance(pred_data, str):
                pred_data = json.loads(pred_data)
            
            print(f"Backend: {pred_data.get('backend', 'N/A')}")
            print(f"Prediction: {pred_data.get('prediction', 'N/A')}")
            print(f"Confidence: {pred_data.get('confidence', 'N/A')}")
            print(f"Latency: {pred_data.get('latency_ms', 'N/A')}ms")
            
            if pred_data.get('backend') == 'droplet2_worker':
                print("SUCCESS: This prediction came from Droplet 2!")
            elif pred_data.get('backend') == 'quantum_simulation':
                print("WARNING: This was a mock (simulation) prediction.")
            else:
                print("UNKNOWN: Backend field missing or unrecognized.")
            print("\n")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify_predictions())
