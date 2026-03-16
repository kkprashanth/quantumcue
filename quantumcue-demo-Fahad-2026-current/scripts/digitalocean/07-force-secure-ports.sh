#!/bin/bash
# QuantumCue - Force Secure Port Binding
# Ensures MongoDB and Redis are bound to localhost only and adds firewall rules

set -e

echo "=========================================="
echo "QuantumCue - Force Secure Port Binding"
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

if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Application directory not found: $APP_DIR${NC}"
    exit 1
fi

cd $APP_DIR

echo -e "${YELLOW}[1/5] Checking current port bindings...${NC}"

# Check what's actually listening
echo "Current listeners on ports 27017 and 6379:"
netstat -tuln 2>/dev/null | grep -E ':(27017|6379)' || ss -tuln 2>/dev/null | grep -E ':(27017|6379)' || echo "No listeners found"
echo ""

# Check docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}docker-compose.yml not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}[2/5] Updating docker-compose.yml...${NC}"

# Backup
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✓ Backed up docker-compose.yml${NC}"

# Fix MongoDB port binding
MONGO_PORTS_LINE=$(grep -A 10 "mongodb:" docker-compose.yml | grep -A 2 "ports:" | grep "27017" | head -1)
if echo "$MONGO_PORTS_LINE" | grep -q "127.0.0.1:27017:27017"; then
    echo -e "${GREEN}✓ MongoDB already bound to localhost${NC}"
else
    # Replace MongoDB port binding
    sed -i 's/- "27017:27017"/- "127.0.0.1:27017:27017"  # Bind to localhost only for security/' docker-compose.yml
    sed -i 's/- "0\.0\.0\.0:27017:27017"/- "127.0.0.1:27017:27017"  # Bind to localhost only for security/' docker-compose.yml
    echo -e "${GREEN}✓ Updated MongoDB port binding to localhost${NC}"
fi

# Fix Redis port binding
REDIS_PORTS_LINE=$(grep -A 10 "redis:" docker-compose.yml | grep -A 2 "ports:" | grep "6379" | head -1)
if echo "$REDIS_PORTS_LINE" | grep -q "127.0.0.1:6379:6379"; then
    echo -e "${GREEN}✓ Redis already bound to localhost${NC}"
else
    # Replace Redis port binding
    sed -i 's/- "6379:6379"/- "127.0.0.1:6379:6379"  # Bind to localhost only for security/' docker-compose.yml
    sed -i 's/- "0\.0\.0\.0:6379:6379"/- "127.0.0.1:6379:6379"  # Bind to localhost only for security/' docker-compose.yml
    echo -e "${GREEN}✓ Updated Redis port binding to localhost${NC}"
fi

# Fix Redis command to include bind
if ! grep -A 10 "redis:" docker-compose.yml | grep -q "--bind 127.0.0.1"; then
    # Update existing command
    sed -i '/redis:/,/^  [a-z]/ {
        s/command: redis-server --appendonly yes$/command: redis-server --appendonly yes --bind 127.0.0.1 ::1/
        s/command: redis-server$/command: redis-server --appendonly yes --bind 127.0.0.1 ::1/
    }' docker-compose.yml
    
    # If no command exists, add it after image line
    if ! grep -A 5 "redis:" docker-compose.yml | grep -q "command:"; then
        sed -i '/redis:/,/^  [a-z]/ {
            /image: redis/ a\
    command: redis-server --appendonly yes --bind 127.0.0.1 ::1
        }' docker-compose.yml
    fi
    echo -e "${GREEN}✓ Added Redis bind command${NC}"
fi

echo ""
echo -e "${YELLOW}[3/5] Stopping MongoDB and Redis...${NC}"
# Load environment variables
if [ -f "backend/.env" ]; then
    set -a
    source backend/.env 2>/dev/null || true
    set +a
fi

docker compose down mongodb redis 2>/dev/null || docker-compose down mongodb redis 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓ Services stopped${NC}"

echo ""
echo -e "${YELLOW}[4/5] Starting MongoDB and Redis with secure configuration...${NC}"
# Use --force-recreate to ensure containers are recreated with new port bindings
docker compose up -d --force-recreate mongodb redis 2>/dev/null || docker-compose up -d --force-recreate mongodb redis 2>/dev/null
sleep 5
echo -e "${GREEN}✓ Services recreated and started${NC}"

echo ""
echo -e "${YELLOW}[5/5] Adding firewall rules to explicitly block ports...${NC}"

# Add explicit deny rules for MongoDB and Redis (defense in depth)
if command -v ufw &> /dev/null; then
    # Check if rules already exist
    if ! ufw status | grep -q "27017"; then
        ufw deny 27017/tcp
        echo -e "${GREEN}✓ Added firewall rule to deny port 27017${NC}"
    else
        echo -e "${GREEN}✓ Firewall rule for 27017 already exists${NC}"
    fi
    
    if ! ufw status | grep -q "6379"; then
        ufw deny 6379/tcp
        echo -e "${GREEN}✓ Added firewall rule to deny port 6379${NC}"
    else
        echo -e "${GREEN}✓ Firewall rule for 6379 already exists${NC}"
    fi
    
    # Show firewall status
    echo ""
    echo "Current firewall rules:"
    ufw status numbered | grep -E '(27017|6379|Status)' || ufw status | grep -E '(27017|6379|Status)'
else
    echo -e "${YELLOW}⚠ UFW not found, skipping firewall rules${NC}"
fi

echo ""
echo -e "${YELLOW}Verifying port bindings...${NC}"

# Wait a moment for services to fully start
sleep 3

# Check what's listening now
echo "Current listeners after restart:"
LISTENERS=$(netstat -tuln 2>/dev/null | grep -E ':(27017|6379)' || ss -tuln 2>/dev/null | grep -E ':(27017|6379)' || echo "")
if [ -z "$LISTENERS" ]; then
    echo -e "${GREEN}✓ No external listeners found on ports 27017 or 6379${NC}"
else
    echo "$LISTENERS"
    # Check if bound to localhost
    if echo "$LISTENERS" | grep -q "127.0.0.1"; then
        echo -e "${GREEN}✓ Services are bound to localhost only${NC}"
    elif echo "$LISTENERS" | grep -q "0.0.0.0\|::"; then
        echo -e "${RED}✗ WARNING: Services are still bound to 0.0.0.0!${NC}"
        echo "   You may need to manually check docker-compose.yml"
    fi
fi

# Check Docker port mappings
echo ""
echo "Docker port mappings:"
docker port quantumcue-mongodb 2>/dev/null | grep 27017 || echo "MongoDB container not running or port not mapped"
docker port quantumcue-redis 2>/dev/null | grep 6379 || echo "Redis container not running or port not mapped"

echo ""
echo -e "${GREEN}=========================================="
echo "Security configuration complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Test from your local machine:"
echo "     nc -zv YOUR_DROPLET_IP 27017  # Should fail"
echo "     nc -zv YOUR_DROPLET_IP 6379   # Should fail"
echo ""
echo "  2. If connections still succeed, check:"
echo "     - Docker container logs: docker compose logs mongodb redis"
echo "     - Port bindings: netstat -tuln | grep -E ':(27017|6379)'"
echo "     - Firewall status: ufw status"
echo ""
echo "  3. If still exposed, you may need to:"
echo "     - Manually edit docker-compose.yml"
echo "     - Restart Docker: systemctl restart docker"
echo "     - Rebuild containers: docker compose up -d --force-recreate mongodb redis"
echo ""
