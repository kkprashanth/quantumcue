#!/bin/bash
# QuantumCue - Docker Installation Script for DigitalOcean
# Installs Docker and Docker Compose on Ubuntu 24.04

set -e

echo "=========================================="
echo "QuantumCue - Docker Installation"
echo "=========================================="
echo ""

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

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker is already installed${NC}"
    docker --version
    read -p "Reinstall Docker? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    apt remove -y docker docker-engine docker.io containerd runc || true
fi

# Install Docker
echo -e "${YELLOW}[1/4] Installing Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
echo -e "${GREEN}✓ Docker installed${NC}"

# Install Docker Compose plugin
echo -e "${YELLOW}[2/4] Installing Docker Compose plugin...${NC}"
apt install -y docker-compose-plugin
echo -e "${GREEN}✓ Docker Compose installed${NC}"

# Start and enable Docker
echo -e "${YELLOW}[3/4] Starting Docker service...${NC}"
systemctl enable docker
systemctl start docker
echo -e "${GREEN}✓ Docker service started${NC}"

# Add current user to docker group (if not root)
if [ "$SUDO_USER" ]; then
    echo -e "${YELLOW}[4/4] Adding $SUDO_USER to docker group...${NC}"
    usermod -aG docker $SUDO_USER
    echo -e "${GREEN}✓ User added to docker group${NC}"
    echo -e "${YELLOW}Note: User needs to log out and back in for group changes to take effect${NC}"
fi

# Verify installation
echo ""
echo -e "${YELLOW}Verifying installation...${NC}"
docker --version
docker compose version

echo ""
echo -e "${GREEN}=========================================="
echo "Docker installation complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. If you added a user to docker group, log out and back in"
echo "2. Deploy application: ./scripts/digitalocean/03-deploy.sh"
echo ""

