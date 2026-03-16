#!/bin/bash
# QuantumCue - Local Development Management Script
# Manage local development services (start, stop, restart, status)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     OS_TYPE="linux";;
    Darwin*)    OS_TYPE="macos";;
    *)          OS_TYPE="unknown";;
esac

# Function to check if command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Detect Docker Compose command
DOCKER_COMPOSE_CMD=""
if check_command docker-compose; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo -e "${RED}Error: Docker Compose not found${NC}"
    exit 1
fi

# Function to show usage
show_usage() {
    cat << EOF
${BLUE}QuantumCue - Local Development Management${NC}

${CYAN}Usage:${NC}
  $0 [COMMAND] [OPTIONS]

${CYAN}Commands:${NC}
  status              Show status of all services
  stop                Stop all services
  start               Start all services
  restart [service]   Restart service(s) - options: frontend, backend, postgres, mongodb, redis, all
  rebuild [service]   Rebuild and restart service(s) - options: frontend, backend, all
  logs [service]      View logs - options: frontend, backend, postgres, mongodb, redis, all
  health              Check health of services
  migrate             Run database migrations (Alembic upgrade head)
  shell [service]     Open shell in service - options: frontend, backend, postgres, mongodb, redis

${CYAN}Service Names:${NC}
  frontend            Frontend React application
  backend             Backend FastAPI application
  postgres            PostgreSQL database
  mongodb             MongoDB database (audit logs)
  redis               Redis cache
  all                 All services

${CYAN}Examples:${NC}
  $0 status                    # Check status of all services
  $0 restart backend           # Restart backend service
  $0 restart frontend          # Restart frontend service
  $0 restart all               # Restart all services
  $0 rebuild backend           # Rebuild backend (after dependency changes)
  $0 rebuild all               # Rebuild all services
  $0 stop                      # Stop all services
  $0 start                     # Start all services
  $0 logs backend              # View backend logs
  $0 health                    # Check service health
  $0 migrate                   # Run database migrations

${CYAN}Development Notes:${NC}
  - Backend uses hot reload (--reload flag) - code changes are picked up automatically
  - Frontend uses Vite dev server - code changes are picked up automatically
  - Restart services if hot reload isn't working or after dependency changes
  - Use 'rebuild backend' after adding new Python packages (updates pyproject.toml)
  - Use 'rebuild frontend' after adding new npm packages (updates package.json)
  - Rebuild ensures new environment variables from .env are loaded

EOF
}

# Function to check if Docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        echo -e "${RED}Error: Docker daemon is not running${NC}"
        echo -e "${YELLOW}Please start Docker Desktop or the Docker daemon and try again.${NC}"
        exit 1
    fi
}

