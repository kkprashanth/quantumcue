#!/bin/bash
# QuantumCue - Restart and Verify Services Script
# Restarts all services and verifies they are running properly

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
echo "QuantumCue - Restart and Verify Services"
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

# Check if Docker Compose is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found. Please install Docker first.${NC}"
    exit 1
fi

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Warning: backend/.env file not found${NC}"
    echo -e "${YELLOW}Some services may not start correctly without environment variables${NC}"
    echo ""
fi

# Load environment variables from backend/.env if it exists
if [ -f "backend/.env" ]; then
    echo -e "${BLUE}[1/6] Loading environment variables...${NC}"
    set -a
    source backend/.env 2>/dev/null || true
    set +a
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
    echo ""
else
    echo -e "${YELLOW}[1/6] Skipping environment variable loading (backend/.env not found)${NC}"
    echo ""
fi

# Stop all services
echo -e "${BLUE}[2/6] Stopping all services...${NC}"
echo -e "${CYAN}  Note: This will NOT delete uploads or data (using 'down' without '-v' flag)${NC}"
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || {
    echo -e "${YELLOW}⚠ Some services may not have been running${NC}"
}
echo -e "${GREEN}✓ Services stopped${NC}"
echo ""

# Wait a moment for cleanup
sleep 2

# Start database services first
echo -e "${BLUE}[3/6] Starting database services (PostgreSQL, MongoDB, Redis)...${NC}"
if [ -f "backend/.env" ]; then
    set -a
    source backend/.env 2>/dev/null || true
    set +a
fi

docker compose up -d postgres mongodb redis 2>/dev/null || docker-compose up -d postgres mongodb redis 2>/dev/null || {
    echo -e "${RED}✗ Failed to start database services${NC}"
    exit 1
}
echo -e "${GREEN}✓ Database services started${NC}"
echo ""

# Wait for databases to be ready
echo -e "${BLUE}[4/6] Waiting for databases to be ready...${NC}"
echo -e "${CYAN}  This may take up to 30 seconds...${NC}"

# Wait for PostgreSQL
POSTGRES_READY=false
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U ${POSTGRES_USER:-quantumcue} &> /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ PostgreSQL is ready${NC}"
        POSTGRES_READY=true
        break
    fi
    echo -n "."
    sleep 1
done
if [ "$POSTGRES_READY" = false ]; then
    echo -e "${RED}  ✗ PostgreSQL did not become ready${NC}"
fi

# Wait for MongoDB
MONGODB_READY=false
for i in {1..30}; do
    if docker compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ MongoDB is ready${NC}"
        MONGODB_READY=true
        break
    fi
    echo -n "."
    sleep 1
done
if [ "$MONGODB_READY" = false ]; then
    echo -e "${YELLOW}  ⚠ MongoDB did not become ready (non-critical)${NC}"
fi

# Wait for Redis (CRITICAL - user specifically mentioned this)
REDIS_READY=false
for i in {1..30}; do
    if docker compose exec -T redis redis-cli ping &> /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Redis is ready${NC}"
        REDIS_READY=true
        break
    fi
    echo -n "."
    sleep 1
done
if [ "$REDIS_READY" = false ]; then
    echo -e "${RED}  ✗ Redis did not become ready - this is critical!${NC}"
    echo -e "${YELLOW}  Checking Redis logs...${NC}"
    docker compose logs redis --tail=20 2>/dev/null || echo "Could not get Redis logs"
    echo ""
    echo -e "${YELLOW}  Attempting to restart Redis...${NC}"
    docker compose restart redis 2>/dev/null || docker-compose restart redis 2>/dev/null
    sleep 5
    if docker compose exec -T redis redis-cli ping &> /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Redis is now ready after restart${NC}"
        REDIS_READY=true
    else
        echo -e "${RED}  ✗ Redis still not ready after restart${NC}"
    fi
fi
echo ""

# Start application services
echo -e "${BLUE}[5/6] Starting application services (backend, frontend)...${NC}"
if [ -f "backend/.env" ]; then
    set -a
    source backend/.env 2>/dev/null || true
    set +a
fi

docker compose up -d backend frontend 2>/dev/null || docker-compose up -d backend frontend 2>/dev/null || {
    echo -e "${RED}✗ Failed to start application services${NC}"
    exit 1
}
echo -e "${GREEN}✓ Application services started${NC}"
echo ""

