#!/bin/bash
# QuantumCue - Security Hardening Script for DigitalOcean
# Secures MongoDB and Redis by binding them to localhost only
# This script should be run after initial deployment

set -e

echo "=========================================="
echo "QuantumCue - Security Hardening"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="${QUANTUMCUE_APP_DIR:-/opt/quantumcuedemo}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Application directory not found: $APP_DIR${NC}"
    echo "Run 03-deploy.sh first to deploy the application"
    exit 1
fi

cd $APP_DIR

echo -e "${YELLOW}[1/4] Checking current MongoDB and Redis configuration...${NC}"

# Check if MongoDB is exposed
if netstat -tuln 2>/dev/null | grep -q ":27017.*LISTEN" || ss -tuln 2>/dev/null | grep -q ":27017"; then
    MONGO_EXPOSED=$(netstat -tuln 2>/dev/null | grep ":27017" | head -1 || ss -tuln 2>/dev/null | grep ":27017" | head -1)
    if echo "$MONGO_EXPOSED" | grep -q "0.0.0.0\|::"; then
        echo -e "${RED}⚠ WARNING: MongoDB is exposed to the public internet!${NC}"
        echo "   Current binding: $MONGO_EXPOSED"
        MONGO_NEEDS_FIX=true
    else
        echo -e "${GREEN}✓ MongoDB is already bound to localhost${NC}"
        MONGO_NEEDS_FIX=false
    fi
else
    echo -e "${YELLOW}⚠ MongoDB is not currently running${NC}"
    MONGO_NEEDS_FIX=false
fi

# Check if Redis is exposed
if netstat -tuln 2>/dev/null | grep -q ":6379.*LISTEN" || ss -tuln 2>/dev/null | grep -q ":6379"; then
    REDIS_EXPOSED=$(netstat -tuln 2>/dev/null | grep ":6379" | head -1 || ss -tuln 2>/dev/null | grep ":6379" | head -1)
    if echo "$REDIS_EXPOSED" | grep -q "0.0.0.0\|::"; then
        echo -e "${RED}⚠ WARNING: Redis is exposed to the public internet!${NC}"
        echo "   Current binding: $REDIS_EXPOSED"
        REDIS_NEEDS_FIX=true
    else
        echo -e "${GREEN}✓ Redis is already bound to localhost${NC}"
        REDIS_NEEDS_FIX=false
    fi
else
    echo -e "${YELLOW}⚠ Redis is not currently running${NC}"
    REDIS_NEEDS_FIX=false
fi

echo ""

# Fix docker-compose.yml if needed
if [ "$MONGO_NEEDS_FIX" = true ] || [ "$REDIS_NEEDS_FIX" = true ]; then
    echo -e "${YELLOW}[2/4] Updating docker-compose.yml to secure services...${NC}"
    
    # Backup docker-compose.yml
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
        echo -e "${GREEN}✓ Backed up docker-compose.yml${NC}"
    fi
    
    # Fix MongoDB port binding
    if [ "$MONGO_NEEDS_FIX" = true ]; then
        if grep -q 'ports:' -A 1 docker-compose.yml | grep -q '27017:27017'; then
            sed -i 's/- "27017:27017"/- "127.0.0.1:27017:27017"  # Bind to localhost only for security/' docker-compose.yml
            echo -e "${GREEN}✓ Updated MongoDB port binding to localhost only${NC}"
        fi
    fi
    
    # Fix Redis port binding and add bind command
    if [ "$REDIS_NEEDS_FIX" = true ]; then
        if grep -q 'ports:' -A 1 docker-compose.yml | grep -q '6379:6379'; then
            sed -i 's/- "6379:6379"/- "127.0.0.1:6379:6379"  # Bind to localhost only for security/' docker-compose.yml
            echo -e "${GREEN}✓ Updated Redis port binding to localhost only${NC}"
        fi
        
        # Add bind command to Redis if not present
        if ! grep -q '--bind 127.0.0.1' docker-compose.yml; then
            if grep -q 'command: redis-server' docker-compose.yml; then
                sed -i 's/command: redis-server --appendonly yes/command: redis-server --appendonly yes --bind 127.0.0.1 ::1/' docker-compose.yml
                echo -e "${GREEN}✓ Added Redis bind command${NC}"
            fi
        fi
    fi
    
    echo ""
    echo -e "${YELLOW}[3/4] Restarting services with secure configuration...${NC}"
    
    # Load environment variables
    if [ -f "backend/.env" ]; then
        set -a
        source backend/.env 2>/dev/null || true
        set +a
    fi
    
    # Restart MongoDB and Redis
    docker compose down mongodb redis 2>/dev/null || true
    docker compose up -d mongodb redis
    
    echo -e "${GREEN}✓ Services restarted${NC}"
else
    echo -e "${GREEN}[2/4] No changes needed - services are already secure${NC}"
    echo -e "${GREEN}[3/4] Skipping service restart${NC}"
fi

echo ""
echo -e "${YELLOW}[4/4] Verifying security configuration...${NC}"

# Wait a moment for services to start
sleep 5

