#!/bin/bash
# QuantumCue - Update Script for DigitalOcean
# Updates the application to the latest version

set -e

# Configuration
APP_DIR="/opt/quantumcuedemo"
BRANCH="${QUANTUMCUE_BRANCH:-main}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

echo "=========================================="
echo "QuantumCue - Application Update"
echo "=========================================="
echo ""

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Application directory not found: $APP_DIR${NC}"
    echo "Run 03-deploy.sh first to deploy the application"
    exit 1
fi

cd $APP_DIR

# Backup before update
echo -e "${YELLOW}[1/5] Creating backup before update...${NC}"
if [ -f "$APP_DIR/scripts/digitalocean/backup.sh" ]; then
    bash $APP_DIR/scripts/digitalocean/backup.sh
else
    echo -e "${YELLOW}⚠ Backup script not found, skipping backup${NC}"
fi

# Pull latest changes
echo -e "${YELLOW}[2/5] Pulling latest changes from repository...${NC}"
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH
echo -e "${GREEN}✓ Repository updated${NC}"

# Check for new environment variables
echo -e "${YELLOW}[3/5] Checking for new environment variables...${NC}"
if [ -f "backend/.env.example" ] && [ -f "backend/.env" ]; then
    # Compare and show differences (don't overwrite)
    echo -e "${YELLOW}⚠ Review backend/.env.example for new variables${NC}"
fi
if [ -f "frontend/.env.example" ] && [ -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠ Review frontend/.env.example for new variables${NC}"
fi

# Rebuild and restart services
echo -e "${YELLOW}[4/5] Rebuilding and restarting services...${NC}"
docker compose pull
docker compose up -d --build
echo -e "${GREEN}✓ Services rebuilt and restarted${NC}"

# Run migrations
echo -e "${YELLOW}[5/5] Running database migrations...${NC}"
docker compose run --rm backend alembic upgrade head || {
    echo -e "${YELLOW}⚠ Migration failed, but continuing. Check logs if issues occur.${NC}"
}

echo ""
echo -e "${GREEN}=========================================="
echo "Update complete!"
echo "=========================================="
echo ""
echo "Check service status:"
echo "  docker compose ps"
echo ""
echo "View logs:"
echo "  docker compose logs -f"
echo ""

