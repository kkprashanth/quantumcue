#!/bin/bash
# QuantumCue - Check Memory Limits
# Checks Docker container memory limits and usage

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
echo "Memory Limits Check"
echo "=========================================="
echo ""

# System memory
echo -e "${BLUE}[1] System Memory:${NC}"
free -h
echo ""

# Docker container memory limits
echo -e "${BLUE}[2] Backend Container Memory Limits:${NC}"
BACKEND_ID=$(docker compose ps -q backend 2>/dev/null || echo "")
if [ ! -z "$BACKEND_ID" ]; then
    MEM_LIMIT=$(docker inspect "$BACKEND_ID" --format='{{.HostConfig.Memory}}' 2>/dev/null || echo "0")
    if [ "$MEM_LIMIT" = "0" ] || [ -z "$MEM_LIMIT" ]; then
        echo -e "${YELLOW}⚠ No memory limit set (using host memory)${NC}"
    else
        MEM_LIMIT_MB=$((MEM_LIMIT / 1024 / 1024))
        echo -e "${CYAN}  Memory limit: ${MEM_LIMIT_MB} MB${NC}"
    fi
    
    MEM_RESERVATION=$(docker inspect "$BACKEND_ID" --format='{{.HostConfig.MemoryReservation}}' 2>/dev/null || echo "0")
    if [ "$MEM_RESERVATION" != "0" ] && [ ! -z "$MEM_RESERVATION" ]; then
        MEM_RESERVATION_MB=$((MEM_RESERVATION / 1024 / 1024))
        echo -e "${CYAN}  Memory reservation: ${MEM_RESERVATION_MB} MB${NC}"
    fi
else
    echo -e "${RED}Backend container not found${NC}"
fi
echo ""

# Current memory usage
echo -e "${BLUE}[3] Current Memory Usage:${NC}"
if docker stats backend --no-stream --format "{{.MemUsage}}" 2>/dev/null; then
    docker stats backend --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || echo "Could not get stats"
else
    echo -e "${YELLOW}Could not get memory stats${NC}"
fi
echo ""

# Check for OOM kills
echo -e "${BLUE}[4] OOM Kill History:${NC}"
OOM_KILLS=$(dmesg 2>/dev/null | grep -i "out of memory\|killed process.*python\|killed process.*uvicorn" | tail -5 || echo "")
if [ ! -z "$OOM_KILLS" ]; then
    echo -e "${RED}⚠ Found OOM kills:${NC}"
    echo "$OOM_KILLS"
else
    echo -e "${GREEN}✓ No OOM kills found${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

if [ ! -z "$OOM_KILLS" ]; then
    echo -e "${RED}CRITICAL: Backend has been killed due to memory issues!${NC}"
    echo ""
    echo "Solutions:"
    echo "  1. Increase container memory limit in docker-compose.yml"
    echo "  2. Use file streaming (already implemented)"
    echo "  3. Upgrade droplet RAM"
    echo ""
elif [ "$MEM_LIMIT" != "0" ] && [ ! -z "$MEM_LIMIT" ]; then
    MEM_LIMIT_MB=$((MEM_LIMIT / 1024 / 1024))
    if [ "$MEM_LIMIT_MB" -lt 512 ]; then
        echo -e "${YELLOW}⚠ Memory limit is low (${MEM_LIMIT_MB} MB)${NC}"
        echo "  For 31MB file uploads, recommend at least 512MB-1GB"
    else
        echo -e "${GREEN}✓ Memory limit seems adequate${NC}"
    fi
else
    echo -e "${GREEN}✓ No memory limit set (using host memory)${NC}"
    echo "  System has $(free -h | awk '/^Mem:/ {print $2}') total memory"
fi
echo ""