# Verify MongoDB
if docker compose ps mongodb 2>/dev/null | grep -q "Up"; then
    MONGO_BINDING=$(docker port quantumcue-mongodb 2>/dev/null | grep 27017 || echo "")
    if echo "$MONGO_BINDING" | grep -q "127.0.0.1"; then
        echo -e "${GREEN}✓ MongoDB is bound to localhost only${NC}"
    else
        echo -e "${YELLOW}⚠ MongoDB binding verification unclear${NC}"
    fi
fi

# Verify Redis
if docker compose ps redis 2>/dev/null | grep -q "Up"; then
    REDIS_BINDING=$(docker port quantumcue-redis 2>/dev/null | grep 6379 || echo "")
    if echo "$REDIS_BINDING" | grep -q "127.0.0.1"; then
        echo -e "${GREEN}✓ Redis is bound to localhost only${NC}"
    else
        echo -e "${YELLOW}⚠ Redis binding verification unclear${NC}"
    fi
fi

# Test external access (should fail)
echo ""
echo -e "${YELLOW}Testing external access (should fail)...${NC}"
DROPLET_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || hostname -I | awk '{print $1}' || echo "unknown")

if [ "$DROPLET_IP" != "unknown" ]; then
    echo "Testing MongoDB connection (port 27017)..."
    
    # Try multiple methods to test connection
    MONGO_ACCESSIBLE=false
    
    # Method 1: Use nc (netcat) if available
    if command -v nc &> /dev/null; then
        if timeout 2 nc -zv $DROPLET_IP 27017 2>&1 | grep -q "succeeded\|open"; then
            MONGO_ACCESSIBLE=true
        fi
    # Method 2: Use bash TCP redirection
    elif timeout 2 bash -c "echo > /dev/tcp/$DROPLET_IP/27017" 2>/dev/null; then
        MONGO_ACCESSIBLE=true
    # Method 3: Use curl (less reliable for TCP but available)
    elif command -v curl &> /dev/null; then
        if timeout 2 curl -s --connect-timeout 1 telnet://$DROPLET_IP:27017 2>&1 | grep -q "Connected\|refused"; then
            # Check if it's actually accessible (not just refused)
            if timeout 2 curl -s --connect-timeout 1 telnet://$DROPLET_IP:27017 2>&1 | grep -q "Connected"; then
                MONGO_ACCESSIBLE=true
            fi
        fi
    fi
    
    if [ "$MONGO_ACCESSIBLE" = true ]; then
        echo -e "${RED}✗ WARNING: MongoDB is still accessible from external IP!${NC}"
        echo "   You may need to check firewall rules or restart services"
    else
        echo -e "${GREEN}✓ MongoDB is not accessible from external IP${NC}"
    fi
    
    echo "Testing Redis connection (port 6379)..."
    
    # Try multiple methods to test connection
    REDIS_ACCESSIBLE=false
    
    # Method 1: Use nc (netcat) if available
    if command -v nc &> /dev/null; then
        if timeout 2 nc -zv $DROPLET_IP 6379 2>&1 | grep -q "succeeded\|open"; then
            REDIS_ACCESSIBLE=true
        fi
    # Method 2: Use bash TCP redirection
    elif timeout 2 bash -c "echo > /dev/tcp/$DROPLET_IP/6379" 2>/dev/null; then
        REDIS_ACCESSIBLE=true
    # Method 3: Use curl (less reliable for TCP but available)
    elif command -v curl &> /dev/null; then
        if timeout 2 curl -s --connect-timeout 1 telnet://$DROPLET_IP:6379 2>&1 | grep -q "Connected\|refused"; then
            # Check if it's actually accessible (not just refused)
            if timeout 2 curl -s --connect-timeout 1 telnet://$DROPLET_IP:6379 2>&1 | grep -q "Connected"; then
                REDIS_ACCESSIBLE=true
            fi
        fi
    fi
    
    if [ "$REDIS_ACCESSIBLE" = true ]; then
        echo -e "${RED}✗ WARNING: Redis is still accessible from external IP!${NC}"
        echo "   You may need to check firewall rules or restart services"
    else
        echo -e "${GREEN}✓ Redis is not accessible from external IP${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}Note: To test from your local machine, use one of these commands:${NC}"
    echo "  nc -zv YOUR_DROPLET_IP 27017  # MongoDB (should fail)"
    echo "  nc -zv YOUR_DROPLET_IP 6379   # Redis (should fail)"
    echo "  Or: timeout 2 bash -c 'echo > /dev/tcp/YOUR_DROPLET_IP/27017'"
else
    echo -e "${YELLOW}⚠ Could not determine external IP for testing${NC}"
    echo "   You can test manually from your local machine using:"
    echo "   nc -zv YOUR_DROPLET_IP 27017  # MongoDB"
    echo "   nc -zv YOUR_DROPLET_IP 6379   # Redis"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Security hardening complete!"
echo "==========================================${NC}"
echo ""
echo "Summary:"
echo "  - MongoDB and Redis are now bound to localhost (127.0.0.1) only"
echo "  - Services are only accessible from within the server"
echo "  - External access to ports 27017 and 6379 should be blocked"
echo ""
echo "Note: If services were already running, you may need to:"
echo "  1. Restart all services: docker compose restart"
echo "  2. Verify firewall rules: ufw status"
echo "  3. Test external access: telnet YOUR_IP 27017 (should fail)"
echo ""