# Function to show service status
show_status() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Service Status${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # Show Docker Compose status
    echo -e "${YELLOW}Docker Compose Services:${NC}"
    $DOCKER_COMPOSE_CMD ps
    echo ""
    
    # Check individual containers
    echo -e "${YELLOW}Container Details:${NC}"
    CONTAINERS=("quantumcue-postgres" "quantumcue-mongodb" "quantumcue-redis" "quantumcue-backend" "quantumcue-frontend")
    
    for container in "${CONTAINERS[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "unknown")
            HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-healthcheck")
            
            if [ "$STATUS" = "running" ]; then
                echo -e "${GREEN}✓${NC} ${container}: ${STATUS}"
                if [ "$HEALTH" != "no-healthcheck" ]; then
                    if [ "$HEALTH" = "healthy" ]; then
                        echo -e "    Health: ${GREEN}${HEALTH}${NC}"
                    else
                        echo -e "    Health: ${YELLOW}${HEALTH}${NC}"
                    fi
                fi
            else
                echo -e "${RED}✗${NC} ${container}: ${STATUS}"
            fi
        else
            echo -e "${RED}✗${NC} ${container}: not running"
        fi
    done
    
    echo ""
    
    # Check ports
    echo -e "${YELLOW}Port Status:${NC}"
    PORTS=(3000 5432 27017 6379 8000)
    PORT_NAMES=("Frontend" "PostgreSQL" "MongoDB" "Redis" "Backend API")
    
    for i in "${!PORTS[@]}"; do
        port=${PORTS[$i]}
        name=${PORT_NAMES[$i]}
        
        if check_command lsof; then
            if lsof -i :$port &> /dev/null 2>&1; then
                PROCESS=$(lsof -i :$port 2>/dev/null | tail -n +2 | awk '{print $1}' | head -1)
                echo -e "${GREEN}✓${NC} Port $port ($name): in use by $PROCESS"
            else
                echo -e "${YELLOW}⚠${NC} Port $port ($name): not in use"
            fi
        else
            echo -e "${YELLOW}⚠${NC} Port $port ($name): unable to check (lsof not available)"
        fi
    done
    
    echo ""
    
    # Check service endpoints
    echo -e "${YELLOW}Service Endpoints:${NC}"
    if curl -fsS http://localhost:8000/health &> /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend API: http://localhost:8000 (responding)"
        echo -e "    API Docs: http://localhost:8000/docs"
    else
        echo -e "${RED}✗${NC} Backend API: http://localhost:8000 (not responding)"
    fi
    
    if curl -fsS http://localhost:3000 &> /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Frontend: http://localhost:3000 (responding)"
    else
        echo -e "${RED}✗${NC} Frontend: http://localhost:3000 (not responding)"
    fi
    
    echo ""
    
    # Show demo credentials
    echo -e "${YELLOW}Demo Login Credentials:${NC}"
    echo -e "  ${CYAN}Admin Account:${NC}"
    echo -e "    Email:    ${GREEN}admin@acme.com${NC}"
    echo -e "    Password: ${GREEN}demo123!${NC}"
    echo ""
    echo -e "  ${CYAN}User Account:${NC}"
    echo -e "    Email:    ${GREEN}user@acme.com${NC}"
    echo -e "    Password: ${GREEN}demo123!${NC}"
    echo ""
    echo -e "${YELLOW}Note:${NC} These credentials are available after running 'make seed'"
    echo ""
}

# Function to stop all services
stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE_CMD down
    echo -e "${GREEN}✓ All services stopped${NC}"
}

# Function to start all services
start_services() {
    echo -e "${YELLOW}Starting all services...${NC}"
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE_CMD up -d
    echo -e "${GREEN}✓ All services started${NC}"
    echo ""
    echo -e "${BLUE}Access points:${NC}"
    echo "  Frontend:    http://localhost:3000"
    echo "  Backend API: http://localhost:8000"
    echo "  API Docs:    http://localhost:8000/docs"
}

# Function to restart a service
restart_service() {
    local service=$1
    
    if [ -z "$service" ]; then
        echo -e "${RED}Error: Service name required${NC}"
        echo "Usage: $0 restart [frontend|backend|postgres|all]"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    case "$service" in
        frontend)
            echo -e "${YELLOW}Restarting frontend service (reloading environment variables)...${NC}"
            $DOCKER_COMPOSE_CMD up -d --force-recreate frontend
            echo -e "${GREEN}✓ Frontend restarted${NC}"
            echo -e "${CYAN}Note: Frontend uses Vite hot reload. Environment variables reloaded.${NC}"
            ;;
        backend)
            echo -e "${YELLOW}Restarting backend service (reloading environment variables)...${NC}"
            $DOCKER_COMPOSE_CMD up -d --force-recreate backend
            echo -e "${GREEN}✓ Backend restarted${NC}"
            echo -e "${CYAN}Note: Backend uses hot reload (--reload). Environment variables reloaded.${NC}"
            echo -e "${CYAN}New .env values (like GROQ_MODEL) are now active.${NC}"
            ;;
        postgres)
            echo -e "${YELLOW}Restarting PostgreSQL service...${NC}"
            echo -e "${YELLOW}Warning: Restarting PostgreSQL may interrupt database connections${NC}"
            $DOCKER_COMPOSE_CMD restart postgres
            echo -e "${GREEN}✓ PostgreSQL restarted${NC}"
            ;;
        mongodb)
            echo -e "${YELLOW}Restarting MongoDB service...${NC}"
            echo -e "${YELLOW}Warning: Restarting MongoDB may interrupt audit log operations${NC}"
            $DOCKER_COMPOSE_CMD restart mongodb
            echo -e "${GREEN}✓ MongoDB restarted${NC}"
            ;;
        redis)
            echo -e "${YELLOW}Restarting Redis service...${NC}"
            echo -e "${YELLOW}Warning: Restarting Redis will clear cache${NC}"
            $DOCKER_COMPOSE_CMD restart redis
            echo -e "${GREEN}✓ Redis restarted${NC}"
            ;;
        all)
            echo -e "${YELLOW}Restarting all services (reloading environment variables for frontend/backend)...${NC}"
            # Force recreate frontend and backend to reload env vars
            $DOCKER_COMPOSE_CMD up -d --force-recreate frontend backend
            # Regular restart for database services (they don't use .env files)
            $DOCKER_COMPOSE_CMD restart postgres mongodb redis
            echo -e "${GREEN}✓ All services restarted${NC}"
            echo -e "${CYAN}Note: Frontend and backend environment variables reloaded.${NC}"
            ;;
        *)
            echo -e "${RED}Error: Unknown service '$service'${NC}"
            echo "Valid services: frontend, backend, postgres, mongodb, redis, all"
            exit 1
            ;;
    esac
}

