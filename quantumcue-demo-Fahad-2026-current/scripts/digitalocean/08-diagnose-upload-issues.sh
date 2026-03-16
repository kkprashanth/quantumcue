#!/bin/bash
# QuantumCue - Upload Issues Diagnostic Script
# Diagnoses dataset upload hanging/failing issues on DigitalOcean

set -e

echo "=========================================="
echo "QuantumCue - Upload Issues Diagnostics"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
APP_DIR="${QUANTUMCUE_APP_DIR:-/opt/quantumcuedemo}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}Running as non-root, some checks may be limited${NC}"
    SUDO="sudo"
else
    SUDO=""
fi

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Application directory not found: $APP_DIR${NC}"
    exit 1
fi

cd "$APP_DIR"

# Check if Docker Compose is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${BLUE}[1/8] Checking disk space...${NC}"
df -h | grep -E '^/dev/|Filesystem'
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}⚠ CRITICAL: Disk usage is ${DISK_USAGE}% - uploads will fail!${NC}"
    DISK_CRITICAL=true
elif [ "$DISK_USAGE" -gt 80 ]; then
    echo -e "${YELLOW}⚠ WARNING: Disk usage is ${DISK_USAGE}% - getting high${NC}"
    DISK_CRITICAL=false
else
    echo -e "${GREEN}✓ Disk usage: ${DISK_USAGE}%${NC}"
    DISK_CRITICAL=false
fi
echo ""

echo -e "${BLUE}[2/8] Checking memory and swap...${NC}"
free -h
MEM_AVAIL=$(free -m | awk 'NR==2{printf "%.0f", $7*100/$2}')
if [ "$MEM_AVAIL" -lt 10 ]; then
    echo -e "${RED}⚠ WARNING: Less than 10% memory available - uploads may hang!${NC}"
    MEM_CRITICAL=true
else
    echo -e "${GREEN}✓ Memory available: ${MEM_AVAIL}%${NC}"
    MEM_CRITICAL=false
fi

SWAP_INFO=$($SUDO swapon --show 2>/dev/null)
if [ -z "$SWAP_INFO" ]; then
    echo -e "${YELLOW}⚠ No swap space configured${NC}"
else
    SWAP_USED=$(free | awk '/^Swap:/ {print $3}')
    SWAP_TOTAL=$(free | awk '/^Swap:/ {print $2}')
    if [ "$SWAP_TOTAL" -gt 0 ]; then
        SWAP_PERCENT=$((SWAP_USED * 100 / SWAP_TOTAL))
        if [ "$SWAP_PERCENT" -gt 50 ]; then
            echo -e "${RED}⚠ WARNING: Swap usage is ${SWAP_PERCENT}% - system is heavily swapping!${NC}"
        else
            echo -e "${GREEN}✓ Swap usage: ${SWAP_PERCENT}%${NC}"
        fi
    fi
fi
echo ""

echo -e "${BLUE}[3/8] Checking Docker container status...${NC}"
if docker compose ps 2>/dev/null | grep -q "backend"; then
    BACKEND_STATUS=$(docker compose ps backend 2>/dev/null | tail -1 | awk '{print $6}')
    if [ "$BACKEND_STATUS" = "Up" ] || [ "$BACKEND_STATUS" = "running" ]; then
        echo -e "${GREEN}✓ Backend container is running${NC}"
    else
        echo -e "${RED}✗ Backend container is not running properly: ${BACKEND_STATUS}${NC}"
    fi
else
    echo -e "${RED}✗ Backend container not found or Docker Compose not accessible${NC}"
fi
echo ""

echo -e "${BLUE}[4/8] Checking uploads directory...${NC}"
# Check if uploads directory exists inside backend container
if docker compose exec -T backend test -d uploads/ 2>/dev/null; then
    echo -e "${GREEN}✓ Uploads directory exists${NC}"
    
    # Check uploads directory size
    UPLOADS_SIZE=$(docker compose exec -T backend du -sh uploads/ 2>/dev/null | awk '{print $1}' || echo "unknown")
    echo -e "${CYAN}  Uploads directory size: ${UPLOADS_SIZE}${NC}"
    
    # Check for large files in uploads
    LARGE_FILES=$(docker compose exec -T backend find uploads/ -type f -size +100M 2>/dev/null | wc -l || echo "0")
    if [ "$LARGE_FILES" -gt 0 ]; then
        echo -e "${YELLOW}  ⚠ Found ${LARGE_FILES} file(s) larger than 100MB${NC}"
        echo -e "${CYAN}  Large files:${NC}"
        docker compose exec -T backend find uploads/ -type f -size +100M -exec ls -lh {} \; 2>/dev/null | head -10
    fi
    
    # Check permissions
    if docker compose exec -T backend test -w uploads/ 2>/dev/null; then
        echo -e "${GREEN}✓ Uploads directory is writable${NC}"
    else
        echo -e "${RED}✗ Uploads directory is NOT writable - this will cause upload failures!${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Uploads directory does not exist in backend container${NC}"
    echo -e "${CYAN}  Attempting to create it...${NC}"
    docker compose exec -T backend mkdir -p uploads/datasets 2>/dev/null && \
        echo -e "${GREEN}✓ Created uploads directory${NC}" || \
        echo -e "${RED}✗ Failed to create uploads directory${NC}"
