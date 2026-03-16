#!/bin/bash
# QuantumCue - Development Setup Script
# Initial setup for new developers

# Don't exit on error immediately - we want to handle some errors gracefully
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

# Default flags - by default, run migrations and seed for first-time setup
RUN_MIGRATE=true
RUN_SEED=true
SKIP_BUILD=false
SKIP_START=false

# Function to show usage
show_usage() {
    cat << EOF
${BLUE}QuantumCue - Development Setup Script${NC}

${CYAN}Usage:${NC}
  $0 [OPTIONS]

${CYAN}Options:${NC}
  --migrate          Run database migrations after setup (default: enabled)
  --seed             Seed database with demo data after setup (default: enabled)
  --all              Run migrations and seed data (default behavior)
  --no-migrate       Skip database migrations
  --no-seed          Skip seeding database
  --skip-build       Skip building Docker images (use existing images)
  --skip-start       Skip starting services (only setup files and build)
  -h, --help         Show this help message

${CYAN}Examples:${NC}
  $0                    # Full setup: build, start, migrate, and seed (recommended for first-time)
  $0 --no-seed          # Setup without seeding (skip demo data)
  $0 --no-migrate       # Setup without migrations (if already migrated)
  $0 --skip-build       # Skip image building (faster if images exist)
  $0 --all              # Explicitly run migrations and seed (same as default)

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --migrate)
            RUN_MIGRATE=true
            shift
            ;;
        --seed)
            RUN_SEED=true
            shift
            ;;
        --all)
            RUN_MIGRATE=true
            RUN_SEED=true
            shift
            ;;
        --no-migrate)
            RUN_MIGRATE=false
            shift
            ;;
        --no-seed)
            RUN_SEED=false
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-start)
            SKIP_START=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo ""
            show_usage
            exit 1
            ;;
    esac
done

# Function to check if command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to print error with installation instructions
print_install_instructions() {
    local tool=$1
    local instructions=$2
    echo -e "${RED}✗ $tool is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Installation instructions:${NC}"
    echo "$instructions"
    echo ""
}

# Function to run database migrations
run_migrations() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Running Database Migrations${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # Wait for PostgreSQL to be ready
    echo -n "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U quantumcue &> /dev/null 2>&1; then
            echo -e " ${GREEN}Ready!${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    echo -e "${YELLOW}Running migrations...${NC}"
    # Ensure PYTHONPATH is set and run from /app directory
    if $DOCKER_COMPOSE_CMD exec -T -e PYTHONPATH=/app backend sh -c "cd /app && alembic upgrade head"; then
        echo -e "${GREEN}✓ Migrations completed successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Migration failed${NC}"
        echo -e "${YELLOW}Check logs with: make logs-backend${NC}"
        return 1
    fi
}