# Function to show logs
show_logs() {
    local service=$1
    
    cd "$PROJECT_ROOT"
    
    if [ -z "$service" ] || [ "$service" = "all" ]; then
        echo -e "${YELLOW}Showing logs for all services (Ctrl+C to exit)...${NC}"
        $DOCKER_COMPOSE_CMD logs -f
    else
        case "$service" in
            frontend|backend|postgres|mongodb|redis)
                echo -e "${YELLOW}Showing logs for $service (Ctrl+C to exit)...${NC}"
                $DOCKER_COMPOSE_CMD logs -f "$service"
                ;;
            *)
                echo -e "${RED}Error: Unknown service '$service'${NC}"
                echo "Valid services: frontend, backend, postgres, mongodb, redis, all"
                exit 1
                ;;
        esac
    fi
}

# Function to check health
check_health() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Service Health Check${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # Check PostgreSQL
    echo -n "PostgreSQL: "
    if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U quantumcue &> /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${RED}✗ Not responding${NC}"
    fi
    
    # Check MongoDB
    echo -n "MongoDB: "
    if $DOCKER_COMPOSE_CMD exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${RED}✗ Not responding${NC}"
    fi
    
    # Check Redis
    echo -n "Redis: "
    if $DOCKER_COMPOSE_CMD exec -T redis redis-cli ping &> /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${RED}✗ Not responding${NC}"
    fi
    
    # Check Backend
    echo -n "Backend API: "
    if curl -fsS http://localhost:8000/health &> /dev/null 2>&1; then
        RESPONSE=$(curl -s http://localhost:8000/health)
        echo -e "${GREEN}✓ Healthy${NC}"
        if command -v python3 &> /dev/null; then
            echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -10 || echo "  Response: $RESPONSE"
        fi
    else
        echo -e "${RED}✗ Not responding${NC}"
    fi
    
    # Check Frontend
    echo -n "Frontend: "
    if curl -fsS http://localhost:3000 &> /dev/null 2>&1; then
        echo -e "${GREEN}✓ Responding${NC}"
    else
        echo -e "${RED}✗ Not responding${NC}"
    fi
    
    echo ""
}

# Function to validate environment variables
validate_env() {
    local env_file=$1
    local required_vars=("SECRET_KEY" "GROQ_API_KEY")
    local missing_vars=()
    local warnings=()
    
    if [ ! -f "$env_file" ]; then
        echo -e "${YELLOW}Warning: $env_file not found${NC}"
        echo -e "${CYAN}Creating from .env.example if it exists...${NC}"
        if [ -f "${env_file}.example" ]; then
            cp "${env_file}.example" "$env_file"
            echo -e "${YELLOW}Please update $env_file with your actual values${NC}"
            return 1
        else
            echo -e "${RED}Error: $env_file.example not found${NC}"
            return 1
        fi
    fi
    
    # Check each required variable by grepping the file
    for var in "${required_vars[@]}"; do
        # Check if variable exists and is not a placeholder
        if ! grep -q "^${var}=" "$env_file" 2>/dev/null; then
            missing_vars+=("$var")
        else
            # Check if it's a placeholder value
            value=$(grep "^${var}=" "$env_file" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            if [[ "$value" == *"your"* ]] || [[ "$value" == *"gsk_your"* ]] || [[ "$value" == *"sk-ant-your"* ]] || [ -z "$value" ]; then
                warnings+=("$var")
            fi
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo -e "${RED}Error: Missing required environment variables in $env_file:${NC}"
        for var in "${missing_vars[@]}"; do
            echo -e "  ${RED}- $var${NC}"
        done
        echo -e "${CYAN}Please add these variables to $env_file${NC}"
        return 1
    fi
    
    if [ ${#warnings[@]} -gt 0 ]; then
        echo -e "${YELLOW}Warning: Some environment variables appear to be placeholders in $env_file:${NC}"
        for var in "${warnings[@]}"; do
            echo -e "  ${YELLOW}- $var${NC}"
        done
        echo -e "${CYAN}Please update $env_file with your actual values${NC}"
        echo -e "${CYAN}Continuing with rebuild anyway...${NC}"
        echo ""
    fi
    
    return 0
}

# Function to rebuild a service
rebuild_service() {
    local service=$1
    
    if [ -z "$service" ]; then
        echo -e "${RED}Error: Service name required${NC}"
        echo "Usage: $0 rebuild [frontend|backend|all]"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    case "$service" in
        frontend)
            echo -e "${YELLOW}Rebuilding frontend service...${NC}"
            
            # Validate frontend .env if it exists
            if [ -f "./frontend/.env" ] || [ -f "./frontend/.env.example" ]; then
                validate_env "./frontend/.env" || true
            fi
            
            echo -e "${CYAN}Stopping frontend...${NC}"
            $DOCKER_COMPOSE_CMD stop frontend
            
            echo -e "${CYAN}Rebuilding frontend image...${NC}"
            $DOCKER_COMPOSE_CMD build --no-cache frontend
            
            echo -e "${CYAN}Starting frontend...${NC}"
            $DOCKER_COMPOSE_CMD up -d frontend
            
            echo -e "${GREEN}✓ Frontend rebuilt and restarted${NC}"
            echo -e "${CYAN}Note: Frontend will pick up new environment variables from .env${NC}"
            ;;
        backend)
            echo -e "${YELLOW}Rebuilding backend service...${NC}"
            
            # Validate backend .env (warns but doesn't fail if placeholders found)
            if ! validate_env "./backend/.env"; then
                echo -e "${YELLOW}Continuing with rebuild, but please update .env file with actual values${NC}"
                echo ""
            fi
            
            echo -e "${CYAN}Stopping backend...${NC}"
            $DOCKER_COMPOSE_CMD stop backend
            
            echo -e "${CYAN}Rebuilding backend image (this may take a few minutes)...${NC}"
            echo -e "${CYAN}This will install new dependencies from pyproject.toml${NC}"
            $DOCKER_COMPOSE_CMD build --no-cache backend
            
            echo -e "${CYAN}Starting backend...${NC}"
            $DOCKER_COMPOSE_CMD up -d backend
            
            echo -e "${GREEN}✓ Backend rebuilt and restarted${NC}"
            echo ""
            echo -e "${CYAN}Verification:${NC}"
            echo -e "${CYAN}  - New Python dependencies from pyproject.toml are installed${NC}"
            echo -e "${CYAN}  - Environment variables from backend/.env are loaded${NC}"
            echo ""
            echo -e "${YELLOW}To verify environment variables are loaded, run:${NC}"
            echo -e "  ${CYAN}$DOCKER_COMPOSE_CMD exec backend env | grep -E '(GROQ|ANTHROPIC|GEMINI)'${NC}"
            ;;
        all)
            echo -e "${YELLOW}Rebuilding all services...${NC}"
            
            # Validate backend .env (warns but doesn't fail)
            if ! validate_env "./backend/.env"; then
                echo -e "${YELLOW}Continuing with rebuild, but please update backend/.env with actual values${NC}"
                echo ""
            fi
            
            # Validate frontend .env if it exists
            if [ -f "./frontend/.env" ] || [ -f "./frontend/.env.example" ]; then
                validate_env "./frontend/.env" || true
            fi
            
            echo -e "${CYAN}Stopping all services...${NC}"
            $DOCKER_COMPOSE_CMD stop
            
            echo -e "${CYAN}Rebuilding all images (this may take several minutes)...${NC}"
            echo -e "${CYAN}This will install new dependencies from pyproject.toml and package.json${NC}"
            $DOCKER_COMPOSE_CMD build --no-cache
            
            echo -e "${CYAN}Starting all services...${NC}"
            $DOCKER_COMPOSE_CMD up -d
            
            echo -e "${GREEN}✓ All services rebuilt and restarted${NC}"
            echo -e "${CYAN}Note: Services will pick up new environment variables from .env files${NC}"
            echo -e "${CYAN}Backend loads from backend/.env (includes GROQ_API_KEY, etc.)${NC}"
            echo -e "${CYAN}Frontend loads from frontend/.env${NC}"
            ;;
        *)
            echo -e "${RED}Error: Unknown service '$service'${NC}"
            echo "Valid services: frontend, backend, all"
            exit 1
            ;;
    esac
}

