#!/bin/bash
# QuantumCue - Fix Backend Crash Script
# Diagnoses and fixes backend container crashes, optionally cleans uploads

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
APP_DIR="${QUANTUMCUE_APP_DIR:-/opt/quantumcuedemo}"

echo "=========================================="
echo "QuantumCue - Fix Backend Crash"
echo "=========================================="
echo ""

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

# Check backend container status
echo -e "${BLUE}[1/5] Checking backend container status...${NC}"
BACKEND_STATUS=$(docker compose ps backend 2>/dev/null | tail -1 | awk '{print $6}' || echo "unknown")
echo -e "${CYAN}  Backend status: ${BACKEND_STATUS}${NC}"

# Get detailed container info
BACKEND_CONTAINER_ID=$(docker compose ps -q backend 2>/dev/null || echo "")
if [ ! -z "$BACKEND_CONTAINER_ID" ]; then
    CONTAINER_STATE=$(docker inspect --format='{{.State.Status}}' "$BACKEND_CONTAINER_ID" 2>/dev/null || echo "unknown")
    EXIT_CODE=$(docker inspect --format='{{.State.ExitCode}}' "$BACKEND_CONTAINER_ID" 2>/dev/null || echo "unknown")
    RESTART_COUNT=$(docker inspect --format='{{.RestartCount}}' "$BACKEND_CONTAINER_ID" 2>/dev/null || echo "unknown")
    
    echo -e "${CYAN}  Container state: ${CONTAINER_STATE}${NC}"
    echo -e "${CYAN}  Exit code: ${EXIT_CODE}${NC}"
    echo -e "${CYAN}  Restart count: ${RESTART_COUNT}${NC}"
    
    if [ "$CONTAINER_STATE" = "restarting" ] || [ "$RESTART_COUNT" -gt 5 ]; then
        echo -e "${RED}  ⚠ Backend is in a crash loop!${NC}"
    fi
fi
echo ""

# Check backend logs for crash reasons
echo -e "${BLUE}[2/5] Checking backend logs for crash reasons...${NC}"
CRASH_LOGS=$(docker compose logs backend --tail=100 2>/dev/null | grep -iE "error|exception|traceback|killed|exit|fatal|crash" | tail -30 || echo "")
if [ ! -z "$CRASH_LOGS" ]; then
    echo -e "${YELLOW}  Found crash/error messages:${NC}"
    echo "$CRASH_LOGS" | head -20
else
    echo -e "${GREEN}  ✓ No obvious crash messages in recent logs${NC}"
fi
echo ""

# Check for OOM kills
echo -e "${BLUE}[3/5] Checking for Out-of-Memory kills...${NC}"
OOM_KILLS=$(dmesg 2>/dev/null | grep -i "out of memory\|killed process.*python\|killed process.*uvicorn" | tail -10 || echo "")
if [ ! -z "$OOM_KILLS" ]; then
    echo -e "${RED}  ⚠ Found OOM kills!${NC}"
    echo "$OOM_KILLS"
    echo ""
    echo -e "${YELLOW}  This means the backend ran out of memory and was killed${NC}"
    echo -e "${YELLOW}  Large file uploads can cause this${NC}"
else
    echo -e "${GREEN}  ✓ No OOM kills found${NC}"
fi
echo ""

# Check uploads directory
echo -e "${BLUE}[4/5] Checking uploads directory...${NC}"
if docker compose exec -T backend test -d uploads/ 2>/dev/null; then
    UPLOADS_SIZE=$(docker compose exec -T backend du -sh uploads/ 2>/dev/null | awk '{print $1}' || echo "unknown")
    UPLOADS_COUNT=$(docker compose exec -T backend find uploads/ -type f 2>/dev/null | wc -l || echo "0")
    echo -e "${CYAN}  Uploads directory size: ${UPLOADS_SIZE}${NC}"
    echo -e "${CYAN}  Number of files: ${UPLOADS_COUNT}${NC}"
    
    # Check for very large files that might cause memory issues
    LARGE_FILES=$(docker compose exec -T backend find uploads/ -type f -size +50M 2>/dev/null | wc -l || echo "0")
    if [ "$LARGE_FILES" -gt 0 ]; then
        echo -e "${YELLOW}  ⚠ Found ${LARGE_FILES} file(s) larger than 50MB${NC}"
        echo -e "${CYAN}  Large files:${NC}"
        docker compose exec -T backend find uploads/ -type f -size +50M -exec ls -lh {} \; 2>/dev/null | head -10
    fi
else
    echo -e "${YELLOW}  ⚠ Uploads directory not accessible (container may not be running)${NC}"
fi
echo ""

