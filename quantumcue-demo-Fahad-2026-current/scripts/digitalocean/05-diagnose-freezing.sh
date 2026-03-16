#!/bin/bash
# QuantumCue - Terminal Freezing Diagnostic Script
# Diagnoses why terminal/shell commands are freezing on DigitalOcean

set -e

echo "=========================================="
echo "QuantumCue - Terminal Freezing Diagnostics"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}Running as non-root, some checks may be limited${NC}"
    SUDO="sudo"
else
    SUDO=""
fi

echo -e "${YELLOW}[1/8] Checking disk space...${NC}"
df -h | grep -E '^/dev/|Filesystem'
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}⚠ WARNING: Disk usage is ${DISK_USAGE}% - this can cause freezing!${NC}"
elif [ "$DISK_USAGE" -gt 80 ]; then
    echo -e "${YELLOW}⚠ Disk usage is ${DISK_USAGE}% - getting high${NC}"
else
    echo -e "${GREEN}✓ Disk usage: ${DISK_USAGE}%${NC}"
fi
echo ""

echo -e "${YELLOW}[2/8] Checking memory usage...${NC}"
free -h
MEM_AVAIL=$(free -m | awk 'NR==2{printf "%.0f", $7*100/$2}')
if [ "$MEM_AVAIL" -lt 10 ]; then
    echo -e "${RED}⚠ WARNING: Less than 10% memory available - system may be swapping!${NC}"
    echo -e "${RED}   This is a common cause of terminal freezing.${NC}"
else
    echo -e "${GREEN}✓ Memory available: ${MEM_AVAIL}%${NC}"
fi
echo ""

echo -e "${YELLOW}[3/8] Checking swap usage...${NC}"
SWAP_INFO=$($SUDO swapon --show 2>/dev/null)
if [ -z "$SWAP_INFO" ]; then
    echo -e "${YELLOW}⚠ No swap space configured${NC}"
    echo -e "${YELLOW}   Consider adding swap space for better stability${NC}"
    SWAP_USAGE=0
else
    echo "$SWAP_INFO"
    SWAP_TOTAL=$(free | awk '/^Swap:/ {print $2}')
    SWAP_USED=$(free | awk '/^Swap:/ {print $3}')
    if [ "$SWAP_TOTAL" -gt 0 ]; then
        SWAP_USAGE=$((SWAP_USED * 100 / SWAP_TOTAL))
        if [ "$SWAP_USAGE" -gt 50 ]; then
            echo -e "${RED}⚠ WARNING: Swap usage is ${SWAP_USAGE}% - system is heavily swapping!${NC}"
            echo -e "${RED}   This causes severe performance degradation and freezing.${NC}"
        elif [ "$SWAP_USAGE" -gt 0 ]; then
            echo -e "${YELLOW}⚠ Swap usage: ${SWAP_USAGE}% - system is using swap${NC}"
        else
            echo -e "${GREEN}✓ No swap usage${NC}"
        fi
    else
        SWAP_USAGE=0
        echo -e "${GREEN}✓ No swap configured or used${NC}"
    fi
fi
echo ""