# Function to run migrations
run_migrations() {
    echo -e "${YELLOW}Running database migrations...${NC}"
    cd "$PROJECT_ROOT"
    
    # Check if backend container is running
    if ! docker ps --format "{{.Names}}" | grep -q "^quantumcue-backend$"; then
        echo -e "${RED}Error: Backend container is not running${NC}"
        echo -e "${YELLOW}Please start the services first with: $0 start${NC}"
        exit 1
    fi
    
    # Check if PostgreSQL is accessible from backend
    echo -e "${CYAN}Checking database connection...${NC}"
    if ! $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U quantumcue &> /dev/null 2>&1; then
        echo -e "${YELLOW}Warning: PostgreSQL may not be ready. Waiting 5 seconds...${NC}"
        sleep 5
    fi
    
    echo -e "${CYAN}Running: alembic upgrade head${NC}"
    echo ""
    
    # Run migrations (use -T for non-interactive mode)
    if $DOCKER_COMPOSE_CMD exec -T backend alembic upgrade head; then
        echo ""
        echo -e "${GREEN}✓ Migrations completed successfully${NC}"
    else
        echo ""
        echo -e "${RED}✗ Migration failed${NC}"
        echo -e "${YELLOW}Check the output above for error details${NC}"
        exit 1
    fi
}

