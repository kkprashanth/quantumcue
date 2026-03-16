# DigitalOcean Deployment Reset & Reseed Commands

These commands will help you reset and reseed your DigitalOcean deployment.

## Prerequisites

SSH into your DigitalOcean droplet:

```bash
ssh root@YOUR_DROPLET_IP
```

Navigate to the application directory:

```bash
cd /opt/quantumcuedemo
```

## Step 1: Run Database Migrations

```bash
# Run migrations
docker compose run --rm backend alembic upgrade head
```

## Step 2: Clean Up All Existing Seed Data

**Option A: Using cleanup script (recommended)**

```bash
# Clean up all seed data (jobs, models, interactions, datasets)
docker compose run --rm backend python -m scripts.cleanup_seed_data --yes
```

**Option B: Using reset script (cleans and reseeds in one go)**

```bash
# This will clean up AND reseed everything
docker compose run --rm backend python -m scripts.reset_seed_data --yes
```

**Option C: Manual cleanup via database (nuclear option)**

If you want to completely wipe everything:

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U quantumcue -d quantumcue

# Then run these SQL commands:
TRUNCATE TABLE model_interactions CASCADE;
TRUNCATE TABLE models CASCADE;
TRUNCATE TABLE jobs CASCADE;
TRUNCATE TABLE datasets CASCADE;
TRUNCATE TABLE provider_configurations CASCADE;
TRUNCATE TABLE providers CASCADE;
DELETE FROM users WHERE email IN ('admin@acme.com', 'user@acme.com');
DELETE FROM accounts WHERE name = 'QuantumCue Demo';

# Exit PostgreSQL
\q
```

## Step 3: Reseed All Demo Data

**Option A: Using seed_demo script with cleanup (recommended)**

```bash
# This will clean up existing seed data first, then reseed everything
docker compose run --rm backend python -m scripts.seed_demo --cleanup --yes
```

**Option B: Using reset_seed_data script**

```bash
# This does cleanup + reseed in one command
docker compose run --rm backend python -m scripts.reset_seed_data --yes
```

**Option C: Seed without cleanup (if data is already clean)**

```bash
# Just seed without cleaning (idempotent - won't create duplicates)
docker compose run --rm backend python -m scripts.seed_demo
```

## Step 4: Verify Seed Data

```bash
# Check that data was created
docker compose exec postgres psql -U quantumcue -d quantumcue -c "SELECT COUNT(*) FROM accounts;"
docker compose exec postgres psql -U quantumcue -d quantumcue -c "SELECT COUNT(*) FROM users;"
docker compose exec postgres psql -U quantumcue -d quantumcue -c "SELECT COUNT(*) FROM providers;"
docker compose exec postgres psql -U quantumcue -d quantumcue -c "SELECT COUNT(*) FROM datasets;"
docker compose exec postgres psql -U quantumcue -d quantumcue -c "SELECT COUNT(*) FROM jobs;"
docker compose exec postgres psql -U quantumcue -d quantumcue -c "SELECT COUNT(*) FROM models;"
```

## Step 5: Restart Services (if needed)

```bash
# Restart backend to ensure it picks up new data
docker compose restart backend

# Check logs to ensure everything started correctly
docker compose logs -f backend
```

## Step 6: Test the Deployment

### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# Check providers endpoint
curl http://localhost:8000/api/v1/providers

# Test login endpoint
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"demo123!"}'
```

### Test Frontend

From your local machine:

```bash
# Replace YOUR_DROPLET_IP with your actual IP
curl http://YOUR_DROPLET_IP:3000/

# Check if frontend loads
# Open in browser: http://YOUR_DROPLET_IP:3000/
```

### Test Login

1. **Open browser:** `http://YOUR_DROPLET_IP:3000/`
2. **Login with demo credentials:**
   - Email: `admin@acme.com`
   - Password: `demo123!`
3. **Verify you can see:**
   - Dashboard with jobs and models
   - Datasets page with seeded datasets
   - Models page with seeded models
   - Providers page with 5 providers

## Complete Reset Script (All-in-One)

Here's a complete script you can run to do everything:

```bash
#!/bin/bash
# Complete reset and reseed script

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
```

Save this as `reset-and-reseed.sh` and run:

```bash
chmod +x reset-and-reseed.sh
./reset-and-reseed.sh
```

## Troubleshooting

### Issue: Migrations fail

```bash
# Check database connection
docker compose exec postgres psql -U quantumcue -d quantumcue -c "SELECT 1;"

# Check backend logs
docker compose logs backend | tail -50
```

### Issue: Seed scripts fail

```bash
# Check backend logs
docker compose logs backend | tail -100

# Run seed script with verbose output
docker compose run --rm backend python -m scripts.seed_demo --cleanup --yes
```

### Issue: Services won't start

```bash
# Check all service status
docker compose ps

# Check logs for all services
docker compose logs --tail=100

# Restart all services
docker compose restart
```

### Issue: Can't access frontend

```bash
# Check frontend is running
docker compose ps frontend

# Check frontend logs
docker compose logs frontend

# Check firewall
ufw status

# Verify ports are open
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000
```

## Quick Reference

### Demo Credentials
- **Admin:** `admin@acme.com` / `demo123!`
- **User:** `user@acme.com` / `demo123!`

### Expected Seed Data
- **5 Providers:** QCI, D-Wave, IonQ, IBM Quantum, Rigetti
- **6 Datasets:** Including "Alzheimer's MRI Brain Scans - Batch 01"
- **15 Jobs:** Various statuses (completed, running, pending, failed)
- **5 Models:** Including hosted "Alzheimer's Detection QNN"
- **Model Interactions:** Sample inference history

### Key Commands

```bash
# Run migrations
docker compose run --rm backend alembic upgrade head

# Clean and reseed
docker compose run --rm backend python -m scripts.seed_demo --cleanup --yes

# Check service status
docker compose ps

# View logs
docker compose logs -f

# Health check
curl http://localhost:8000/health
```