# Wait for backend to be ready
echo -e "${BLUE}[6/6] Waiting for backend API to be ready...${NC}"
BACKEND_READY=false
for i in {1..60}; do
    if curl -s --max-time 2 http://localhost:8000/health &> /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Backend API is responding${NC}"
        BACKEND_READY=true
        break
    fi
    echo -n "."
    sleep 1
done
if [ "$BACKEND_READY" = false ]; then
    echo -e "${RED}  ✗ Backend API did not become ready${NC}"
    echo -e "${YELLOW}  Checking backend logs...${NC}"
    docker compose logs backend --tail=30 2>/dev/null || echo "Could not get backend logs"
fi
echo ""

# Verification summary
echo "=========================================="
echo "Service Status Verification"
echo "=========================================="
echo ""

# Check all services
echo -e "${CYAN}Docker Compose Status:${NC}"
docker compose ps 2>/dev/null || docker-compose ps 2>/dev/null || echo "Could not get status"
echo ""

# Verify each service
ALL_SERVICES_OK=true

echo -e "${CYAN}Service Health Checks:${NC}"

# PostgreSQL
if docker compose exec -T postgres pg_isready -U ${POSTGRES_USER:-quantumcue} &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL: Healthy${NC}"
else
    echo -e "${RED}✗ PostgreSQL: Not responding${NC}"
    ALL_SERVICES_OK=false
fi

# MongoDB
if docker compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB: Healthy${NC}"
else
    echo -e "${YELLOW}⚠ MongoDB: Not responding (non-critical)${NC}"
fi

# Redis (CRITICAL)
if docker compose exec -T redis redis-cli ping &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis: Healthy${NC}"
else
    echo -e "${RED}✗ Redis: Not responding - CRITICAL!${NC}"
    ALL_SERVICES_OK=false
    echo -e "${YELLOW}  Redis logs:${NC}"
    docker compose logs redis --tail=10 2>/dev/null || echo "Could not get Redis logs"
fi

# Backend API
if curl -s --max-time 2 http://localhost:8000/health &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API: Responding${NC}"
    # Get response
    HEALTH_RESPONSE=$(curl -s --max-time 2 http://localhost:8000/health 2>/dev/null || echo "")
    if [ ! -z "$HEALTH_RESPONSE" ]; then
        echo -e "${CYAN}  Response: ${HEALTH_RESPONSE}${NC}"
    fi
else
    echo -e "${RED}✗ Backend API: Not responding${NC}"
    ALL_SERVICES_OK=false
    echo -e "${YELLOW}  Backend logs:${NC}"
    docker compose logs backend --tail=10 2>/dev/null || echo "Could not get backend logs"
fi

# Frontend
if curl -s --max-time 2 http://localhost:3000 &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend: Responding${NC}"
else
    echo -e "${YELLOW}⚠ Frontend: Not responding (may still be starting)${NC}"
fi

echo ""

# Final summary
if [ "$ALL_SERVICES_OK" = true ] && [ "$REDIS_READY" = true ]; then
    echo -e "${GREEN}=========================================="
    echo "✓ All critical services are running!"
    echo "==========================================${NC}"
    echo ""
    echo "Service URLs:"
    echo "  Frontend:    http://localhost:3000"
    echo "  Backend API: http://localhost:8000"
    echo "  API Docs:    http://localhost:8000/docs"
    echo ""
    echo "To view logs:"
    echo "  docker compose logs -f"
    echo ""
    echo "To check status:"
    echo "  docker compose ps"
    echo ""
else
    echo -e "${YELLOW}=========================================="
    echo "⚠ Some services may not be fully ready"
    echo "==========================================${NC}"
    echo ""
    if [ "$REDIS_READY" = false ]; then
        echo -e "${RED}CRITICAL: Redis is not running!${NC}"
        echo "  This will cause issues with caching and some features."
        echo "  Check Redis logs: docker compose logs redis"
        echo "  Try restarting Redis: docker compose restart redis"
        echo ""
    fi
    if [ "$BACKEND_READY" = false ]; then
        echo -e "${RED}CRITICAL: Backend API is not responding!${NC}"
        echo "  Check backend logs: docker compose logs backend"
        echo "  Try restarting backend: docker compose restart backend"
        echo ""
    fi
    echo "Check service status:"
    echo "  docker compose ps"
    echo ""
    echo "View logs:"
    echo "  docker compose logs -f"
    echo ""
fi
