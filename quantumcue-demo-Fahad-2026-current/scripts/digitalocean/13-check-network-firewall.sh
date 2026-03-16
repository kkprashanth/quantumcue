#!/bin/bash
# QuantumCue - Check Network and Firewall
# Diagnoses network/firewall issues preventing uploads

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

APP_DIR="${QUANTUMCUE_APP_DIR:-/opt/quantumcuedemo}"

cd "$APP_DIR"

echo "=========================================="
echo "Network and Firewall Check"
echo "=========================================="
echo ""

# Check UFW status
echo -e "${BLUE}[1] UFW Firewall Status:${NC}"
if command -v ufw &> /dev/null; then
    ufw status verbose || echo "UFW not active"
else
    echo "UFW not installed"
fi
echo ""

# Check iptables rules
echo -e "${BLUE}[2] iptables Rules (port 8000):${NC}"
if command -v iptables &> /dev/null; then
    iptables -L -n | grep -E "8000|REJECT|DROP" | head -10 || echo "No specific rules for port 8000"
else
    echo "iptables not available"
fi
echo ""

# Check what's listening on port 8000
echo -e "${BLUE}[3] Port 8000 Listeners:${NC}"
if command -v netstat &> /dev/null; then
    netstat -tlnp | grep ":8000" || echo "No listeners found with netstat"
elif command -v ss &> /dev/null; then
    ss -tlnp | grep ":8000" || echo "No listeners found with ss"
else
    echo "netstat/ss not available"
fi
echo ""

# Check backend container port mapping
echo -e "${BLUE}[4] Backend Container Port Mapping:${NC}"
docker compose ps backend | grep "8000" || docker ps --filter "name=quantumcue-backend" --format "table {{.Names}}\t{{.Ports}}" | grep "8000"
echo ""

# Test local connection
echo -e "${BLUE}[5] Testing Local Connection:${NC}"
if curl -s --max-time 5 http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Local connection works${NC}"
    RESPONSE=$(curl -s --max-time 5 http://localhost:8000/health)
    echo "  Response: $RESPONSE"
else
    echo -e "${RED}✗ Local connection failed${NC}"
fi
echo ""

# Check if backend is accessible from container network
echo -e "${BLUE}[6] Testing Container Network:${NC}"
if docker compose exec -T backend curl -s --max-time 5 http://localhost:8000/health 2>/dev/null; then
    echo -e "${GREEN}✓ Backend accessible from container network${NC}"
else
    echo -e "${YELLOW}⚠ Backend not accessible from container (may need curl installed)${NC}"
fi
echo ""

# Check Redis status (backend needs this)
echo -e "${BLUE}[7] Redis Status:${NC}"
if docker compose ps redis 2>/dev/null | grep -q "Up\|running"; then
    echo -e "${GREEN}✓ Redis container is running${NC}"
    if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        echo -e "${GREEN}✓ Redis is responding${NC}"
    else
        echo -e "${YELLOW}⚠ Redis container running but not responding${NC}"
    fi
else
    echo -e "${RED}✗ Redis container is not running${NC}"
    echo -e "${YELLOW}  Backend will work without Redis, but caching won't work${NC}"
fi
echo ""

# Check external IP access (if we can determine it)
echo -e "${BLUE}[8] External Access Check:${NC}"
EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "")
if [ ! -z "$EXTERNAL_IP" ]; then
    echo -e "${CYAN}  Server external IP: ${EXTERNAL_IP}${NC}"
    echo -e "${CYAN}  Testing external access to port 8000...${NC}"
    if timeout 3 bash -c "echo > /dev/tcp/$EXTERNAL_IP/8000" 2>/dev/null; then
        echo -e "${GREEN}  ✓ Port 8000 is accessible externally${NC}"
    else
        echo -e "${YELLOW}  ⚠ Port 8000 may not be accessible externally${NC}"
        echo -e "${CYAN}    This is normal if you're accessing via domain/nginx${NC}"
    fi
else
    echo -e "${YELLOW}  Could not determine external IP${NC}"
fi
echo ""

# Check for nginx/reverse proxy
echo -e "${BLUE}[9] Reverse Proxy Check:${NC}"
if command -v nginx &> /dev/null || docker compose ps 2>/dev/null | grep -q nginx; then
    echo -e "${CYAN}  Nginx detected${NC}"
    echo -e "${YELLOW}  ⚠ If using nginx, check:${NC}"
    echo -e "${CYAN}    - client_max_body_size (should be large enough for uploads)${NC}"
    echo -e "${CYAN}    - proxy_read_timeout (should be long enough)${NC}"
    echo -e "${CYAN}    - proxy_connect_timeout${NC}"
else
    echo -e "${GREEN}  No nginx detected (direct access)${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

if curl -s --max-time 5 http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running and responding locally${NC}"
    echo ""
    echo "If uploads are still hanging, the issue is likely:"
    echo ""
    echo "1. ${CYAN}Request not reaching backend${NC}"
    echo "   - Check browser Network tab for request status"
    echo "   - Check for CORS errors in browser console"
    echo "   - Verify VITE_API_URL is correct in frontend"
    echo ""
    echo "2. ${CYAN}Backend hanging while processing${NC}"
    echo "   - Large file being read into memory"
    echo "   - Check backend logs during upload: docker compose logs -f backend"
    echo ""
    echo "3. ${CYAN}Timeout before request completes${NC}"
    echo "   - Browser/axios timeout (now fixed with 10min timeout)"
    echo "   - Network timeout"
    echo ""
    echo "4. ${CYAN}Redis connection issue${NC}"
    echo "   - Backend works without Redis, but start it: docker compose up -d redis"
    echo ""
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    echo "  Check: docker compose logs backend"
fi
echo ""
