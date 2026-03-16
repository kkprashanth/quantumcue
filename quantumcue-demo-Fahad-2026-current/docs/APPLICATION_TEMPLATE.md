# Application Template - Technology Stack & Patterns

This document serves as a template for creating new applications using the same technology stack and patterns. Use this as a starting point for new projects.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Setup Patterns](#setup-patterns)
4. [Development Scripts](#development-scripts)
5. [Configuration Management](#configuration-management)
6. [Logging Patterns](#logging-patterns)
7. [Auditing Patterns](#auditing-patterns)
8. [Database Patterns](#database-patterns)
9. [API Patterns](#api-patterns)
10. [Frontend Patterns](#frontend-patterns)
11. [Testing Patterns](#testing-patterns)
12. [Deployment Patterns](#deployment-patterns)

---

## Technology Stack

### Backend

- **Language**: Python 3.11+
- **Framework**: FastAPI 0.109+
- **ASGI Server**: Uvicorn with standard extras
- **ORM**: SQLAlchemy 2.0+ (async)
- **Database Driver**: asyncpg (PostgreSQL async driver)
- **Migrations**: Alembic 1.13+
- **Validation**: Pydantic 2.5+ with email extras
- **Settings**: Pydantic Settings 2.1+
- **Caching**: Redis 5.0+ with hiredis
- **NoSQL**: Motor 3.3+ (MongoDB async driver)
- **Authentication**: python-jose with cryptography
- **Password Hashing**: passlib with bcrypt
- **HTTP Client**: httpx 0.26+
- **ML/AI**: scikit-learn 1.4+, OpenAI SDK, Google Generative AI

### Frontend

- **Framework**: React 18.2+
- **Language**: TypeScript 5.3+
- **Build Tool**: Vite 7.1+
- **State Management**: TanStack Query 5.17+ (server state), Zustand 4.4+ (client state)
- **Routing**: React Router DOM 6.21+
- **HTTP Client**: Axios 1.6+
- **Styling**: Tailwind CSS 3.4+
- **Charts**: Chart.js 4.5+ with react-chartjs-2
- **Date Handling**: date-fns 3.2+
- **Testing**: Vitest 4.0+ with Testing Library

### Infrastructure

- **Containerization**: Docker & Docker Compose
- **Databases**:
  - PostgreSQL 15 (primary data)
  - Redis 7 (caching)
  - MongoDB 7 (audit logs)
- **Cloud**: AWS (ECS Fargate, RDS, ElastiCache, DocumentDB, ALB)
- **Infrastructure as Code**: Terraform 1.0+

### Development Tools

- **Code Formatting**: Black (Python), Prettier (TypeScript)
- **Linting**: Ruff (Python), ESLint (TypeScript)
- **Type Checking**: mypy (Python), TypeScript Compiler
- **Testing**: pytest (Python), Vitest (TypeScript)
- **Package Management**: Poetry (Python), npm (TypeScript)

---

## Project Structure

```
project-name/
├── backend/                    # Python FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── config.py           # Pydantic settings
│   │   ├── api/                # API endpoints
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py   # Main API router
│   │   │       └── endpoints/  # Individual endpoint modules
│   │   ├── core/               # Core functionality
│   │   │   ├── __init__.py
│   │   │   └── security.py     # Authentication, JWT, password hashing
│   │   ├── db/                  # Database connections
│   │   │   ├── __init__.py
│   │   │   ├── session.py      # PostgreSQL async session
│   │   │   ├── redis_client.py # Redis connection
│   │   │   └── mongodb.py      # MongoDB connection
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   └── *.py            # Model files (User, Product, etc.)
│   │   ├── repositories/         # Data access layer
│   │   │   ├── __init__.py
│   │   │   └── *.py            # Repository classes
│   │   ├── schemas/             # Pydantic schemas
│   │   │   ├── __init__.py
│   │   │   └── *.py            # Request/response schemas
│   │   ├── services/            # Business logic
│   │   │   ├── __init__.py
│   │   │   └── *.py            # Service classes
│   │   └── utils/               # Utilities
│   │       ├── __init__.py
│   │       ├── logger.py        # Logging configuration
│   │       ├── exceptions.py   # Custom exceptions
│   │       └── *.py            # Other utilities
│   ├── alembic/                # Database migrations
│   │   ├── versions/            # Migration files
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── alembic.ini
│   ├── Dockerfile               # Production Dockerfile
│   ├── Dockerfile.dev           # Development Dockerfile
│   ├── pyproject.toml          # Poetry dependencies
│   ├── .env.example            # Environment template
│   ├── .env                    # Local environment (gitignored)
│   └── tests/                  # Test files
│       ├── __init__.py
│       ├── conftest.py         # Pytest fixtures
│       ├── unit/               # Unit tests
│       └── integration/        # Integration tests
│
├── frontend/                    # React TypeScript application
│   ├── src/
│   │   ├── api/                # API client
│   │   │   ├── client.ts       # Axios instance
│   │   │   ├── hooks.ts        # React Query hooks
│   │   │   └── types.ts        # API types
│   │   ├── components/         # React components
│   │   │   ├── common/         # Shared components
│   │   │   ├── layout/         # Layout components
│   │   │   └── ui/             # UI components
│   │   ├── contexts/           # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── pages/              # Page components
│   │   ├── styles/             # Style definitions
│   │   ├── types/              # TypeScript types
│   │   │   └── index.ts
│   │   ├── utils/              # Utility functions
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   ├── public/                 # Static assets
│   ├── Dockerfile              # Production Dockerfile
│   ├── Dockerfile.dev          # Development Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── .env.example
│   └── .env                    # Local environment (gitignored)
│
├── docs/                       # Documentation
│   ├── API_REFERENCE.md
│   ├── DEVELOPMENT.md
│   ├── AUTHENTICATION.md
│   └── APPLICATION_TEMPLATE.md # This file
│
├── scripts/                     # Development scripts
│   ├── dev-setup.sh            # Initial setup
│   ├── dev-start.sh            # Start services
│   ├── dev-stop.sh             # Stop services
│   ├── dev-restart.sh          # Restart services
│   ├── dev-reset.sh            # Reset environment
│   ├── dev-debug.sh            # Debug information
│   ├── dev-logs.sh             # View logs
│   ├── dev-status.sh           # Service status
│   └── create-user.sh          # User management
│
├── aws/                        # AWS infrastructure (optional)
│   ├── terraform/              # Terraform configurations
│   ├── deploy.sh               # Deployment script
│   ├── shutdown.sh             # Shutdown script
│   └── restart.sh              # Restart script
│
├── docker-compose.yml          # Docker Compose configuration
├── Makefile                    # Development commands
├── README.md                   # Project documentation
└── .gitignore                  # Git ignore rules
```

---

## Setup Patterns

### 1. Environment Configuration

#### Backend `.env.example`

```env
# Application
APP_NAME=Your Application Name
APP_ENV=development
DEBUG=true
SECRET_KEY=generate-with-openssl-rand-hex-32
API_VERSION=v1

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=your_app_user
POSTGRES_PASSWORD=changeme
POSTGRES_DB=your_app_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# MongoDB (for audit logs)
MONGODB_HOST=mongodb
MONGODB_PORT=27017
MONGODB_USER=your_app_user
MONGODB_PASSWORD=changeme
MONGODB_DB=audit_logs

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Frontend `.env.example`

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
VITE_APP_NAME=Your Application Name
VITE_APP_ENV=development
VITE_DEBUG=true
```

### 2. Docker Compose Pattern

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: your-app-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-your_app_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
      POSTGRES_DB: ${POSTGRES_DB:-your_app_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-your_app_user}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: your-app-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  mongodb:
    image: mongo:7
    container_name: your-app-mongodb
    environment:
      MONGO_INITDB_DATABASE: ${MONGODB_DB:-audit_logs}
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    container_name: your-app-backend
    env_file:
      - ./backend/.env
    environment:
      - DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER:-your_app_user}:${POSTGRES_PASSWORD:-changeme}@postgres:5432/${POSTGRES_DB:-your_app_db}
      - REDIS_URL=redis://redis:6379/0
      - MONGODB_URL=mongodb://${MONGODB_USER:-your_app_user}:${MONGODB_PASSWORD:-changeme}@mongodb:27017/${MONGODB_DB:-audit_logs}
    volumes:
      - ./backend:/app
      - backend_cache:/app/.cache
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      mongodb:
        condition: service_healthy
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: your-app-frontend
    env_file:
      - ./frontend/.env
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - backend
    command: npm run dev -- --host 0.0.0.0 --port 3000
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:
  mongodb_data:
  backend_cache:

networks:
  app-network:
    driver: bridge
```

### 3. Configuration Management Pattern

#### Backend `app/config.py`

```python
"""Configuration management using Pydantic settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Your Application"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_VERSION: str = "v1"
    SECRET_KEY: str

    @property
    def is_development(self) -> bool:
        """Check if running in local development environment."""
        return self.APP_ENV.lower() in ("development", "local")

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.APP_ENV.lower() in ("production", "prod")

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000"

    # PostgreSQL
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "your_app_user"
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "your_app_db"

    @property
    def DATABASE_URL(self) -> str:  # noqa: N802
        """Construct async PostgreSQL connection URL."""
        host = self.POSTGRES_HOST.split(":")[0] if ":" in self.POSTGRES_HOST else self.POSTGRES_HOST
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{host}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str | None = None
    REDIS_DB: int = 0

    @property
    def REDIS_URL(self) -> str:  # noqa: N802
        """Construct Redis connection URL."""
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # MongoDB
    MONGODB_HOST: str = "mongodb"
    MONGODB_PORT: int = 27017
    MONGODB_USER: str = "your_app_user"
    MONGODB_PASSWORD: str | None = None
    MONGODB_DB: str = "audit_logs"

    @property
    def MONGODB_URL(self) -> str:  # noqa: N802
        """Construct MongoDB connection URL."""
        if self.MONGODB_PASSWORD:
            return f"mongodb://{self.MONGODB_USER}:{self.MONGODB_PASSWORD}@{self.MONGODB_HOST}:{self.MONGODB_PORT}/{self.MONGODB_DB}"
        return f"mongodb://{self.MONGODB_HOST}:{self.MONGODB_PORT}/{self.MONGODB_DB}"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # "json" or "text"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


_settings: Settings | None = None


def get_settings() -> Settings:
    """Get application settings (singleton pattern)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
```

---

## Development Scripts

### 1. Setup Script Pattern (`scripts/dev-setup.sh`)

```bash
#!/bin/bash
# Your Application - Development Setup Script
# Initial setup for new developers

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 Your Application - Development Setup${NC}"
echo "=================================================="

# Check dependencies
echo -e "\n${YELLOW}📋 Checking dependencies...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed.${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed.${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are available${NC}"

# Check ports availability
echo -e "\n${YELLOW}🔌 Checking port availability...${NC}"
PORTS=(3000 5432 6379 8000 27017)
for port in "${PORTS[@]}"; do
    if lsof -i :$port &> /dev/null; then
        echo -e "${YELLOW}⚠️  Port $port is in use.${NC}"
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
    fi
done

# Create .env files if they don't exist
echo -e "\n${YELLOW}📝 Setting up environment files...${NC}"

# Backend .env
if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    if [ -f "$PROJECT_ROOT/backend/.env.example" ]; then
        cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/backend/.env"
        echo -e "${GREEN}✅ Created backend/.env from template${NC}"
    fi
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

# Frontend .env
if [ ! -f "$PROJECT_ROOT/frontend/.env" ]; then
    if [ -f "$PROJECT_ROOT/frontend/.env.example" ]; then
        cp "$PROJECT_ROOT/frontend/.env.example" "$PROJECT_ROOT/frontend/.env"
        echo -e "${GREEN}✅ Created frontend/.env from template${NC}"
    fi
else
    echo -e "${GREEN}✅ frontend/.env already exists${NC}"
fi

# Build Docker images
echo -e "\n${YELLOW}🐳 Building Docker images...${NC}"
cd "$PROJECT_ROOT"
docker-compose build

# Start services
echo -e "\n${YELLOW}🚀 Starting services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "\n${YELLOW}⏳ Waiting for services to be healthy (30s)...${NC}"
sleep 30

# Run database migrations
echo -e "\n${YELLOW}🗄️  Running database migrations...${NC}"
if docker-compose exec -T backend alembic upgrade head; then
    echo -e "${GREEN}✅ Database migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  Database migrations failed${NC}"
fi

echo -e "\n${GREEN}🎉 Setup complete!${NC}"
echo "=================================================="
echo -e "${BLUE}📍 Access points:${NC}"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
```

### 2. Makefile Pattern

```makefile
.PHONY: help setup up down restart logs logs-backend logs-frontend clean shell-backend shell-db migrate seed test dev-setup dev dev-debug dev-reset

help: ## Show this help message
	@echo "Your Application"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev-setup: ## Initial development setup (first time only)
	@echo "🚀 Running development setup..."
	@./scripts/dev-setup.sh

dev: ## Start development environment
	@echo "🚀 Starting development environment..."
	@./scripts/dev-start.sh

dev-debug: ## Debug mode with verbose logging
	@echo "🐛 Running debug mode..."
	@./scripts/dev-debug.sh

dev-reset: ## Complete reset (remove volumes, rebuild everything)
	@echo "⚠️  WARNING: This will delete ALL data!"
	@read -p "Are you sure? Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ] || exit 1
	@./scripts/dev-reset.sh

up: ## Start all services
	@docker-compose up -d

down: ## Stop all services
	@docker-compose down

restart: ## Restart all services
	@docker-compose restart

logs: ## Follow logs for all services
	@docker-compose logs -f

logs-backend: ## Follow backend logs only
	@docker-compose logs -f backend

logs-frontend: ## Follow frontend logs only
	@docker-compose logs -f frontend

migrate: ## Run database migrations
	@docker-compose exec backend alembic upgrade head

migrate-create: ## Create a new migration (use: make migrate-create MSG="your message")
	@if [ -z "$(MSG)" ]; then \
		echo "❌ Error: MSG is required."; \
		exit 1; \
	fi
	@docker-compose exec backend alembic revision --autogenerate -m "$(MSG)"

seed: ## Seed database with default data
	@docker-compose exec backend python scripts/seed_database.py

test: ## Run tests
	@docker-compose exec backend pytest -v

test-cov: ## Run tests with coverage
	@docker-compose exec backend pytest --cov=app --cov-report=html --cov-report=term

shell-backend: ## Open shell in backend container
	@docker-compose exec backend /bin/bash

shell-db: ## Open PostgreSQL shell
	@docker-compose exec postgres psql -U your_app_user -d your_app_db

health: ## Check health of all services
	@curl -s http://localhost:8000/api/v1/health/detailed | python -m json.tool || echo "❌ Backend not responding"

status: ## Show status of all containers
	@docker-compose ps
```

---

## Logging Patterns

### 1. Logger Configuration (`app/utils/logger.py`)

```python
"""Logging configuration with JSON formatting support."""

import json
import logging
import sys
from datetime import datetime
from typing import Any

from app.config import get_settings


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data: dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields if present
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        return json.dumps(log_data)


def setup_logging() -> None:
    """Configure application logging based on settings."""
    settings = get_settings()

    # Create handler
    handler = logging.StreamHandler(sys.stdout)

    # Set formatter based on config
    if settings.LOG_FORMAT == "json":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(settings.LOG_LEVEL)
    root_logger.addHandler(handler)

    # Silence noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)


# Create application logger
logger = logging.getLogger("your_app")
```

### 2. Usage in Services

```python
from app.utils.logger import logger

class YourService:
    async def process_data(self, data_id: str, user_id: str) -> dict:
        """Process data with logging."""
        logger.info(
            f"Processing data: {data_id}",
            extra={
                "data_id": data_id,
                "user_id": user_id,
                "action": "process_data",
            },
        )

        try:
            # Your logic here
            result = await self._do_work(data_id)
            
            logger.info(
                f"Successfully processed data: {data_id}",
                extra={
                    "data_id": data_id,
                    "user_id": user_id,
                    "action": "process_data",
                    "status": "success",
                },
            )
            return result

        except Exception as e:
            logger.error(
                f"Failed to process data: {data_id}",
                extra={
                    "data_id": data_id,
                    "user_id": user_id,
                    "action": "process_data",
                    "status": "error",
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
                exc_info=True,
            )
            raise
```

---

## Auditing Patterns

### 1. MongoDB Audit Storage

```python
"""Audit logging to MongoDB."""

from datetime import datetime
from typing import Any

from app.db.mongodb import get_mongodb
from app.utils.logger import logger


async def store_audit_log(
    action: str,
    user_id: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> str | None:
    """
    Store audit log in MongoDB.

    Args:
        action: Action performed (e.g., "create", "update", "delete")
        user_id: ID of user performing the action
        resource_type: Type of resource (e.g., "product", "user")
        resource_id: ID of the resource
        details: Additional details about the action

    Returns:
        MongoDB document ID or None if storage fails
    """
    try:
        mongodb_db = await get_mongodb()
        collection = mongodb_db["audit_logs"]

        document = {
            "action": action,
            "user_id": user_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "timestamp": datetime.utcnow(),
        }

        result = await collection.insert_one(document)
        logger.debug(
            f"Stored audit log: {action} on {resource_type}/{resource_id}",
            extra={
                "action": action,
                "user_id": user_id,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "mongodb_id": str(result.inserted_id),
            },
        )
        return str(result.inserted_id)

    except RuntimeError as e:
        # MongoDB not initialized
        logger.warning(
            f"MongoDB not initialized, skipping audit log: {str(e)}",
            extra={"action": action, "error": str(e)},
        )
        return None
    except Exception as e:
        logger.error(
            f"Failed to store audit log: {str(e)}",
            extra={
                "action": action,
                "user_id": user_id,
                "error": str(e),
                "error_type": type(e).__name__,
            },
        )
        # Don't fail the operation if audit logging fails
        return None
```

### 2. Audit Middleware Pattern

```python
"""FastAPI middleware for automatic audit logging."""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.utils.audit import store_audit_log
from app.utils.logger import logger


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware to log API requests for auditing."""

    async def dispatch(self, request: Request, call_next):
        """Process request and log for audit."""
        # Extract user from request (if authenticated)
        user_id = None
        if hasattr(request.state, "user"):
            user_id = str(request.state.user.id)

        # Extract resource information from path
        path_parts = request.url.path.split("/")
        resource_type = None
        resource_id = None

        if len(path_parts) >= 3:
            resource_type = path_parts[2]  # e.g., "products", "users"
        if len(path_parts) >= 4:
            resource_id = path_parts[3]  # Resource ID

        # Determine action from HTTP method
        action_map = {
            "GET": "read",
            "POST": "create",
            "PUT": "update",
            "PATCH": "update",
            "DELETE": "delete",
        }
        action = action_map.get(request.method, "unknown")

        # Process request
        response = await call_next(request)

        # Log for audit (non-blocking)
        if action != "read" or response.status_code >= 400:
            # Log all writes and errors
            await store_audit_log(
                action=action,
                user_id=user_id,
                resource_type=resource_type,
                resource_id=resource_id,
                details={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                },
            )

        return response
```

### 3. Audit API Endpoints

```python
"""Audit API endpoints for viewing audit logs."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.core.security import get_current_superuser
from app.db.mongodb import get_mongodb
from app.models.user import User

router = APIRouter()


class AuditLogResponse(BaseModel):
    """Schema for audit log entry."""

    id: str
    action: str
    user_id: str | None
    resource_type: str | None
    resource_id: str | None
    details: dict
    timestamp: datetime


@router.get("/audit-logs", response_model=list[AuditLogResponse])
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    resource_type: str | None = Query(None),
    user_id: str | None = Query(None),
    current_user: User = Depends(get_current_superuser),
):
    """
    Get audit logs with filtering and pagination.

    Requires superuser access.
    """
    try:
        mongodb_db = await get_mongodb()
        collection = mongodb_db["audit_logs"]

        # Build query
        query = {}
        if resource_type:
            query["resource_type"] = resource_type
        if user_id:
            query["user_id"] = user_id

        # Calculate skip
        skip = (page - 1) * page_size

        # Fetch logs
        logs = []
        cursor = collection.find(query).sort("timestamp", -1).skip(skip).limit(page_size)
        async for doc in cursor:
            logs.append(
                AuditLogResponse(
                    id=str(doc["_id"]),
                    action=doc["action"],
                    user_id=doc.get("user_id"),
                    resource_type=doc.get("resource_type"),
                    resource_id=doc.get("resource_id"),
                    details=doc.get("details", {}),
                    timestamp=doc["timestamp"],
                )
            )

        return logs

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve audit logs: {str(e)}",
        )
```

---

## Database Patterns

### 1. Database Session Pattern

```python
"""Database session management."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import get_settings

settings = get_settings()

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def init_db() -> None:
    """Initialize database connection."""
    # Test connection
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connection."""
    await engine.dispose()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

### 2. Repository Pattern

```python
"""Repository pattern for data access."""

from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations."""

    def __init__(self, model: type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get(self, id: UUID) -> ModelType | None:
        """Get entity by ID."""
        result = await self.session.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[ModelType]:
        """Get all entities with pagination."""
        result = await self.session.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, **kwargs) -> ModelType:
        """Create new entity."""
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def update(self, id: UUID, **kwargs) -> ModelType | None:
        """Update entity."""
        instance = await self.get(id)
        if instance:
            for key, value in kwargs.items():
                setattr(instance, key, value)
            await self.session.flush()
            await self.session.refresh(instance)
        return instance

    async def delete(self, id: UUID) -> bool:
        """Delete entity."""
        instance = await self.get(id)
        if instance:
            await self.session.delete(instance)
            await self.session.flush()
            return True
        return False
```

---

## API Patterns

### 1. FastAPI Application Setup

```python
"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config import get_settings
from app.db.mongodb import close_mongodb, init_mongodb
from app.db.redis_client import close_redis, init_redis
from app.db.session import close_db, init_db
from app.utils.logger import logger, setup_logging

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events - startup and shutdown."""
    # Startup
    logger.info(f"Starting {settings.APP_NAME}")
    setup_logging()

    # Initialize database connections
    await init_db()
    await init_redis()
    await init_mongodb()

    logger.info("Application startup complete")

    yield

    # Shutdown
    logger.info("Shutting down application")
    await close_db()
    await close_redis()
    await close_mongodb()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=f"/api/{settings.API_VERSION}")
```

### 2. API Router Pattern

```python
"""Main API router."""

from fastapi import APIRouter

from app.api.v1.endpoints import audit, auth, health, products, users

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
```

### 3. Endpoint Pattern

```python
"""Example endpoint module."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.product import ProductRepository
from app.schemas.product import ProductCreate, ProductResponse
from app.utils.audit import store_audit_log

router = APIRouter()


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new product."""
    repo = ProductRepository(db)
    product = await repo.create(**product_data.model_dump())

    # Audit log
    await store_audit_log(
        action="create",
        user_id=str(current_user.id),
        resource_type="product",
        resource_id=str(product.id),
    )

    return product


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get product by ID."""
    repo = ProductRepository(db)
    product = await repo.get(product_id)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found",
        )

    return product
```

---

## Frontend Patterns

### 1. API Client Pattern

```typescript
// src/api/client.ts
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

### 2. React Query Hooks Pattern

```typescript
// src/api/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import type { Product, ProductCreate } from './types';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await client.get<Product[]>('/products');
      return response.data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await client.get<Product>(`/products/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ProductCreate) => {
      const response = await client.post<Product>('/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

---

## Testing Patterns

### 1. Backend Test Pattern

```python
"""Example test file."""

import pytest
from httpx import AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_create_product():
    """Test creating a product."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Login first
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@example.com", "password": "admin123"},
        )
        token = response.json()["access_token"]

        # Create product
        response = await client.post(
            "/api/v1/products",
            json={"name": "Test Product", "description": "Test"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Product"
```

### 2. Frontend Test Pattern

```typescript
// src/components/ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductCard } from './ProductCard';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('ProductCard', () => {
  it('renders product information', () => {
    const queryClient = createTestQueryClient();
    const product = {
      id: '123',
      name: 'Test Product',
      description: 'Test Description',
    };

    render(
      <QueryClientProvider client={queryClient}>
        <ProductCard product={product} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
});
```

---

## Deployment Patterns

### 1. Dockerfile Pattern (Backend)

```dockerfile
# Development stage
FROM python:3.11-slim as development

WORKDIR /app

# Install Poetry
RUN pip install poetry

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi

# Copy application code
COPY . .

# Development command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production stage
FROM python:3.11-slim as production

WORKDIR /app

# Install Poetry
RUN pip install poetry

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install only production dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi --no-dev

# Copy application code
COPY . .

# Production command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Dockerfile Pattern (Frontend)

```dockerfile
# Development stage
FROM node:20-alpine as development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Development command
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# Production build stage
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine as production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## Quick Start Checklist

When creating a new application using this template:

- [ ] Update application name in all configuration files
- [ ] Update database names and credentials
- [ ] Configure environment variables (`.env.example` files)
- [ ] Set up Docker Compose with correct service names
- [ ] Configure logging format (JSON or text)
- [ ] Set up audit logging (MongoDB)
- [ ] Create initial database models
- [ ] Set up Alembic migrations
- [ ] Configure authentication/authorization
- [ ] Create API endpoints
- [ ] Set up frontend API client
- [ ] Configure React Query hooks
- [ ] Set up testing infrastructure
- [ ] Create development scripts
- [ ] Update Makefile with project-specific commands
- [ ] Document API endpoints
- [ ] Set up CI/CD pipeline (optional)
- [ ] Configure AWS infrastructure (optional)

---

## Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **SQLAlchemy Async**: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- **React Query**: https://tanstack.com/query/latest
- **TypeScript**: https://www.typescriptlang.org/
- **Docker Compose**: https://docs.docker.com/compose/
- **Alembic**: https://alembic.sqlalchemy.org/

---

**Last Updated**: N/A

