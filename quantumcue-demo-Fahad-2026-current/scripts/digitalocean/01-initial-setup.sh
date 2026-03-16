#!/bin/bash
# QuantumCue - Initial Server Setup Script for DigitalOcean
# This script performs initial server configuration on Ubuntu 24.04

set -e

echo "=========================================="
echo "QuantumCue - Initial Server Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}[1/6] Updating system packages...${NC}"
apt update && apt upgrade -y

# Install essential packages
echo -e "${YELLOW}[2/6] Installing essential packages...${NC}"
apt install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    ufw \
    fail2ban \
    htop \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Setup firewall
echo -e "${YELLOW}[3/6] Configuring firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo -e "${GREEN}✓ Firewall configured${NC}"

# Setup fail2ban
echo -e "${YELLOW}[4/6] Configuring fail2ban...${NC}"
systemctl enable fail2ban
systemctl start fail2ban
echo -e "${GREEN}✓ Fail2ban configured${NC}"

# Create application directory
echo -e "${YELLOW}[5/6] Creating application directory...${NC}"
mkdir -p /opt/quantumcuedemo
mkdir -p /opt/backups/quantumcue
echo -e "${GREEN}✓ Directories created${NC}"

# Setup timezone (optional - uncomment to set)
# echo -e "${YELLOW}[6/6] Setting timezone...${NC}"
# timedatectl set-timezone America/New_York  # Change to your timezone
# echo -e "${GREEN}✓ Timezone set${NC}"

# Create non-root user (optional)
read -p "Create non-root user? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Username: " username
    adduser $username
    usermod -aG sudo $username
    echo -e "${GREEN}✓ User $username created with sudo access${NC}"
    echo -e "${YELLOW}Note: You may want to copy your SSH key to this user${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Initial setup complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Install Docker: ./scripts/digitalocean/02-install-docker.sh"
echo "2. Deploy application: ./scripts/digitalocean/03-deploy.sh"
echo ""