# Function to seed database
seed_database() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Seeding Database${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${CYAN}This will seed:${NC}"
    echo "  • Quantum computing providers (QCI, D-Wave, IonQ, IBM Quantum, Rigetti)"
    echo "  • Demo account and users (admin@acme.com, user@acme.com)"
    echo "  • Demo jobs with realistic data (15 jobs with various statuses)"
    echo ""
    
    # Wait for PostgreSQL to be ready
    echo -n "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U quantumcue &> /dev/null 2>&1; then
            echo -e " ${GREEN}Ready!${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    # Wait for backend to be ready (needed for seed script)
    echo -n "Waiting for Backend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health &> /dev/null 2>&1; then
            echo -e " ${GREEN}Ready!${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    echo -e "${YELLOW}Seeding database with demo data...${NC}"
    if $DOCKER_COMPOSE_CMD exec -T backend python scripts/seed_demo.py; then
        echo -e "${GREEN}✓ Database seeded successfully${NC}"
        echo ""
        echo -e "${CYAN}Demo credentials:${NC}"
        echo "  Admin: admin@acme.com / demo123!"
        echo "  User:  user@acme.com / demo123!"
        return 0
    else
        echo -e "${RED}✗ Seeding failed${NC}"
        echo -e "${YELLOW}Check logs with: make logs-backend${NC}"
        return 1
    fi
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  QuantumCue - Development Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check dependencies
echo -e "${YELLOW}Checking system dependencies...${NC}"
MISSING_DEPS=()

# Check Git
if ! check_command git; then
    MISSING_DEPS+=("git")
    print_install_instructions "Git" \
        "  macOS: Install Xcode Command Line Tools: xcode-select --install\n  Linux: sudo apt-get install git (Debian/Ubuntu) or sudo yum install git (RHEL/CentOS)\n  Windows: https://git-scm.com/download/win"
else
    echo -e "${GREEN}✓ Git is installed${NC}"
fi

# Check Docker
if ! check_command docker; then
    MISSING_DEPS+=("docker")
    print_install_instructions "Docker" \
        "  macOS: https://docs.docker.com/desktop/install/mac-install/\n  Linux: https://docs.docker.com/engine/install/\n  Windows: https://docs.docker.com/desktop/install/windows-install/"
else
    echo -e "${GREEN}✓ Docker is installed${NC}"
    # Check Docker version (minimum 20.10)
    DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
    if [ "$(printf '%s\n' "20.10" "$DOCKER_VERSION" | sort -V | head -n1)" != "20.10" ]; then
        echo -e "${YELLOW}⚠ Docker version $DOCKER_VERSION detected. Recommended: 20.10 or higher${NC}"
    fi
fi

# Check Docker Compose (v1 or v2)
DOCKER_COMPOSE_CMD=""
if check_command docker-compose; then
    DOCKER_COMPOSE_CMD="docker-compose"
    echo -e "${GREEN}✓ Docker Compose (v1) is installed${NC}"
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
    echo -e "${GREEN}✓ Docker Compose (v2) is installed${NC}"
else
    MISSING_DEPS+=("docker-compose")
    print_install_instructions "Docker Compose" \
        "  Docker Compose v2 is included with Docker Desktop.\n  For standalone: https://docs.docker.com/compose/install/\n  Note: Docker Compose v2 uses 'docker compose' (space, not hyphen)"
fi

# Check if Docker is running
if check_command docker; then
    if ! docker info &> /dev/null; then
        echo -e "${RED}✗ Docker daemon is not running${NC}"
        echo -e "${YELLOW}Please start Docker Desktop or the Docker daemon and try again.${NC}"
        if [ "$OS_TYPE" == "macos" ]; then
            echo "  macOS: Open Docker Desktop application"
        elif [ "$OS_TYPE" == "linux" ]; then
            echo "  Linux: sudo systemctl start docker"
        fi
        exit 1
    else
        echo -e "${GREEN}✓ Docker daemon is running${NC}"
    fi
fi

# Check curl (needed for health checks)
if ! check_command curl; then
    MISSING_DEPS+=("curl")
    print_install_instructions "curl" \
        "  macOS: Usually pre-installed. If missing: brew install curl\n  Linux: sudo apt-get install curl (Debian/Ubuntu) or sudo yum install curl (RHEL/CentOS)\n  Windows: Included with Git for Windows or install from https://curl.se/windows/"
else
    echo -e "${GREEN}✓ curl is installed${NC}"
fi

# Check make (optional but recommended)
if ! check_command make; then
    echo -e "${YELLOW}⚠ make is not installed (optional but recommended)${NC}"
    if [ "$OS_TYPE" == "macos" ]; then
        echo "  Install: xcode-select --install"
    elif [ "$OS_TYPE" == "linux" ]; then
        echo "  Install: sudo apt-get install build-essential (Debian/Ubuntu) or sudo yum groupinstall 'Development Tools' (RHEL/CentOS)"
    fi
else
    echo -e "${GREEN}✓ make is installed${NC}"
fi

# Exit if critical dependencies are missing
if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  Missing Required Dependencies${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Please install the following dependencies and run this script again:${NC}"
    for dep in "${MISSING_DEPS[@]}"; do
        echo "  - $dep"
    done
    echo ""
    exit 1
fi

echo ""

# Check ports availability
echo -e "${YELLOW}Checking port availability...${NC}"
PORTS=(3000 5432 8000)
PORTS_IN_USE=()

# Function to check what process is using a port
get_port_process() {
    local port=$1
    local process_info=""
    
    if check_command lsof; then
        process_info=$(lsof -i :$port 2>/dev/null | tail -n +2 | head -1)
    elif check_command netstat; then
        if [ "$OS_TYPE" == "linux" ]; then
            process_info=$(netstat -tlnp 2>/dev/null | grep ":$port " | head -1)
        elif [ "$OS_TYPE" == "macos" ]; then
            process_info=$(netstat -an 2>/dev/null | grep "\.$port.*LISTEN" | head -1)
        fi
    elif check_command ss; then
        process_info=$(ss -ltnp 2>/dev/null | grep ":$port" | head -1)
    fi
    
    echo "$process_info"
}

# Check if lsof is available (better port checking)
if check_command lsof; then
    PORT_CHECK_CMD="lsof"
elif check_command netstat; then
    PORT_CHECK_CMD="netstat"
elif check_command ss; then
    PORT_CHECK_CMD="ss"
else
    PORT_CHECK_CMD="none"
    echo -e "${YELLOW}⚠ Port checking tools not available. Skipping port check.${NC}"
fi

if [ "$PORT_CHECK_CMD" != "none" ]; then
    for port in "${PORTS[@]}"; do
        PORT_IN_USE=false
        case "$PORT_CHECK_CMD" in
            lsof)
                if lsof -i :$port &> /dev/null 2>&1; then
                    PORT_IN_USE=true
                fi
                ;;
            netstat)
                if [ "$OS_TYPE" == "linux" ]; then
                    if netstat -an 2>/dev/null | grep -q ":$port.*LISTEN"; then
                        PORT_IN_USE=true
                    fi
                elif [ "$OS_TYPE" == "macos" ]; then
                    if netstat -an 2>/dev/null | grep -q "\.$port.*LISTEN"; then
                        PORT_IN_USE=true
                    fi
                fi
                ;;
            ss)
                if ss -lnt 2>/dev/null | grep -q ":$port"; then
                    PORT_IN_USE=true
                fi
                ;;
        esac
        
        if [ "$PORT_IN_USE" = true ]; then
            echo -e "${YELLOW}⚠ Port $port is in use${NC}"
            
            # Special message for PostgreSQL port
            if [ "$port" = "5432" ]; then
                echo -e "${CYAN}  Note: Port 5432 is typically used by PostgreSQL.${NC}"
                echo -e "${CYAN}  You may already have PostgreSQL running on your system.${NC}"
                echo -e "${CYAN}  The Docker Compose setup will use its own PostgreSQL container.${NC}"
                echo -e "${CYAN}  If you want to use your existing PostgreSQL, you'll need to:${NC}"
                echo -e "${CYAN}    1. Stop the existing PostgreSQL service${NC}"
                echo -e "${CYAN}    2. Or modify docker-compose.yml to use a different port${NC}"
            fi
            
            # Try to show what's using the port
            PROCESS_INFO=$(get_port_process $port)
            if [ -n "$PROCESS_INFO" ]; then
                echo -e "${YELLOW}  Process info: ${PROCESS_INFO:0:80}...${NC}"
            fi
            
            PORTS_IN_USE+=($port)
        else
            echo -e "${GREEN}✓ Port $port is available${NC}"
        fi
    done

    # Filter out any empty elements from array (safety check)
    #PORTS_IN_USE=($(printf '%s\n' "${PORTS_IN_USE[@]}" | grep -v '^$'))

    if [ "${#PORTS_IN_USE[@]}" -gt 0 ]; then
        # shellcheck disable=SC2207
        PORTS_IN_USE=($(printf '%s\n' "${PORTS_IN_USE[@]}" | grep -v '^$'))
    fi
    
    if [ ${#PORTS_IN_USE[@]} -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}========================================${NC}"
        echo -e "${YELLOW}  Port Conflict Warning${NC}"
        echo -e "${YELLOW}========================================${NC}"
        echo ""
        echo -e "${YELLOW}The following ports are already in use:${NC}"
        for port in "${PORTS_IN_USE[@]}"; do
            echo "  - Port $port"
        done
        echo ""
        echo -e "${YELLOW}You have the following options:${NC}"
        echo "  1. Stop the conflicting services manually"
        echo "  2. Modify docker-compose.yml to use different ports"
        echo "  3. Continue anyway (may cause conflicts)"
        echo ""
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Setup cancelled. Please resolve port conflicts and try again.${NC}"
            exit 1
        fi
        echo ""
    fi
fi

echo ""

# Create .env files if they don't exist
echo -e "${YELLOW}Setting up environment files...${NC}"

# Backend .env
BACKEND_ENV="$PROJECT_ROOT/backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
    if [ -f "$PROJECT_ROOT/backend/.env.example" ]; then
        cp "$PROJECT_ROOT/backend/.env.example" "$BACKEND_ENV"
        echo -e "${GREEN}✓ Created backend/.env from template${NC}"
    else
        # Create minimal .env file with required variables
        cat > "$BACKEND_ENV" << EOF
# QuantumCue Backend Configuration
# Generated by dev-setup.sh

# Application
APP_NAME=QuantumCue
APP_ENV=development
DEBUG=true
API_VERSION=v1

# Security - REQUIRED: Generate a secure random key
# You can generate one with: openssl rand -hex 32
SECRET_KEY=change-me-to-a-secure-random-key

# API
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000

# PostgreSQL (defaults for Docker Compose)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=quantumcue
POSTGRES_PASSWORD=quantumcue_dev
POSTGRES_DB=quantumcue

# LLM Configuration - REQUIRED: Add your Anthropic API key
ANTHROPIC_API_KEY=
LLM_MODEL=claude-sonnet-4-20250514
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2000

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# JWT Configuration
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7
EOF
        echo -e "${GREEN}✓ Created backend/.env with default values${NC}"
    fi
    echo -e "${YELLOW}  ⚠ IMPORTANT: Update the following in backend/.env:${NC}"
    echo -e "${CYAN}    1. SECRET_KEY - Generate with: openssl rand -hex 32${NC}"
    echo -e "${CYAN}    2. ANTHROPIC_API_KEY - Get from https://console.anthropic.com/${NC}"
else
    echo -e "${GREEN}✓ backend/.env already exists${NC}"
    # Check if required variables are set
    if grep -q "SECRET_KEY=change-me" "$BACKEND_ENV" || ! grep -q "^SECRET_KEY=" "$BACKEND_ENV"; then
        echo -e "${YELLOW}  ⚠ Warning: SECRET_KEY may not be set properly${NC}"
    fi
    if ! grep -q "^ANTHROPIC_API_KEY=.*[^[:space:]]" "$BACKEND_ENV" 2>/dev/null || grep -q "^ANTHROPIC_API_KEY=$" "$BACKEND_ENV"; then
        echo -e "${YELLOW}  ⚠ Warning: ANTHROPIC_API_KEY is not set${NC}"
    fi
fi

# Frontend .env
FRONTEND_ENV="$PROJECT_ROOT/frontend/.env"
if [ ! -f "$FRONTEND_ENV" ]; then
    if [ -f "$PROJECT_ROOT/frontend/.env.example" ]; then
        cp "$PROJECT_ROOT/frontend/.env.example" "$FRONTEND_ENV"
        echo -e "${GREEN}✓ Created frontend/.env from template${NC}"
    else
        # Create minimal .env file
        cat > "$FRONTEND_ENV" << EOF
# QuantumCue Frontend Configuration
# Generated by dev-setup.sh

VITE_API_BASE_URL=http://localhost:8000/api/v1
EOF
        echo -e "${GREEN}✓ Created frontend/.env with default values${NC}"
    fi
else
    echo -e "${GREEN}✓ frontend/.env already exists${NC}"
fi

echo ""

# Check for required files
echo -e "${YELLOW}Checking project files...${NC}"

# Check for package.json (frontend)
if [ ! -f "$PROJECT_ROOT/frontend/package.json" ]; then
    echo -e "${RED}✗ frontend/package.json not found${NC}"
    echo "  This file is required. Please ensure you're in the correct directory."
    exit 1
else
    echo -e "${GREEN}✓ frontend/package.json found${NC}"
fi

# Check for pyproject.toml (backend)
if [ ! -f "$PROJECT_ROOT/backend/pyproject.toml" ]; then
    echo -e "${RED}✗ backend/pyproject.toml not found${NC}"
    echo "  This file is required. Please ensure you're in the correct directory."
    exit 1
else
    echo -e "${GREEN}✓ backend/pyproject.toml found${NC}"
fi

# Check for docker-compose.yml
if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    echo -e "${RED}✗ docker-compose.yml not found${NC}"
    echo "  This file is required. Please ensure you're in the correct directory."
    exit 1
else
    echo -e "${GREEN}✓ docker-compose.yml found${NC}"
fi

echo ""

# Build Docker images (unless skipped)
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${YELLOW}Building Docker images...${NC}"
    echo "This may take several minutes on first run..."
    cd "$PROJECT_ROOT"

    if [ -n "$DOCKER_COMPOSE_CMD" ]; then
        $DOCKER_COMPOSE_CMD build
    else
        echo -e "${RED}Error: Docker Compose command not available${NC}"
        exit 1
    fi

    echo ""
else
    echo -e "${YELLOW}Skipping Docker image build (--skip-build)${NC}"
    echo ""
fi

# Start services (unless skipped)
if [ "$SKIP_START" = false ]; then
    echo -e "${YELLOW}Starting services...${NC}"
    $DOCKER_COMPOSE_CMD up -d

    # Wait for services to be healthy
    echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
    echo "This may take up to 60 seconds..."

    # Wait for PostgreSQL
    echo -n "Waiting for PostgreSQL..."
    POSTGRES_READY=false
    for i in {1..30}; do
        if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U quantumcue &> /dev/null 2>&1; then
            echo -e " ${GREEN}Ready!${NC}"
            POSTGRES_READY=true
            break
        fi
        echo -n "."
        sleep 2
    done

    if [ "$POSTGRES_READY" = false ]; then
        echo -e " ${RED}Timeout!${NC}"
        echo -e "${YELLOW}PostgreSQL may still be starting. Check logs with: make logs${NC}"
    fi

    # Wait for backend
    echo -n "Waiting for Backend..."
    BACKEND_READY=false
    for i in {1..30}; do
        if curl -s http://localhost:8000/health &> /dev/null 2>&1; then
            echo -e " ${GREEN}Ready!${NC}"
            BACKEND_READY=true
            break
        fi
        echo -n "."
        sleep 2
    done

    if [ "$BACKEND_READY" = false ]; then
        echo -e " ${RED}Timeout!${NC}"
        echo -e "${YELLOW}Backend may still be starting. Check logs with: make logs-backend${NC}"
        echo -e "${YELLOW}If backend fails to start, check that SECRET_KEY and ANTHROPIC_API_KEY are set in backend/.env${NC}"
    fi

    echo ""
else
    echo -e "${YELLOW}Skipping service startup (--skip-start)${NC}"
    echo ""
fi

# Run migrations if requested
if [ "$RUN_MIGRATE" = true ]; then
    if [ "$SKIP_START" = false ]; then
        run_migrations
        MIGRATION_STATUS=$?
    else
        echo -e "${YELLOW}Skipping migrations (services not started with --skip-start)${NC}"
        MIGRATION_STATUS=1
    fi
fi

# Seed database if requested
if [ "$RUN_SEED" = true ]; then
    if [ "$SKIP_START" = false ]; then
        # Only seed if migrations were successful or not run
        if [ "$RUN_MIGRATE" = false ] || [ "${MIGRATION_STATUS:-0}" -eq 0 ]; then
            seed_database
            SEED_STATUS=$?
        else
            echo -e "${YELLOW}Skipping seed (migrations failed)${NC}"
            SEED_STATUS=1
        fi
    else
        echo -e "${YELLOW}Skipping seed (services not started with --skip-start)${NC}"
        SEED_STATUS=1
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Final validation
echo -e "${YELLOW}Final checks...${NC}"
ISSUES=0

# Check if backend is actually responding
if curl -s http://localhost:8000/health &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is responding${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Check environment variables
if grep -q "SECRET_KEY=change-me" "$BACKEND_ENV" 2>/dev/null || ! grep -q "^SECRET_KEY=.*[^[:space:]]" "$BACKEND_ENV" 2>/dev/null; then
    echo -e "${YELLOW}⚠ SECRET_KEY needs to be set in backend/.env${NC}"
    ISSUES=$((ISSUES + 1))
fi

if ! grep -q "^ANTHROPIC_API_KEY=.*[^[:space:]]" "$BACKEND_ENV" 2>/dev/null || grep -q "^ANTHROPIC_API_KEY=$" "$BACKEND_ENV"; then
    echo -e "${YELLOW}⚠ ANTHROPIC_API_KEY needs to be set in backend/.env${NC}"
    ISSUES=$((ISSUES + 1))
fi

echo ""

if [ $ISSUES -gt 0 ]; then
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  Setup Complete with Warnings${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
fi

echo -e "${BLUE}Access points:${NC}"
echo "  Frontend:    http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  API Docs:    http://localhost:8000/docs"
echo ""

echo -e "${BLUE}Useful commands:${NC}"
if check_command make; then
    echo "  make dev       - Start development environment"
    echo "  make logs      - View all logs"
    echo "  make migrate   - Run database migrations"
    echo "  make seed      - Seed demo data"
    echo "  make test      - Run tests"
    echo "  make help      - Show all available commands"
else
    echo "  docker-compose up -d    - Start services"
    echo "  docker-compose logs -f - View logs"
    echo "  docker-compose exec backend alembic upgrade head - Run migrations"
    echo "  docker-compose exec backend python scripts/seed_demo.py - Seed data"
fi
echo ""

echo -e "${YELLOW}Next steps:${NC}"
if [ $ISSUES -gt 0 ]; then
    echo "  1. Fix the issues listed above"
fi

# Show next steps based on what was already done
NEXT_STEP=1
if [ "$RUN_MIGRATE" = false ] && [ "$RUN_SEED" = false ]; then
    echo "  $NEXT_STEP. Update backend/.env:"
    echo "     - Set SECRET_KEY (generate with: openssl rand -hex 32)"
    echo "     - Set ANTHROPIC_API_KEY (get from https://console.anthropic.com/)"
    NEXT_STEP=$((NEXT_STEP + 1))
    echo "  $NEXT_STEP. Run database migrations:"
    if check_command make; then
        echo "     make migrate"
    else
        echo "     docker-compose exec backend alembic upgrade head"
    fi
    NEXT_STEP=$((NEXT_STEP + 1))
    echo "  $NEXT_STEP. Seed demo data (providers, accounts, users, jobs):"
    if check_command make; then
        echo "     make seed"
    else
        echo "     docker-compose exec backend python scripts/seed_demo.py"
    fi
elif [ "$RUN_MIGRATE" = false ]; then
    echo "  $NEXT_STEP. Update backend/.env:"
    echo "     - Set SECRET_KEY (generate with: openssl rand -hex 32)"
    echo "     - Set ANTHROPIC_API_KEY (get from https://console.anthropic.com/)"
    NEXT_STEP=$((NEXT_STEP + 1))
    echo "  $NEXT_STEP. Run database migrations:"
    if check_command make; then
        echo "     make migrate"
    else
        echo "     docker-compose exec backend alembic upgrade head"
    fi
elif [ "$RUN_SEED" = false ]; then
    echo "  $NEXT_STEP. Update backend/.env:"
    echo "     - Set SECRET_KEY (generate with: openssl rand -hex 32)"
    echo "     - Set ANTHROPIC_API_KEY (get from https://console.anthropic.com/)"
    NEXT_STEP=$((NEXT_STEP + 1))
    echo "  $NEXT_STEP. Seed demo data (providers, accounts, users, jobs):"
    if check_command make; then
        echo "     make seed"
    else
        echo "     docker-compose exec backend python scripts/seed_demo.py"
    fi
else
    # Both migrate and seed were run
    if [ $ISSUES -eq 0 ]; then
        echo "  ✓ Setup complete! You can now access the application."
        echo ""
        echo -e "${CYAN}Demo account is ready with:${NC}"
        echo "  • 5 quantum computing providers"
        echo "  • 15 demo jobs with realistic data"
        echo "  • Login credentials: admin@acme.com / demo123!"
    else
        echo "  $NEXT_STEP. Update backend/.env:"
        echo "     - Set SECRET_KEY (generate with: openssl rand -hex 32)"
        echo "     - Set ANTHROPIC_API_KEY (get from https://console.anthropic.com/)"
    fi
fi
echo ""
