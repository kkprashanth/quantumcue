# QuantumCue

A unified marketplace and orchestration platform for quantum compute.

## Overview

QuantumCue is a demo application showcasing an end-to-end quantum computing marketplace experience. Users can:

- Upload data and define quantum jobs through an AI-guided chat interface
- Select from multiple quantum providers (QCI, D-Wave, IonQ)
- Track job progress and view results with visualizations
- Manage accounts, users, and billing

**Note:** This is a demo with stubbed quantum integrations. The quantum transformation and provider integrations return realistic mock data.

## Technology Stack

### Backend
- **Python 3.11+** with FastAPI
- **PostgreSQL 15** with async SQLAlchemy
- **MongoDB 7.0** for audit logs
- **Redis 7** for caching
- **Alembic** for migrations
- **Anthropic SDK** for LLM integration (job creation chat)
- **Google Gemini SDK** for LLM integration (dataset labeling chat)

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TanStack Query** for server state
- **Zustand** for client state
- **Tailwind CSS** for styling

### Infrastructure
- **Docker & Docker Compose** for containerization
- **PostgreSQL** for primary database
- **MongoDB** for audit logs
- **Redis** for conversation context caching
- **DigitalOcean** for deployment

## Quick Start

### Prerequisites

Before running the setup script, ensure you have the following installed:

**Required:**
- **Git** - Version control
  - macOS: `xcode-select --install`
  - Linux: `sudo apt-get install git` (Debian/Ubuntu) or `sudo yum install git` (RHEL/CentOS)
  - Windows: https://git-scm.com/download/win
- **Docker** - Containerization (version 20.10 or higher recommended)
  - macOS: https://docs.docker.com/desktop/install/mac-install/
  - Linux: https://docs.docker.com/engine/install/
  - Windows: https://docs.docker.com/desktop/install/windows-install/
- **Docker Compose** - Multi-container orchestration (v1 or v2)
  - Usually included with Docker Desktop
  - Standalone: https://docs.docker.com/compose/install/
- **curl** - HTTP client (for health checks)
  - Usually pre-installed on macOS/Linux
  - Windows: Included with Git for Windows

**Optional but Recommended:**
- **make** - Build automation tool
  - macOS: `xcode-select --install`
  - Linux: `sudo apt-get install build-essential` (Debian/Ubuntu)

**Important Notes:**
- The setup script will **check** if ports 3000, 5432, or 8000 are in use and warn you
- If port 5432 is in use, you likely have PostgreSQL already running on your system
- Ensure Docker Desktop or Docker daemon is **running** before executing the setup script
- If ports are in use, you can either stop the conflicting services or modify `docker-compose.yml` to use different ports

### Setup

1. Clone the repository:
```bash
git clone https://github.com/quantumcue/quantumcue-demo.git
cd quantumcue-demo
```