fi
echo ""

echo -e "${BLUE}[5/8] Checking for temporary files and directories...${NC}"
# Check for Python temp directories
TEMP_DIRS=$(docker compose exec -T backend find /tmp -type d -name "*dataset*" -o -name "tmp*" 2>/dev/null | wc -l || echo "0")
if [ "$TEMP_DIRS" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found ${TEMP_DIRS} temporary directory(ies)${NC}"
    echo -e "${CYAN}  Temp directories:${NC}"
    docker compose exec -T backend find /tmp -type d -name "*dataset*" -o -name "tmp*" 2>/dev/null | head -10
else
    echo -e "${GREEN}✓ No suspicious temporary directories found${NC}"
fi

# Check for orphaned temp files
TEMP_FILES=$(docker compose exec -T backend find /tmp -type f -size +10M -mtime +1 2>/dev/null | wc -l || echo "0")
if [ "$TEMP_FILES" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found ${TEMP_FILES} large temporary file(s) older than 1 day${NC}"
fi
echo ""

echo -e "${BLUE}[6/8] Checking Docker container resource usage...${NC}"
if docker stats --no-stream backend 2>/dev/null | grep -q "backend"; then
    echo -e "${CYAN}Backend container stats:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" backend 2>/dev/null || echo "Could not get stats"
else
    echo -e "${YELLOW}⚠ Backend container not running or not accessible${NC}"
fi
echo ""

echo -e "${BLUE}[7/9] Checking recent backend logs for upload errors...${NC}"
LOG_ERRORS=$(docker compose logs backend --tail=200 2>/dev/null | grep -iE "upload|error|disk|space|full|timeout|failed|memory|killed" | tail -20 || echo "")
if [ ! -z "$LOG_ERRORS" ]; then
    echo -e "${YELLOW}⚠ Found error messages in logs:${NC}"
    echo "$LOG_ERRORS" | head -20
else
    echo -e "${GREEN}✓ No obvious error messages in recent logs${NC}"
fi
echo ""

echo -e "${BLUE}[8/9] Checking for hanging upload processes...${NC}"
HANGING_PROCS=$(docker compose exec -T backend ps aux 2>/dev/null | grep -iE "python|uvicorn|upload" | grep -v grep || echo "")
if [ ! -z "$HANGING_PROCS" ]; then
    echo -e "${CYAN}Active Python/upload processes:${NC}"
    echo "$HANGING_PROCS"
else
    echo -e "${GREEN}✓ No suspicious processes found${NC}"
fi
echo ""

echo -e "${BLUE}[9/9] Checking backend API response and timeout settings...${NC}"
# Check if backend is responding
if curl -s --max-time 5 http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
    
    # Check response time
    RESPONSE_TIME=$(time curl -s --max-time 10 http://localhost:8000/health > /dev/null 2>&1 | grep real | awk '{print $2}' || echo "unknown")
    echo -e "${CYAN}  Health check response time: ${RESPONSE_TIME}${NC}"
    
    # Check if there's a reverse proxy (nginx) that might have timeout limits
    if command -v nginx &> /dev/null || docker compose ps 2>/dev/null | grep -q nginx; then
        echo -e "${YELLOW}⚠ Nginx detected - check client_max_body_size and proxy_read_timeout settings${NC}"
        echo -e "${CYAN}  Nginx may have file size or timeout limits that cause uploads to hang${NC}"
    fi
else
    echo -e "${RED}✗ Backend API is not responding${NC}"
fi

# Check uvicorn timeout settings
UVICORN_TIMEOUT=$(docker compose exec -T backend ps aux 2>/dev/null | grep uvicorn | grep -oE "timeout [0-9]+" || echo "")
if [ ! -z "$UVICORN_TIMEOUT" ]; then
    echo -e "${CYAN}  Uvicorn timeout: ${UVICORN_TIMEOUT}${NC}"
else
    echo -e "${YELLOW}⚠ No explicit uvicorn timeout found (using defaults)${NC}"
fi
echo ""

echo "=========================================="
echo "Diagnostic Summary"
echo "=========================================="
echo ""

# Check backend container exit status
BACKEND_EXIT_CODE=$(docker compose ps backend 2>/dev/null | tail -1 | awk '{print $6}' || echo "")
if [ "$BACKEND_EXIT_CODE" = "5" ] || [ "$BACKEND_EXIT_CODE" = "Exited" ]; then
    echo -e "${RED}CRITICAL: Backend container has exited!${NC}"
    echo "  This is why uploads are hanging - the backend isn't running."
    echo ""
    echo "  Checking exit reason..."
    EXIT_REASON=$(docker compose ps backend 2>/dev/null | tail -1 || echo "")
    echo "  Status: $EXIT_REASON"
    echo ""
    echo "  Recent exit logs:"
    docker compose logs backend --tail=50 2>/dev/null | tail -20 || echo "Could not get logs"
    echo ""
    echo "  ${CYAN}SOLUTION: Restart the backend container${NC}"
    echo "    cd /opt/quantumcuedemo"
    echo "    docker compose up -d backend"
    echo ""
    ISSUES_FOUND=true
fi

# Summary and recommendations
if [ -z "$ISSUES_FOUND" ]; then
    ISSUES_FOUND=false
fi

if [ "$DISK_CRITICAL" = true ]; then
    echo -e "${RED}CRITICAL: Disk is ${DISK_USAGE}% full - uploads will fail!${NC}"
    echo "  Solutions:"
    echo "    1. Clean Docker: docker system prune -af --volumes"
    echo "    2. Remove old uploads: docker compose exec backend find uploads/ -type f -mtime +30 -delete"
    echo "    3. Clean temp files: docker compose exec backend find /tmp -type f -mtime +1 -delete"
    echo ""
    ISSUES_FOUND=true
fi

if [ "$MEM_CRITICAL" = true ]; then
    echo -e "${RED}CRITICAL: Low memory - uploads may hang!${NC}"
    echo "  Solutions:"
    echo "    1. Add swap space: fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile"
    echo "    2. Restart services: docker compose restart"
    echo "    3. Upgrade droplet RAM"
    echo ""
    ISSUES_FOUND=true
fi

if [ ! -z "$LOG_ERRORS" ]; then
    echo -e "${YELLOW}WARNING: Errors found in logs${NC}"
    echo "  Check logs: docker compose logs backend --tail=100"
    echo ""
    ISSUES_FOUND=true
fi

if [ "$ISSUES_FOUND" = false ]; then
    echo -e "${GREEN}✓ No obvious resource issues detected${NC}"
    echo ""
    echo "If uploads are still hanging, check these common causes:"
    echo ""
    echo "1. ${CYAN}Large file size${NC} - Backend reads entire file into memory"
    echo "   - Check file size: Is it > 100MB?"
    echo "   - Solution: Upload may need streaming instead of reading entire file"
    echo ""
    echo "2. ${CYAN}Request timeout${NC} - No timeout configured in axios"
    echo "   - Check browser Network tab for request status"
    echo "   - Look for 'pending' or 'timeout' status"
    echo "   - Solution: Add timeout to axios or increase server timeout"
    echo ""
    echo "3. ${CYAN}Nginx/proxy timeout${NC} - Reverse proxy may have limits"
    echo "   - Check nginx config for client_max_body_size"
    echo "   - Check proxy_read_timeout settings"
    echo "   - Solution: Increase nginx limits if present"
    echo ""
    echo "4. ${CYAN}Memory during upload${NC} - Large files consume memory"
    echo "   - Monitor: docker stats backend (during upload)"
    echo "   - Check if memory spikes and container gets OOM killed"
    echo ""
    echo "5. ${CYAN}Database connection timeout${NC} - DB operations during upload"
    echo "   - Check: docker compose logs backend | grep -i 'database\|connection'"
    echo ""
    echo "6. ${CYAN}Frontend timeout${NC} - Browser/axios default timeout"
    echo "   - Check browser console for timeout errors"
    echo "   - Check Network tab for request duration"
fi

echo ""
echo "=========================================="
echo "Cleanup Options"
echo "=========================================="
echo ""
echo "To clean up space, run these commands (in order of safety):"
echo ""
echo "1. Clean Docker system (safest - removes unused images/containers):"
echo "   ${CYAN}docker system prune -af --volumes${NC}"
echo ""
echo "2. Clean Python cache:"
echo "   ${CYAN}docker compose exec backend find . -type d -name '__pycache__' -exec rm -r {} + 2>/dev/null || true${NC}"
echo "   ${CYAN}docker compose exec backend find . -type f -name '*.pyc' -delete 2>/dev/null || true${NC}"
echo ""
echo "3. Clean old temp files (older than 1 day):"
echo "   ${CYAN}docker compose exec backend find /tmp -type f -mtime +1 -delete 2>/dev/null || true${NC}"
echo ""
echo "4. Clean old uploads (older than 30 days) - ${RED}WARNING: This deletes old datasets!${NC}:"
echo "   ${CYAN}docker compose exec backend find uploads/ -type f -mtime +30 -delete${NC}"
echo ""
echo "5. Full cleanup script:"
echo "   ${CYAN}bash scripts/digitalocean/06-fix-freezing.sh${NC}"
echo ""
