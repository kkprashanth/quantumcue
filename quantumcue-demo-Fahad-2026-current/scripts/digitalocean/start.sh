#!/bin/bash
# QuantumCue - Start Services Script for DigitalOcean
# Starts all services using docker-compose.yml

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="${QUANTUMCUE_APP_DIR:-/opt/quantumcuedemo}"

echo "=========================================="
echo "QuantumCue - Starting Services"
echo "=========================================="
echo ""

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Application directory not found: $APP_DIR${NC}"
    echo "Run 03-deploy.sh first to deploy the application"
    exit 1
fi

cd $APP_DIR

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}backend/.env file not found!${NC}"
    echo "Please create and configure backend/.env first"
    exit 1
fi

# Export environment variables from backend/.env for docker-compose
# This allows docker-compose.yml to use ${POSTGRES_USER}, etc.
echo -e "${YELLOW}Loading environment variables from backend/.env...${NC}"
set -a  # Automatically export all variables
source backend/.env
set +a  # Stop automatically exporting

# Verify required variables are set
if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DB" ]; then
    echo -e "${RED}Error: Required database variables not set in backend/.env${NC}"
    echo "Please ensure POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB are set"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables loaded${NC}"
echo ""

# Start database services first
echo -e "${YELLOW}[1/3] Starting database services (PostgreSQL, MongoDB, Redis)...${NC}"
docker compose up -d postgres mongodb redis
echo -e "${GREEN}✓ Database services started${NC}"

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 10

# Run migrations
echo -e "${YELLOW}[2/3] Running database migrations...${NC}"
docker compose run --rm backend alembic upgrade head || {
    echo -e "${YELLOW}⚠ Migration failed, but continuing. You may need to run migrations manually.${NC}"
}

# Start all services
echo -e "${YELLOW}[3/3] Starting all services...${NC}"
docker compose up -d --build

echo ""
echo -e "${GREEN}=========================================="
echo "Services started!"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}⚠ CRITICAL SECURITY STEP:${NC}"
echo "  Run the security hardening script to secure MongoDB and Redis:"
echo "  bash scripts/digitalocean/04-secure-services.sh"
echo ""
echo "Check service status:"
echo "  docker compose ps"
echo ""
echo "View logs:"
echo "  docker compose logs -f"
echo ""
echo "Stop services:"
echo "  docker compose down"
echo ""

