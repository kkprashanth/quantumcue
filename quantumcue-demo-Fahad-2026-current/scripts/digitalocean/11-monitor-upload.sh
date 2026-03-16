#!/bin/bash
# QuantumCue - Monitor Upload in Real-Time
# Monitors backend during file upload to diagnose hanging issues

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
echo "QuantumCue - Upload Monitor"
echo "=========================================="
echo ""
echo -e "${CYAN}This script will monitor the backend during file upload.${NC}"
echo -e "${CYAN}Start an upload in the browser, then watch this output.${NC}"
echo ""
read -p "Press Enter when you're ready to start monitoring (or Ctrl+C to cancel)..."
echo ""

cd "$APP_DIR"

echo -e "${BLUE}Monitoring backend... (Press Ctrl+C to stop)${NC}"
echo ""

# Monitor loop
while true; do
    clear
    echo "=========================================="
    echo "Upload Monitor - $(date '+%H:%M:%S')"
    echo "=========================================="
    echo ""
    
    # Backend container status
    echo -e "${CYAN}[1] Backend Container Status:${NC}"
    docker compose ps backend 2>/dev/null | tail -1 || echo "Container not found"
    echo ""
    
    # Backend process status
    echo -e "${CYAN}[2] Backend Process Status:${NC}"
    if docker compose exec -T backend ps aux 2>/dev/null | grep -E "python|uvicorn" | grep -v grep; then
        echo -e "${GREEN}✓ Backend processes running${NC}"
    else
        echo -e "${RED}✗ No backend processes found${NC}"
    fi
    echo ""
    
    # Memory usage
    echo -e "${CYAN}[3] Backend Memory Usage:${NC}"
    docker stats backend --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || echo "Could not get stats"
    echo ""
    
    # Recent backend logs (last 10 lines)
    echo -e "${CYAN}[4] Recent Backend Logs (last 10 lines):${NC}"
    docker compose logs backend --tail=10 2>/dev/null | tail -10 || echo "Could not get logs"
    echo ""
    
    # Check for upload-related activity
    echo -e "${CYAN}[5] Upload Activity (last 30 seconds):${NC}"
    UPLOAD_LOGS=$(docker compose logs backend --since 30s 2>/dev/null | grep -iE "upload|POST.*upload|file|dataset" || echo "No upload activity")
    if [ ! -z "$UPLOAD_LOGS" ] && [ "$UPLOAD_LOGS" != "No upload activity" ]; then
        echo "$UPLOAD_LOGS" | tail -5
    else
        echo -e "${YELLOW}No upload activity detected${NC}"
    fi
    echo ""
    
    # Check for errors
    echo -e "${CYAN}[6] Recent Errors:${NC}"
    ERROR_LOGS=$(docker compose logs backend --since 30s 2>/dev/null | grep -iE "error|exception|traceback|failed" || echo "No errors")
    if [ ! -z "$ERROR_LOGS" ] && [ "$ERROR_LOGS" != "No errors" ]; then
        echo -e "${RED}$ERROR_LOGS${NC}" | tail -5
    else
        echo -e "${GREEN}No errors${NC}"
    fi
    echo ""
    
    # Check uploads directory
    echo -e "${CYAN}[7] Uploads Directory:${NC}"
    if docker compose exec -T backend test -d uploads/datasets/ 2>/dev/null; then
        FILE_COUNT=$(docker compose exec -T backend find uploads/datasets/ -type f 2>/dev/null | wc -l || echo "0")
        RECENT_FILES=$(docker compose exec -T backend find uploads/datasets/ -type f -mmin -1 2>/dev/null | wc -l || echo "0")
        echo -e "  Total files: ${FILE_COUNT}"
        echo -e "  Files created in last minute: ${RECENT_FILES}"
        if [ "$RECENT_FILES" -gt 0 ]; then
            echo -e "${GREEN}  ✓ New file activity detected!${NC}"
            docker compose exec -T backend find uploads/datasets/ -type f -mmin -1 -exec ls -lh {} \; 2>/dev/null | head -3
        fi
    else
        echo -e "${YELLOW}  Uploads directory not accessible${NC}"
    fi
    echo ""
    
    # Network connections
    echo -e "${CYAN}[8] Active Connections to Backend:${NC}"
    BACKEND_PID=$(docker compose exec -T backend pgrep -f uvicorn 2>/dev/null | head -1 || echo "")
    if [ ! -z "$BACKEND_PID" ]; then
        CONNECTIONS=$(docker compose exec -T backend netstat -an 2>/dev/null | grep ":8000" | grep ESTABLISHED | wc -l || echo "0")
        echo -e "  Established connections on port 8000: ${CONNECTIONS}"
    else
        echo -e "${YELLOW}  Could not find backend process${NC}"
    fi
    echo ""
    
    echo -e "${CYAN}Refreshing in 2 seconds... (Ctrl+C to stop)${NC}"
    sleep 2
done
