#!/bin/bash

# Script to check for reverse proxy (nginx) and timeout settings
# that might be blocking large file uploads

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Proxy & Timeout Configuration Check"
echo "=========================================="
echo ""

# Check if nginx is running
echo "[1] Checking for Nginx..."
if command -v nginx &> /dev/null || docker ps | grep -q nginx; then
    echo -e "${YELLOW}⚠ Nginx detected${NC}"
    echo ""
    echo "Checking nginx configuration..."
    
    # Check for nginx config files
    NGINX_CONF_FILES=(
        "/etc/nginx/nginx.conf"
        "/etc/nginx/conf.d/default.conf"
        "/etc/nginx/sites-enabled/default"
        "$(pwd)/nginx.conf"
        "$(pwd)/frontend/nginx.conf"
    )
    
    for conf_file in "${NGINX_CONF_FILES[@]}"; do
        if [ -f "$conf_file" ]; then
            echo -e "${CYAN}Found: $conf_file${NC}"
            echo ""
            echo "Checking for upload-related settings:"
            
            # Check client_max_body_size
            if grep -q "client_max_body_size" "$conf_file"; then
                echo -e "${GREEN}✓ client_max_body_size found:${NC}"
                grep "client_max_body_size" "$conf_file" | head -5
            else
                echo -e "${RED}✗ client_max_body_size NOT SET (default is 1MB - too small!)${NC}"
            fi
            
            # Check proxy timeouts
            echo ""
            echo "Proxy timeout settings:"
            grep -E "proxy_read_timeout|proxy_connect_timeout|proxy_send_timeout|send_timeout" "$conf_file" 2>/dev/null || echo "  (none found)"
            
            # Check if backend is proxied
            if grep -q "proxy_pass.*8000\|proxy_pass.*backend" "$conf_file"; then
                echo -e "${YELLOW}⚠ Backend is proxied through nginx${NC}"
                grep "proxy_pass.*8000\|proxy_pass.*backend" "$conf_file" | head -3
            fi
            
            echo ""
        fi
    done
else
    echo -e "${GREEN}✓ No nginx detected (direct connection)${NC}"
fi

echo ""
echo "[2] Checking Docker Compose Network Configuration..."
if [ -f "docker-compose.yml" ]; then
    echo "Checking for exposed ports and network settings:"
    
    # Check if backend port is exposed
    if grep -A 5 "backend:" docker-compose.yml | grep -q "ports:"; then
        echo -e "${YELLOW}⚠ Backend ports are exposed${NC}"
        grep -A 10 "backend:" docker-compose.yml | grep -A 5 "ports:" | head -6
    else
        echo -e "${GREEN}✓ Backend not directly exposed (internal network)${NC}"
    fi
    
    # Check frontend configuration
    if grep -A 5 "frontend:" docker-compose.yml | grep -q "ports:"; then
        echo ""
        echo "Frontend port configuration:"
        grep -A 10 "frontend:" docker-compose.yml | grep -A 5 "ports:" | head -6
    fi
fi

echo ""
echo "[3] Checking Uvicorn Configuration..."
if [ -f "docker-compose.yml" ]; then
    echo "Current uvicorn command:"
    grep "uvicorn" docker-compose.yml | grep -v "^#" | head -1
    
    echo ""
    echo "Checking for timeout settings:"
    if grep "uvicorn" docker-compose.yml | grep -q "timeout"; then
        grep "uvicorn" docker-compose.yml | grep "timeout"
    else
        echo -e "${YELLOW}⚠ No explicit timeout settings found${NC}"
        echo "  Default uvicorn timeout is 5 seconds (too short for large uploads)"
    fi
fi

echo ""
echo "[4] Checking Active Connections..."
echo "Active connections to port 8000 (backend):"
if command -v ss &> /dev/null; then
    ss -tn | grep ":8000" | head -10 || echo "  (none found)"
elif command -v netstat &> /dev/null; then
    netstat -tn | grep ":8000" | head -10 || echo "  (none found)"
else
    echo "  (ss/netstat not available)"
fi

echo ""
echo "[5] Checking System Connection Limits..."
echo "Current connection limits:"
if [ -f /proc/sys/net/core/somaxconn ]; then
    echo "  somaxconn: $(cat /proc/sys/net/core/somaxconn)"
fi
if [ -f /proc/sys/net/ipv4/tcp_max_syn_backlog ]; then
    echo "  tcp_max_syn_backlog: $(cat /proc/sys/net/ipv4/tcp_max_syn_backlog)"
fi

echo ""
echo "=========================================="
echo "Recommendations"
echo "=========================================="
echo ""

ISSUES_FOUND=false

# Check for nginx without proper config
if command -v nginx &> /dev/null || docker ps | grep -q nginx; then
    if [ -f "docker-compose.yml" ] && ! grep -q "client_max_body_size" docker-compose.yml 2>/dev/null; then
        # Check actual nginx config files
        FOUND_NGINX_CONF=false
        for conf_file in "${NGINX_CONF_FILES[@]}"; do
            if [ -f "$conf_file" ] && grep -q "client_max_body_size" "$conf_file"; then
                FOUND_NGINX_CONF=true
                break
            fi
        done
        
        if [ "$FOUND_NGINX_CONF" = false ]; then
            echo -e "${RED}✗ Nginx detected but client_max_body_size not configured${NC}"
            echo "  Add to nginx config:"
            echo "    client_max_body_size 500M;"
            echo "    proxy_read_timeout 600s;"
            echo "    proxy_connect_timeout 600s;"
            echo "    proxy_send_timeout 600s;"
            ISSUES_FOUND=true
        fi
    fi
fi

# Check uvicorn timeout
if [ -f "docker-compose.yml" ]; then
    if ! grep "uvicorn" docker-compose.yml | grep -q "timeout-keep-alive"; then
        echo -e "${YELLOW}⚠ Uvicorn timeout-keep-alive not set${NC}"
        echo "  Add to uvicorn command: --timeout-keep-alive 600"
        ISSUES_FOUND=true
    fi
fi

if [ "$ISSUES_FOUND" = false ]; then
    echo -e "${GREEN}✓ No obvious proxy/timeout configuration issues${NC}"
fi

echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "If nginx is present and misconfigured:"
echo "1. Update nginx config with proper timeouts and body size limits"
echo "2. Reload nginx: ${CYAN}nginx -s reload${NC} or ${CYAN}docker compose restart nginx${NC}"
echo ""
echo "If using direct connection (no nginx):"
echo "1. Ensure uvicorn has --timeout-keep-alive 600"
echo "2. Check frontend axios timeout (should be 10+ minutes for large files)"
echo "3. Monitor backend logs during upload to see where it hangs"
echo ""