echo -e "${YELLOW}[4/8] Checking Docker container resource usage...${NC}"
if command -v docker &> /dev/null; then
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || echo "No containers running or Docker not accessible"
    
    # Check total Docker memory usage
    DOCKER_MEM=$(docker stats --no-stream --format "{{.MemUsage}}" 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")
    if [ "$DOCKER_MEM" != "0" ] && [ ! -z "$DOCKER_MEM" ]; then
        echo -e "${YELLOW}Total Docker memory usage: ${DOCKER_MEM}${NC}"
    fi
else
    echo "Docker not installed"
fi
echo ""

echo -e "${YELLOW}[5/8] Checking system load...${NC}"
uptime
LOAD_1=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
CPU_CORES=$(nproc)
# Use awk for comparison (bc might not be installed)
if command -v bc &> /dev/null; then
    LOAD_THRESHOLD=$(echo "$CPU_CORES * 2" | bc)
    if (( $(echo "$LOAD_1 > $LOAD_THRESHOLD" | bc -l) )); then
        echo -e "${RED}⚠ WARNING: System load ($LOAD_1) is very high (${CPU_CORES} cores)${NC}"
        echo -e "${RED}   High load can cause command freezing.${NC}"
    elif (( $(echo "$LOAD_1 > $CPU_CORES" | bc -l) )); then
        echo -e "${YELLOW}⚠ System load ($LOAD_1) is high for ${CPU_CORES} cores${NC}"
    else
        echo -e "${GREEN}✓ System load is normal${NC}"
    fi
else
    # Fallback using awk for comparison
    LOAD_INT=$(echo "$LOAD_1" | awk -F. '{print $1}')
    CPU_DOUBLE=$((CPU_CORES * 2))
    if [ "$LOAD_INT" -gt "$CPU_DOUBLE" ]; then
        echo -e "${RED}⚠ WARNING: System load ($LOAD_1) is very high (${CPU_CORES} cores)${NC}"
        echo -e "${RED}   High load can cause command freezing.${NC}"
    elif [ "$LOAD_INT" -gt "$CPU_CORES" ]; then
        echo -e "${YELLOW}⚠ System load ($LOAD_1) is high for ${CPU_CORES} cores${NC}"
    else
        echo -e "${GREEN}✓ System load is normal${NC}"
    fi
fi
echo ""

echo -e "${YELLOW}[6/8] Checking for I/O wait...${NC}"
iostat -x 1 2 2>/dev/null | tail -n +4 || {
    echo "iostat not available, checking with top..."
    top -bn1 | head -20
}
echo ""

echo -e "${YELLOW}[7/8] Checking running processes (top 10 by CPU)...${NC}"
ps aux --sort=-%cpu | head -11
echo ""

echo -e "${YELLOW}[8/8] Checking for zombie processes...${NC}"
ZOMBIES=$(ps aux | awk '$8 ~ /^Z/ {print $2}' | wc -l)
if [ "$ZOMBIES" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $ZOMBIES zombie process(es)${NC}"
    ps aux | awk '$8 ~ /^Z/ {print}'
else
    echo -e "${GREEN}✓ No zombie processes${NC}"
fi
echo ""

echo -e "${YELLOW}Checking MongoDB and Redis status...${NC}"
if [ -d "/opt/quantumcuedemo" ]; then
    cd /opt/quantumcuedemo 2>/dev/null || true
    if [ -f "docker-compose.yml" ]; then
        echo "Docker Compose services:"
        docker compose ps 2>/dev/null || docker-compose ps 2>/dev/null || echo "Could not check Docker Compose status"
    fi
fi
echo ""

echo "=========================================="
echo "Diagnostic Summary"
echo "=========================================="
echo ""

# Summary recommendations
if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}CRITICAL: Disk is ${DISK_USAGE}% full - free up space immediately!${NC}"
    echo "  Run: docker system prune -a (removes unused Docker images/containers)"
    echo "  Run: docker volume prune (removes unused volumes)"
    echo ""
fi

if [ "$MEM_AVAIL" -lt 10 ] || [ "$SWAP_USAGE" -gt 50 ]; then
    echo -e "${RED}CRITICAL: Memory pressure detected - this is likely causing freezing!${NC}"
    echo "  Solutions:"
    echo "  1. Stop unnecessary Docker containers"
    echo "  2. Increase droplet RAM (upgrade plan)"
    echo "  3. Add swap space (temporary fix)"
    echo ""
fi

if command -v bc &> /dev/null; then
    if (( $(echo "$LOAD_1 > $CPU_CORES" | bc -l) )); then
        echo -e "${YELLOW}WARNING: High system load detected${NC}"
        echo "  Check what processes are consuming CPU: ps aux --sort=-%cpu | head -10"
        echo ""
    fi
else
    LOAD_INT=$(echo "$LOAD_1" | awk -F. '{print $1}')
    if [ "$LOAD_INT" -gt "$CPU_CORES" ]; then
        echo -e "${YELLOW}WARNING: High system load detected${NC}"
        echo "  Check what processes are consuming CPU: ps aux --sort=-%cpu | head -10"
        echo ""
    fi
fi

echo "Common fixes for terminal freezing:"
echo "  1. Free up disk space: docker system prune -a"
echo "  2. Restart Docker: systemctl restart docker"
echo "  3. Restart services: cd /opt/quantumcuedemo && docker compose restart"
echo "  4. Check logs: docker compose logs --tail=50"
echo "  5. Increase swap (temporary): fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile"
echo ""
