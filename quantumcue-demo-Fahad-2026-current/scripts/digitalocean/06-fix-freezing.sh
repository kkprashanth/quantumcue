#!/bin/bash
# QuantumCue - Fix Terminal Freezing Script
# Applies common fixes for terminal freezing issues

set -e

echo "=========================================="
echo "QuantumCue - Fix Terminal Freezing"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

APP_DIR="${QUANTUMCUE_APP_DIR:-/opt/quantumcuedemo}"

echo -e "${YELLOW}This script will attempt to fix terminal freezing issues.${NC}"
echo -e "${YELLOW}It will:${NC}"
echo "  1. Free up disk space (Docker cleanup)"
echo "  2. Restart Docker daemon"
echo "  3. Restart application services"
echo "  4. Add swap space if needed"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Fix 1: Free up disk space
echo -e "${YELLOW}[1/4] Freeing up disk space...${NC}"
echo "Removing unused Docker images, containers, and volumes..."
docker system prune -af --volumes 2>/dev/null || {
    echo -e "${YELLOW}⚠ Docker cleanup had some issues, continuing...${NC}"
}
echo -e "${GREEN}✓ Disk cleanup complete${NC}"
echo ""

# Fix 2: Restart Docker
echo -e "${YELLOW}[2/4] Restarting Docker daemon...${NC}"
systemctl restart docker
sleep 3
systemctl status docker --no-pager | head -5
echo -e "${GREEN}✓ Docker restarted${NC}"
echo ""

# Fix 3: Restart application services
if [ -d "$APP_DIR" ] && [ -f "$APP_DIR/docker-compose.yml" ]; then
    echo -e "${YELLOW}[3/4] Restarting application services...${NC}"
    cd $APP_DIR
    
    # Load environment variables
    if [ -f "backend/.env" ]; then
        set -a
        source backend/.env 2>/dev/null || true
        set +a
    fi
    
    # Restart services gracefully
    docker compose restart 2>/dev/null || docker-compose restart 2>/dev/null || {
        echo -e "${YELLOW}⚠ Could not restart services, they may not be running${NC}"
    }
    echo -e "${GREEN}✓ Services restarted${NC}"
else
    echo -e "${YELLOW}[3/4] Application directory not found, skipping service restart${NC}"
fi
echo ""

# Fix 4: Check and add swap if needed
echo -e "${YELLOW}[4/4] Checking swap space...${NC}"
if [ -z "$(swapon --show)" ]; then
    echo -e "${YELLOW}No swap space found. Adding 2GB swap (recommended for 2-4GB RAM droplets)...${NC}"
    
    # Check if swapfile already exists
    if [ -f /swapfile ]; then
        echo -e "${YELLOW}Swapfile exists but not active. Activating...${NC}"
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
    else
        # Create new swapfile
        fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1024 count=2097152
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        
        # Make permanent
        if ! grep -q "/swapfile" /etc/fstab; then
            echo "/swapfile none swap sw 0 0" >> /etc/fstab
        fi
    fi
    
    echo -e "${GREEN}✓ Swap space added${NC}"
    swapon --show
else
    SWAP_SIZE=$(swapon --show | awk 'NR>1 {sum+=$3} END {print sum}')
    echo -e "${GREEN}✓ Swap space already configured (${SWAP_SIZE})${NC}"
fi
echo ""

echo -e "${GREEN}=========================================="
echo "Fixes applied!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Run diagnostics: bash scripts/digitalocean/05-diagnose-freezing.sh"
echo "  2. Monitor system: watch -n 2 'free -h && df -h'"
echo "  3. Check if freezing persists"
echo ""
echo "If freezing continues:"
echo "  - Consider upgrading droplet RAM"
echo "  - Check application logs: docker compose logs"
echo "  - Review resource usage: docker stats"
echo ""