2. Set up environment variables:
```bash
# Backend - Copy example file and update with your values
cp backend/.env.example backend/.env

# Frontend - Copy example file (usually no changes needed)
cp frontend/.env.example frontend/.env
```

   **Required Environment Variables:**
   
   Edit `backend/.env` and set:
   - `SECRET_KEY` - Generate a secure key: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
   - `GEMINI_API_KEY` - Get from https://makersuite.google.com/app/apikey (required for dataset labeling chat)
   
   **Optional Environment Variables:**
   - `ANTHROPIC_API_KEY` - For job creation chat (get from https://console.anthropic.com/)
   - MongoDB and Redis settings have defaults that work with Docker Compose
   
   See [ENV_VARIABLES.md](./ENV_VARIABLES.md) for complete documentation.

3. Run the setup script (this will automatically run migrations and seed data):
```bash
# Full setup (recommended for first time - includes migrations and seeding)
make dev-setup

# Or run directly with options
./scripts/dev-setup.sh --help  # View all available options
```

   The setup script will automatically:
   - Build Docker images
   - Start all services (PostgreSQL, MongoDB, Redis, Backend, Frontend)
   - Run database migrations
   - Seed demo data (providers, accounts, users, and jobs)

4. Check service status and get login credentials:
```bash
# View status of all services and demo login credentials
./scripts/manage-local.sh status
```

   This will show you:
   - Status of all Docker containers (PostgreSQL, MongoDB, Redis, Backend, Frontend)
   - Service endpoints (Frontend, Backend API, API Docs)
   - **Demo login credentials** (admin and user accounts)
   - Port status (3000, 5432, 27017, 6379, 8000)

5. Access the application:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Setup Script Options

The development setup script (`scripts/dev-setup.sh`) provides several options for flexible setup:

**View Help:**
```bash
./scripts/dev-setup.sh --help
```

**Available Options:**
- `--migrate` - Run database migrations after setup (default: enabled)
- `--seed` - Seed database with demo data after setup (default: enabled)
- `--all` - Run migrations and seed data (default behavior)
- `--no-migrate` - Skip database migrations
- `--no-seed` - Skip seeding database
- `--skip-build` - Skip building Docker images (faster if images already exist)
- `--skip-start` - Skip starting services (only setup files and build)
- `-h, --help` - Show help message

**Usage Examples:**
```bash
# Full setup (default - includes migrations and seeding)
# Recommended for first-time developers
./scripts/dev-setup.sh

# Skip seeding (if you don't want demo data)
./scripts/dev-setup.sh --no-seed

# Skip migrations (if database is already migrated)
./scripts/dev-setup.sh --no-migrate

# Skip both migrations and seeding
./scripts/dev-setup.sh --no-migrate --no-seed

# Skip image building (faster if images exist)
./scripts/dev-setup.sh --skip-build

# Setup files only, don't build or start services
./scripts/dev-setup.sh --skip-build --skip-start
```

**What the Script Does:**
1. ✅ Checks for all required dependencies
2. ✅ Checks if ports 3000, 5432, 27017, 6379, and 8000 are available (warns if in use)
3. ✅ Provides helpful messages if services are detected on those ports
4. ✅ Creates `.env` files from `.env.example` if they don't exist
5. ✅ Validates project files are present
6. ✅ Builds Docker images (unless `--skip-build` is used)
7. ✅ Starts all services (PostgreSQL, MongoDB, Redis, Backend, Frontend) unless `--skip-start` is used
8. ✅ Waits for services to be healthy
9. ✅ Runs database migrations (default, use `--no-migrate` to skip)
10. ✅ Seeds database with demo data (default, use `--no-seed` to skip):
    - 5 quantum computing providers (QCI, D-Wave, IonQ, IBM Quantum, Rigetti)
    - Demo account and users (admin@acme.com, user@acme.com)
    - 15 demo jobs with realistic data and various statuses
11. ✅ Provides helpful next steps and troubleshooting information

### Demo Credentials

After running the setup script with seeding (default), you can log in with:

| Email | Password | Role |
|-------|----------|------|
| admin@acme.com | demo123! | Admin |
| user@acme.com | demo123! | User |

**Quick Access to Credentials:**
```bash
# View service status and login credentials
./scripts/manage-local.sh status
```

**Demo Data Includes:**
- 5 quantum computing providers with full specifications
- 15 demo jobs with various statuses (completed, running, pending, failed)
- Realistic job data including results, metrics, and timestamps
- All data is read from the database (not mocked)

## Development Commands

### Using Make Commands

```bash
# Setup & Environment
make dev-setup    # Run development setup script
make dev          # Start development environment
make dev-debug    # Start with verbose logging
make dev-reset    # Complete reset (WARNING: deletes all data!)

# Docker Operations
make up           # Start all services in background
make down         # Stop all services
make restart      # Restart all services
make status       # Show status of all containers
make logs         # View all logs
make logs-backend # View backend logs only
make logs-frontend # View frontend logs only
make logs-db      # View database logs only

# Database Operations
make migrate      # Run database migrations
make migrate-create MSG="description"  # Create new migration
make migrate-down # Rollback last migration
make seed         # Seed database with demo data

# Testing
make test         # Run all tests
make test-cov     # Run tests with coverage
make test-frontend # Run frontend tests

# Shell Access
make shell-backend # Open shell in backend container
make shell-frontend # Open shell in frontend container
make shell-db      # Open PostgreSQL shell

# Utilities
make health       # Check health of all services
make clean        # Remove containers, volumes, and images
make help         # Show all available commands
```

### Using Management Script

For more detailed service management, use the `manage-local.sh` script:

```bash
# View help
./scripts/manage-local.sh help

# Check status of all services (includes demo login credentials)
./scripts/manage-local.sh status

# Start/Stop services
./scripts/manage-local.sh start    # Start all services
./scripts/manage-local.sh stop     # Stop all services

# Restart services (useful when hot reload isn't working)
./scripts/manage-local.sh restart backend   # Restart backend only
./scripts/manage-local.sh restart frontend  # Restart frontend only
./scripts/manage-local.sh restart mongodb   # Restart MongoDB only
./scripts/manage-local.sh restart redis     # Restart Redis only
./scripts/manage-local.sh restart all       # Restart all services

# View logs
./scripts/manage-local.sh logs              # All services
./scripts/manage-local.sh logs backend      # Backend only
./scripts/manage-local.sh logs frontend     # Frontend only

# Health checks
./scripts/manage-local.sh health

# Open shell in containers
./scripts/manage-local.sh shell backend     # Backend shell
./scripts/manage-local.sh shell frontend    # Frontend shell
./scripts/manage-local.sh shell postgres    # PostgreSQL shell
./scripts/manage-local.sh shell mongodb     # MongoDB shell
./scripts/manage-local.sh shell redis        # Redis CLI
```

**Development Notes:**
- Both backend and frontend support **hot reload** - code changes are automatically picked up
- Use `restart backend` after installing new Python packages
- Use `restart frontend` after installing new npm packages
- Use `restart` if hot reload isn't working or services become unresponsive

## Project Structure

```
quantumcue-demo/
├── backend/                 # Python FastAPI application
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── core/           # Security, dependencies
│   │   ├── db/             # Database session
│   │   ├── models/         # SQLAlchemy models
│   │   ├── repositories/   # Data access layer
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   │   ├── llm/        # LLM integration
│   │   │   └── quantum/    # Quantum stubs
│   │   └── utils/          # Utilities
│   ├── alembic/            # Database migrations
│   └── tests/              # Backend tests
├── frontend/               # React TypeScript application
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand stores
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── docs/                   # Documentation
├── scripts/                # Development scripts
├── docker-compose.yml      # Development environment
├── Makefile               # Development commands
├── CLAUDE.md              # Claude Code rules
└── .cursorrules           # Cursor IDE rules
```

## Environment Variables

### Quick Setup

1. **Copy example files:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Set required variables in `backend/.env`:**
   - `SECRET_KEY` - Generate: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
   - `GEMINI_API_KEY` - Get from https://makersuite.google.com/app/apikey (required for dataset labeling chat)

3. **Optional variables:**
   - `ANTHROPIC_API_KEY` - For job creation chat
   - MongoDB and Redis settings have defaults that work with Docker Compose

### Complete Documentation

For detailed information about all environment variables, see [ENV_VARIABLES.md](./ENV_VARIABLES.md).

**Key Points:**
- `GEMINI_API_KEY` is **required** for the dataset labeling chat feature
- MongoDB and Redis are **optional** - the app works without them but with limitations:
  - Without MongoDB: Audit logs won't be saved
  - Without Redis: Conversation context won't be cached (slower but functional)

## Documentation

- [Product Requirements Document](./docs/quantumcue-prd.md) - Full PRD with specifications
- [Application Template](./docs/APPLICATION_TEMPLATE.md) - Technology stack patterns
- [Environment Variables](./ENV_VARIABLES.md) - Complete environment variable documentation
- [Claude Code Rules](./CLAUDE.md) - Development guidelines

## Features

### Implemented
- [x] **Authentication** - JWT-based authentication with role-based access control
- [x] **Dashboard** - Overview with job statistics, provider status, and data usage
- [x] **Jobs** - Job listing, filtering, detail views, and status tracking
- [x] **Job Creation with LLM Integration** - AI-guided job configuration through chat interface (Anthropic Claude)
- [x] **Providers** - Provider listing and detailed specifications
- [x] **Account** - Account management and user administration (admin only)
- [x] **Settings** - User profile and preferences management
- [x] **Models & Datasets** - Management interfaces for ML models and datasets
- [x] **Dataset Labeling with LLM** - AI-powered dataset labeling chat interface (Google Gemini)
- [x] **Multi-Modal Dataset Processing** - ZIP file upload, extraction, and structure analysis
- [x] **Audit Logging** - MongoDB-based audit logs for all LLM interactions
- [x] **Conversation Caching** - Redis-based caching for LLM conversation context

### Coming Soon
- [ ] **Results Visualizations** - Interactive charts and graphs for quantum computation results
- [ ] **Quantum Processing Full Circle** - Complete end-to-end quantum job execution with real provider integrations

## Contributing

We welcome contributions! Please follow these steps:

### Development Workflow

1. **Create a new branch** from `develop`:
```bash
# Make sure you're on the develop branch and up to date
git checkout develop
git pull origin develop

# Create a new branch for your feature/fix
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. **Make your changes** and test locally:
```bash
# Make sure everything still works
make test
make health
```

3. **Stage and commit your changes**:
```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add new feature description"
# or
git commit -m "fix: fix bug description"
```

   **Commit Message Guidelines:**
   - Use conventional commit format: `type: description`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
   - Keep descriptions clear and concise

4. **Push your branch** to GitHub:
```bash
git push origin feature/your-feature-name
```

5. **Open a Pull Request**:
   - Go to the GitHub repository
   - Click "New Pull Request"
   - Select `develop` as the base branch
   - Select your feature branch
   - Fill out the PR template with:
     - Description of changes
     - Related issues (if any)
     - Screenshots (for UI changes)
   - Request review from team members

### Code Quality

- Follow the coding standards in [CLAUDE.md](./CLAUDE.md)
- Ensure your code passes linting and formatting checks
- Write or update tests for new features
- Update documentation as needed

**Note:** Automated unit tests and linting/formatting checks will be added to the CI/CD pipeline in the future. For now, please run tests locally before submitting PRs.

## License

Proprietary - QuantumCue