# Function to open shell
open_shell() {
    local service=$1
    
    if [ -z "$service" ]; then
        echo -e "${RED}Error: Service name required${NC}"
        echo "Usage: $0 shell [frontend|backend|postgres]"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    case "$service" in
        frontend)
            echo -e "${YELLOW}Opening shell in frontend container...${NC}"
            $DOCKER_COMPOSE_CMD exec frontend /bin/sh
            ;;
        backend)
            echo -e "${YELLOW}Opening shell in backend container...${NC}"
            $DOCKER_COMPOSE_CMD exec backend /bin/bash
            ;;
        postgres)
            echo -e "${YELLOW}Opening PostgreSQL shell...${NC}"
            $DOCKER_COMPOSE_CMD exec postgres psql -U quantumcue -d quantumcue
            ;;
        mongodb)
            echo -e "${YELLOW}Opening MongoDB shell...${NC}"
            $DOCKER_COMPOSE_CMD exec mongodb mongosh -u quantumcue -p quantumcue_dev --authenticationDatabase admin quantumcue_audit
            ;;
        redis)
            echo -e "${YELLOW}Opening Redis CLI...${NC}"
            $DOCKER_COMPOSE_CMD exec redis redis-cli
            ;;
        *)
            echo -e "${RED}Error: Unknown service '$service'${NC}"
            echo "Valid services: frontend, backend, postgres, mongodb, redis"
            exit 1
            ;;
    esac
}

# Main script logic
check_docker

if [ $# -eq 0 ]; then
    show_usage
    exit 0
fi

COMMAND=$1
shift

case "$COMMAND" in
    status)
        show_status
        ;;
    stop)
        stop_services
        ;;
    start)
        start_services
        ;;
    restart)
        restart_service "${1:-}"
        ;;
    rebuild)
        rebuild_service "${1:-}"
        ;;
    logs)
        show_logs "${1:-all}"
        ;;
    health)
        check_health
        ;;
    migrate)
        run_migrations
        ;;
    shell)
        open_shell "${1:-}"
        ;;
    -h|--help|help)
        show_usage
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$COMMAND'${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac

