.PHONY: help dev-setup dev up down restart logs logs-backend logs-frontend clean shell-backend shell-db migrate migrate-create seed test dev-debug dev-reset status health

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)QuantumCue Development Commands$(NC)"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# =============================================================================
# Development Setup
# =============================================================================

dev-setup: ## Initial development setup (first time only)
	@echo "$(BLUE)Setting up QuantumCue development environment...$(NC)"
	@./scripts/dev-setup.sh

dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend API: http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"

dev-debug: ## Start with verbose logging
	@echo "$(YELLOW)Starting in debug mode...$(NC)"
	@docker-compose up

dev-reset: ## Complete reset (WARNING: deletes all data!)
	@echo "$(YELLOW)WARNING: This will delete ALL data!$(NC)"
	@read -p "Are you sure? Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ] || exit 1
	@docker-compose down -v
	@docker-compose build --no-cache
	@docker-compose up -d
	@echo "$(GREEN)Environment reset complete!$(NC)"

# =============================================================================
# Docker Operations
# =============================================================================

up: ## Start all services in background
	@docker-compose up -d

down: ## Stop all services
	@docker-compose down

restart: ## Restart all services
	@docker-compose restart

status: ## Show status of all containers
	@docker-compose ps

logs: ## Follow logs for all services
	@docker-compose logs -f

logs-backend: ## Follow backend logs only
	@docker-compose logs -f backend

logs-frontend: ## Follow frontend logs only
	@docker-compose logs -f frontend

logs-db: ## Follow database logs only
	@docker-compose logs -f postgres

# =============================================================================
# Database Operations
# =============================================================================

migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	@docker-compose exec -T backend alembic upgrade head
	@echo "$(GREEN)Migrations complete!$(NC)"

migrate-create: ## Create a new migration (use: make migrate-create MSG="your message")
	@if [ -z "$(MSG)" ]; then \
		echo "$(YELLOW)Error: MSG is required.$(NC)"; \
		echo "Usage: make migrate-create MSG=\"your migration message\""; \
		exit 1; \
	fi
	@docker-compose exec -T backend alembic revision --autogenerate -m "$(MSG)"
	@echo "$(GREEN)Migration created!$(NC)"

migrate-down: ## Rollback last migration
	@docker-compose exec -T backend alembic downgrade -1
	@echo "$(GREEN)Migration rolled back!$(NC)"

seed: ## Seed database with demo data
	@echo "$(BLUE)Seeding database with demo data...$(NC)"
	@docker-compose exec -T backend python scripts/seed_demo.py
	@echo "$(GREEN)Database seeded!$(NC)"

# =============================================================================
# Testing
# =============================================================================

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	@docker-compose exec -T backend pytest -v

test-cov: ## Run tests with coverage
	@docker-compose exec -T backend pytest --cov=app --cov-report=html --cov-report=term
	@echo "$(GREEN)Coverage report generated in htmlcov/$(NC)"

test-frontend: ## Run frontend tests
	@docker-compose exec -T frontend npm run test

# =============================================================================
# Shell Access
# =============================================================================

shell-backend: ## Open shell in backend container
	@docker-compose exec backend /bin/bash

shell-db: ## Open PostgreSQL shell
	@docker-compose exec postgres psql -U quantumcue -d quantumcue

shell-frontend: ## Open shell in frontend container
	@docker-compose exec frontend /bin/sh

# =============================================================================
# Health & Monitoring
# =============================================================================

health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@curl -s http://localhost:8000/health | python3 -m json.tool || echo "$(YELLOW)Backend not responding$(NC)"
	@echo ""
	@curl -s http://localhost:8000/api/v1/health/detailed | python3 -m json.tool || echo "$(YELLOW)Backend API not responding$(NC)"

# =============================================================================
# Cleanup
# =============================================================================

clean: ## Remove all containers, volumes, and images
	@echo "$(YELLOW)Cleaning up Docker resources...$(NC)"
	@docker-compose down -v --rmi local
	@echo "$(GREEN)Cleanup complete!$(NC)"

clean-all: ## Remove ALL Docker resources (including cached layers)
	@echo "$(YELLOW)WARNING: This will remove all Docker resources!$(NC)"
	@read -p "Are you sure? Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ] || exit 1
	@docker-compose down -v --rmi all
	@docker system prune -af
	@echo "$(GREEN)Full cleanup complete!$(NC)"

# =============================================================================
# Build Operations
# =============================================================================

build: ## Build all Docker images
	@docker-compose build

build-no-cache: ## Build all Docker images without cache
	@docker-compose build --no-cache

build-backend: ## Build backend image only
	@docker-compose build backend

build-frontend: ## Build frontend image only
	@docker-compose build frontend

# =============================================================================
# Production
# =============================================================================

prod-up: ## Start production environment
	@docker-compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production environment
	@docker-compose -f docker-compose.prod.yml down

prod-logs: ## View production logs
	@docker-compose -f docker-compose.prod.yml logs -f
