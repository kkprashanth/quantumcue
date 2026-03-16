#!/bin/bash
# QuantumCue - Check Backend Health Script
# Deep dive into backend container health

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
echo "Backend Health Deep Check"
echo "=========================================="
echo ""

# Container status
echo -e "${BLUE}[1] Container Status:${NC}"
docker compose ps backend
echo ""

# Container details
BACKEND_ID=$(docker compose ps -q backend 2>/dev/null || echo "")
if [ ! -z "$BACKEND_ID" ]; then
    echo -e "${BLUE}[2] Container Details:${NC}"
    docker inspect "$BACKEND_ID" --format='State: {{.State.Status}}, ExitCode: {{.State.ExitCode}}, RestartCount: {{.RestartCount}}, StartedAt: {{.State.StartedAt}}' 2>/dev/null
    echo ""
    
    # Check if container is actually running
    STATE=$(docker inspect --format='{{.State.Status}}' "$BACKEND_ID" 2>/dev/null || echo "unknown")
    if [ "$STATE" != "running" ]; then
        echo -e "${RED}⚠ Container state is: ${STATE}${NC}"
    fi
fi
echo ""

# Check processes inside container
echo -e "${BLUE}[3] Processes Inside Container:${NC}"
if docker compose exec -T backend ps aux 2>/dev/null; then
    echo -e "${GREEN}✓ Can access container${NC}"
else
    echo -e "${RED}✗ Cannot access container or no processes${NC}"
    echo -e "${YELLOW}  This suggests the container is not fully running${NC}"
fi
echo ""

# Check if uvicorn is running
echo -e "${BLUE}[4] Uvicorn Process:${NC}"
UVICORN_PID=$(docker compose exec -T backend pgrep -f uvicorn 2>/dev/null | head -1 || echo "")
if [ ! -z "$UVICORN_PID" ]; then
    echo -e "${GREEN}✓ Uvicorn process found: PID ${UVICORN_PID}${NC}"
    docker compose exec -T backend ps -p "$UVICORN_PID" -o pid,user,cmd 2>/dev/null || echo "Could not get process details"
else
    echo -e "${RED}✗ No uvicorn process found${NC}"
    echo -e "${YELLOW}  Backend is not actually running!${NC}"
fi
echo ""

# Check logs for startup errors
echo -e "${BLUE}[5] Recent Startup Logs:${NC}"
docker compose logs backend --tail=50 2>/dev/null | grep -iE "start|error|exception|traceback|uvicorn|application" | tail -20 || echo "No relevant logs"
echo ""

# Check if port 8000 is listening
echo -e "${BLUE}[6] Port 8000 Status:${NC}"
if docker compose exec -T backend netstat -tln 2>/dev/null | grep ":8000" || docker compose exec -T backend ss -tln 2>/dev/null | grep ":8000"; then
    echo -e "${GREEN}✓ Port 8000 is listening${NC}"
else
    echo -e "${RED}✗ Port 8000 is NOT listening${NC}"
    echo -e "${YELLOW}  Backend is not accepting connections${NC}"
fi
echo ""

# Test API endpoint
echo -e "${BLUE}[7] API Health Check:${NC}"
if curl -s --max-time 5 http://localhost:8000/health 2>/dev/null; then
    echo -e "${GREEN}✓ API is responding${NC}"
else
    echo -e "${RED}✗ API is NOT responding${NC}"
    echo -e "${YELLOW}  Backend may be down or not accepting connections${NC}"
fi
echo ""

# Check container resource limits
echo -e "${BLUE}[8] Container Resource Usage:${NC}"
docker stats backend --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}" 2>/dev/null || echo "Could not get stats"
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

if [ -z "$UVICORN_PID" ]; then
    echo -e "${RED}CRITICAL: Backend is not running!${NC}"
    echo ""
    echo "The container shows as 'Up' but uvicorn is not running."
    echo "This explains why uploads hang - the backend isn't processing requests."
    echo ""
    echo "Try:"
    echo "  1. Check logs: docker compose logs backend --tail=100"
    echo "  2. Restart: docker compose restart backend"
    echo "  3. Rebuild if needed: docker compose up -d --build backend"
else
    echo -e "${GREEN}Backend appears to be running${NC}"
    echo ""
    echo "If uploads still hang, check:"
    echo "  1. Browser Network tab for request status"
    echo "  2. CORS configuration"
    echo "  3. File size limits"
fi
echo ""
