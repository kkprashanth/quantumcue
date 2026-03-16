#!/bin/bash
# Complete reset and reseed script for DigitalOcean

set -e

echo "=========================================="
echo "QuantumCue - Complete Reset & Reseed"
echo "=========================================="
echo ""

cd /opt/quantumcuedemo

echo "Step 1: Running migrations..."
docker compose run --rm backend alembic upgrade head
echo "✓ Migrations complete"
echo ""

echo "Step 2: Cleaning up existing seed data..."
docker compose run --rm backend python -m scripts.cleanup_seed_data --yes
echo "✓ Cleanup complete"
echo ""

echo "Step 3: Reseeding all demo data..."
docker compose run --rm backend python -m scripts.seed_demo
echo "✓ Seeding complete"
echo ""

echo "Step 4: Restarting backend..."
docker compose restart backend
echo "✓ Backend restarted"
echo ""

echo "Step 5: Verifying deployment..."
sleep 5
curl -s http://localhost:8000/health | python3 -m json.tool || echo "⚠ Backend health check failed"
echo ""

echo "=========================================="
echo "✓ Reset and reseed complete!"
echo "=========================================="
echo ""
echo "Demo credentials:"
echo "  Admin: admin@acme.com / demo123!"
echo "  User:  user@acme.com / demo123!"
echo ""
echo "Test the deployment:"
echo "  Frontend: http://YOUR_DROPLET_IP:3000/"
echo "  Backend:  http://YOUR_DROPLET_IP:8000/api/v1/health"
echo ""