# Ask if user wants to clean uploads
echo "=========================================="
echo "Fix Options"
echo "=========================================="
echo ""
echo -e "${CYAN}The backend container appears to be crashing.${NC}"
echo ""
echo "Options:"
echo "  1. Restart backend only (keep uploads)"
echo "  2. Clean uploads and restart backend (recommended if OOM kills found)"
echo "  3. Full cleanup (uploads + rebuild backend)"
echo ""
read -p "Choose option (1/2/3) [default: 1]: " OPTION
OPTION=${OPTION:-1}

case "$OPTION" in
    1)
        echo ""
        echo -e "${BLUE}[5/5] Restarting backend only...${NC}"
        if [ -f "backend/.env" ]; then
            set -a
            source backend/.env 2>/dev/null || true
            set +a
        fi
        docker compose restart backend 2>/dev/null || docker-compose restart backend 2>/dev/null
        echo -e "${GREEN}✓ Backend restarted${NC}"
        ;;
    2)
        echo ""
        echo -e "${YELLOW}⚠ This will delete all uploaded files!${NC}"
        read -p "Are you sure? Type 'yes' to continue: " CONFIRM
        if [ "$CONFIRM" != "yes" ]; then
            echo "Cancelled."
            exit 0
        fi
        
        echo -e "${BLUE}[5/5] Cleaning uploads and restarting backend...${NC}"
        
        # Stop backend
        docker compose stop backend 2>/dev/null || true
        
        # Clean uploads
        if docker compose exec -T backend test -d uploads/ 2>/dev/null; then
            echo -e "${CYAN}  Removing uploads...${NC}"
            docker compose exec -T backend rm -rf uploads/datasets/* uploads/models/* 2>/dev/null || true
            docker compose exec -T backend find uploads/ -type f -delete 2>/dev/null || true
            echo -e "${GREEN}  ✓ Uploads cleaned${NC}"
        else
            # If container not running, clean from host
            if [ -d "backend/uploads" ]; then
                echo -e "${CYAN}  Removing uploads from host...${NC}"
                rm -rf backend/uploads/datasets/* backend/uploads/models/* 2>/dev/null || true
                find backend/uploads/ -type f -delete 2>/dev/null || true
                echo -e "${GREEN}  ✓ Uploads cleaned${NC}"
            fi
        fi
        
        # Restart backend
        if [ -f "backend/.env" ]; then
            set -a
            source backend/.env 2>/dev/null || true
            set +a
        fi
        docker compose up -d backend 2>/dev/null || docker-compose up -d backend 2>/dev/null
        echo -e "${GREEN}✓ Backend restarted${NC}"
        ;;
    3)
        echo ""
        echo -e "${YELLOW}⚠ This will delete all uploaded files and rebuild the backend!${NC}"
        read -p "Are you sure? Type 'yes' to continue: " CONFIRM
        if [ "$CONFIRM" != "yes" ]; then
            echo "Cancelled."
            exit 0
        fi
        
        echo -e "${BLUE}[5/5] Full cleanup and rebuild...${NC}"
        
        # Stop backend
        docker compose stop backend 2>/dev/null || true
        
        # Clean uploads
        if docker compose exec -T backend test -d uploads/ 2>/dev/null; then
            echo -e "${CYAN}  Removing uploads...${NC}"
            docker compose exec -T backend rm -rf uploads/datasets/* uploads/models/* 2>/dev/null || true
        elif [ -d "backend/uploads" ]; then
            echo -e "${CYAN}  Removing uploads from host...${NC}"
            rm -rf backend/uploads/datasets/* backend/uploads/models/* 2>/dev/null || true
        fi
        
        # Rebuild backend
        if [ -f "backend/.env" ]; then
            set -a
            source backend/.env 2>/dev/null || true
            set +a
        fi
        echo -e "${CYAN}  Rebuilding backend...${NC}"
        docker compose build --no-cache backend 2>/dev/null || docker-compose build --no-cache backend 2>/dev/null
        docker compose up -d backend 2>/dev/null || docker-compose up -d backend 2>/dev/null
        echo -e "${GREEN}✓ Backend rebuilt and restarted${NC}"
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Verification"
echo "=========================================="
echo ""

# Wait a moment
sleep 5

# Check if backend is running
echo -e "${CYAN}Checking backend status...${NC}"
if docker compose ps backend 2>/dev/null | grep -q "Up\|running"; then
    echo -e "${GREEN}✓ Backend container is running${NC}"
    
    # Check if API is responding
    sleep 3
    if curl -s --max-time 5 http://localhost:8000/health &> /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend API is responding${NC}"
    else
        echo -e "${YELLOW}⚠ Backend API not responding yet (may need more time)${NC}"
    fi
else
    echo -e "${RED}✗ Backend container is still not running${NC}"
    echo -e "${YELLOW}  Check logs: docker compose logs backend --tail=50${NC}"
fi

echo ""
echo "Next steps:"
echo "  1. Monitor backend: docker compose logs -f backend"
echo "  2. Check status: docker compose ps"
echo "  3. If still crashing, check logs for errors"
echo ""
