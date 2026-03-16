# QuantumCue Development Rules

## Project Overview

QuantumCue is a quantum computing marketplace and orchestration platform. This is a demo application with stubbed quantum integrations designed to showcase the full user experience of uploading data, defining quantum jobs through an AI-guided chat interface, selecting providers, and viewing results.

**Target Users:** Enterprise customers seeking to leverage quantum computing for optimization, simulation, and machine learning acceleration.

---

## Technology Stack

### Backend
- **Language:** Python 3.11+
- **Framework:** FastAPI 0.109+
- **ASGI Server:** Uvicorn
- **ORM:** SQLAlchemy 2.0+ (async)
- **Database:** PostgreSQL 15 with asyncpg driver
- **Migrations:** Alembic 1.13+
- **Validation:** Pydantic 2.5+
- **Settings:** Pydantic Settings 2.1+
- **Authentication:** python-jose with cryptography, passlib with bcrypt
- **HTTP Client:** httpx 0.26+
- **LLM Integration:** Anthropic SDK

### Frontend
- **Framework:** React 18.2+
- **Language:** TypeScript 5.3+
- **Build Tool:** Vite 5.0+
- **State Management:** TanStack Query 5.17+ (server state), Zustand 4.4+ (client state)
- **Routing:** React Router DOM 6.21+
- **HTTP Client:** Axios 1.6+
- **Styling:** Tailwind CSS 3.4+
- **Charts:** Chart.js 4.5+ with react-chartjs-2
- **Icons:** Lucide React
- **Date Handling:** date-fns 3.2+

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Database:** PostgreSQL 15
- **Deployment:** DigitalOcean (App Platform or Droplet)

---

## Code Style & Conventions

### Python (Backend)

#### Formatting & Linting
- Use **Black** for formatting (line length 88)
- Use **Ruff** for linting
- Use **mypy** for type checking

#### Import Order
Group imports in this order with blank lines between groups:
```python
# Standard library
import asyncio
from datetime import datetime
from uuid import UUID

# Third-party packages
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

# Local application
from app.core.security import get_current_user
from app.models.job import Job
```

#### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `JobRepository`, `UserService` |
| Functions/variables | snake_case | `get_job_by_id`, `user_count` |
| Constants | SCREAMING_SNAKE_CASE | `JWT_ALGORITHM`, `DEFAULT_PAGE_SIZE` |
| Private methods | Underscore prefix | `_validate_input` |

#### Type Hints
- Always use type hints for function parameters and returns
- Use `Mapped[]` for SQLAlchemy model attributes
- Use `| None` instead of `Optional[]` (Python 3.10+ style)

```python
async def get_job(self, job_id: UUID) -> Job | None:
    pass

def process_data(self, items: list[str], config: dict | None = None) -> dict:
    pass
```

#### Docstrings
Use Google-style docstrings for public functions:
```python
async def create_job(self, data: JobCreate, user: User) -> Job:
    """
    Create a new quantum job.

    Args:
        data: Job creation data containing name, type, and provider
        user: The user creating the job

    Returns:
        The created job instance with generated display_id

    Raises:
        ProviderNotEnabledException: If provider not enabled for account
        ValidationError: If job data is invalid
    """
```

### TypeScript (Frontend)

#### Formatting & Linting
- Use **Prettier** for formatting
- Use **ESLint** with TypeScript rules

#### Import Order
Group imports in this order:
```typescript
// React
import { useState, useEffect } from 'react';

// External libraries
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

// Internal absolute imports
import { Button } from '@/components/ui/Button';
import type { Job } from '@/types';

// Relative imports
import { JobCard } from './JobCard';
```

#### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase files and exports | `JobCard.tsx` |
| Hooks | camelCase with `use` prefix | `useJobs.ts` |
| Types/Interfaces | PascalCase | `JobResponse`, `UserState` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| CSS | Tailwind utilities | - |

#### Component Structure
```typescript
// 1. Imports
// 2. Types/Interfaces
// 3. Component
// 4. Exports

interface Props {
  job: Job;
  onSelect?: (job: Job) => void;
}

export function JobCard({ job, onSelect }: Props) {
  // Hooks first
  const [isExpanded, setIsExpanded] = useState(false);

  // Derived state
  const isCompleted = job.status === 'completed';

  // Event handlers
  const handleClick = () => {
    onSelect?.(job);
  };

  // Render
  return (
    <div onClick={handleClick}>
      {/* ... */}
    </div>
  );
}
```

---

## Architecture Patterns

### Backend: Repository Pattern

All database operations go through repository classes:

```python
# repositories/job.py
class JobRepository(BaseRepository[Job]):
    def __init__(self, session: AsyncSession):
        super().__init__(Job, session)

    async def get_by_display_id(self, display_id: str) -> Job | None:
        result = await self.session.execute(
            select(Job).where(Job.display_id == display_id)
        )
        return result.scalar_one_or_none()

    async def list_by_account(
        self,
        account_id: UUID,
        status: list[str] | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Job]:
        query = select(Job).where(Job.account_id == account_id)
        if status:
            query = query.where(Job.status.in_(status))
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
```

### Backend: Service Layer

Business logic lives in service classes:

```python
# services/job.py
class JobService:
    def __init__(self, repository: JobRepository):
        self.repository = repository

    async def submit_job(self, job_id: UUID, user: User) -> Job:
        job = await self.repository.get(job_id)
        if not job:
            raise JobNotFoundException(job_id)
        if job.status != JobStatus.DRAFT:
            raise JobInvalidStateException("Can only submit draft jobs")

        job.status = JobStatus.QUEUED
        job.queued_at = datetime.utcnow()
        await self.repository.update(job)

        # Trigger async execution
        await self.execution_service.execute_async(job)

        return job
```

### Backend: Dependency Injection

Use FastAPI's Depends for consistent dependency injection:

```python
# api/v1/endpoints/jobs.py
@router.post("/{job_id}/submit")
async def submit_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repository = JobRepository(db)
    service = JobService(repository)
    return await service.submit_job(job_id, current_user)
```

### Frontend: React Query for Server State

```typescript
// hooks/useJobs.ts
export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.jobs.list(filters),
    staleTime: 30000, // 30 seconds
  });
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.jobs.get(jobId),
    enabled: !!jobId,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JobCreate) => api.jobs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
```

### Frontend: Zustand for Client State

```typescript
// stores/uiStore.ts
interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    { name: 'quantumcue-ui' }
  )
);
```

---

## Quantum Integration Stubs

### Marking Integration Points

All quantum-related code that requires future implementation must be clearly marked:

```python
class TransformationService:
    """
    INTEGRATION POINT: Quantum Data Transformation

    This service will eventually:
    1. Accept user data (CSV, JSON, etc.)
    2. Parse and validate the data structure
    3. Transform into intermediate representation
    4. Generate QUBO/Ising/Circuit based on problem type

    Currently returns mock transformed data.
    """

    async def transform(self, job: Job, input_data_ref: str) -> dict:
        """
        STUB: Transform user data into quantum-ready format.

        TODO: REPLACE WITH ACTUAL TRANSFORMATION LOGIC
        1. Load data from input_data_ref
        2. Parse based on job.input_data_type
        3. Apply transformation based on job.job_type
        4. Generate QUBO/Ising representation
        """
        logger.info(f"[STUB] Starting transformation for job {job.id}")
        await asyncio.sleep(3)  # Simulate processing
        return self._generate_mock_qubo()
```

### Provider Adapter Pattern

Each quantum provider has its own adapter implementing the base interface:

```python
class QuantumProviderAdapter(ABC):
    """Base class for quantum provider adapters."""

    @abstractmethod
    async def submit_job(self, qubo: dict, params: dict) -> str:
        """Submit job to provider, return provider job ID."""
        pass

    @abstractmethod
    async def get_job_status(self, provider_job_id: str) -> dict:
        """Get job status from provider."""
        pass

    @abstractmethod
    async def get_results(self, provider_job_id: str) -> dict:
        """Get job results from provider."""
        pass


class QCIAdapter(QuantumProviderAdapter):
    """
    INTEGRATION POINT: QCI Provider Adapter

    TODO: Implement actual QCI API integration:
    - Authentication with QCI credentials
    - Job submission via QCI API
    - Status polling
    - Result retrieval and parsing
    """

    async def submit_job(self, qubo: dict, params: dict) -> str:
        logger.info("[STUB] Submitting job to QCI")
        await asyncio.sleep(1)
        return f"qci-job-{random.randint(10000, 99999)}"
```

### Future Real Integration Guidelines

When implementing real quantum integrations:

1. **Keep the adapter interface stable** - Don't change method signatures
2. **Add configuration for credentials** - Use environment variables
3. **Implement proper error handling** - Map provider errors to app errors
4. **Add retry logic** - Quantum APIs may have transient failures
5. **Implement proper result normalization** - Convert provider-specific formats
6. **Add telemetry** - Log execution times, success rates
7. **Consider rate limiting** - Respect provider API limits

---

## Testing Expectations

### Backend Testing

**Unit Tests:**
- Test service methods with mocked repositories
- Test utility functions
- Test Pydantic schema validation

**Integration Tests:**
- Test API endpoints with test database
- Test authentication flows
- Test job lifecycle

```python
# tests/integration/test_jobs.py
@pytest.mark.asyncio
async def test_create_job(
    client: AsyncClient,
    auth_headers: dict,
    test_provider: Provider,
):
    response = await client.post(
        "/api/v1/jobs",
        json={"name": "Test Job", "provider_id": str(test_provider.id)},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Job"
    assert data["display_id"].startswith("QC-")
```

### Frontend Testing

**Component Tests:**
- Test rendering with different props
- Test user interactions
- Test loading/error states

```typescript
// components/jobs/JobCard.test.tsx
describe('JobCard', () => {
  it('renders job information', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText(mockJob.display_id)).toBeInTheDocument();
    expect(screen.getByText(mockJob.name)).toBeInTheDocument();
  });

  it('shows running status with animation', () => {
    const runningJob = { ...mockJob, status: 'running' };
    render(<JobCard job={runningJob} />);

    const badge = screen.getByText('running');
    expect(badge).toHaveClass('animate-pulse');
  });
});
```

---

## Security Considerations

### Authentication
- JWT tokens with 24-hour expiration
- Refresh tokens with 7-day expiration
- Store tokens in localStorage for demo (httpOnly cookies in production)
- Always verify token signature and expiration

### Authorization
- Check user role on every protected endpoint
- Verify resource belongs to user's account
- Use FastAPI dependencies for consistent checks

```python
async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
```

### Data Validation
- Use Pydantic for all input validation
- Sanitize user input before database operations
- Validate file uploads (when implemented)

### Sensitive Data
- Never log passwords or API keys
- Hash passwords with bcrypt
- Encrypt provider API keys at rest
- Use environment variables for secrets

---

## Error Handling

### Backend Error Pattern

```python
# utils/exceptions.py
class AppException(Exception):
    def __init__(self, message: str, code: str, status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code


class JobNotFoundException(AppException):
    def __init__(self, job_id: UUID):
        super().__init__(
            message=f"Job {job_id} not found",
            code="JOB_NOT_FOUND",
            status_code=404,
        )


class JobInvalidStateException(AppException):
    def __init__(self, message: str):
        super().__init__(
            message=message,
            code="JOB_INVALID_STATE",
            status_code=400,
        )


# api/v1/error_handlers.py
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "code": exc.code},
    )
```

### Frontend Error Pattern

```typescript
// api/client.ts
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    const message = error.response?.data?.detail || 'An error occurred';
    useToastStore.getState().addToast({
      type: 'error',
      message,
    });

    return Promise.reject(error);
  }
);
```

---

## Performance Guidelines

### Backend
- Use async/await consistently for all I/O operations
- Batch database operations where possible
- Use database indexes for filtered queries
- Implement pagination for list endpoints (default 20, max 100)
- Cache frequently accessed data (provider status)

### Frontend
- Use React Query for automatic caching and deduplication
- Implement skeleton loaders for better perceived performance
- Lazy load page components with React.lazy()
- Optimize images and assets
- Use proper React keys for lists

### Database
- Add indexes for foreign keys
- Add indexes for frequently filtered columns (status, display_id, created_at)
- Use JSONB for flexible data (chat_history, settings, metadata)

---

## Design System

### Color Palette
```css
/* Background Colors */
--background: #0a0a0b;
--surface: #141415;
--surface-elevated: #1c1c1e;

/* Border Colors */
--border: #2e2e32;
--border-subtle: #232326;

/* Text Colors */
--text-primary: #fafafa;
--text-secondary: #a1a1aa;
--text-tertiary: #71717a;

/* Status Colors */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;

/* Accent Colors */
--quantum-purple: #8b5cf6;
--quantum-cyan: #06b6d4;
```

### Typography
- **Sans-serif:** Inter, system-ui, sans-serif
- **Monospace:** JetBrains Mono, Fira Code, monospace

### Component Patterns
- **Buttons:** Primary (gradient), Secondary (surface), Ghost (transparent)
- **Cards:** Surface background, subtle border, 8px radius
- **Inputs:** Surface background, focus ring with primary color
- **Status Badges:** Pill shape, 10-20% background opacity

---

## Common Commands

```bash
# Development
make dev-setup          # Initial setup
make dev                # Start development
make logs               # View all logs
make logs-backend       # View backend logs

# Database
make migrate            # Run migrations
make migrate-create MSG="description"  # Create migration
make seed               # Seed demo data

# Testing
make test               # Run all tests
make test-cov           # Run with coverage

# Docker
make up                 # Start services
make down               # Stop services
make restart            # Restart services

# Utilities
make shell-backend      # Shell into backend container
make shell-db           # PostgreSQL shell
```

---

## File Organization

### Backend
```
backend/
├── app/
│   ├── api/v1/endpoints/     # One file per resource
│   ├── models/               # One file per model
│   ├── repositories/         # One file per model
│   ├── schemas/              # One file per model
│   ├── services/             # Business logic by domain
│   │   ├── llm/             # LLM-related services
│   │   └── quantum/         # Quantum-related services
│   └── utils/               # Shared utilities
```

### Frontend
```
frontend/src/
├── api/                     # API client and endpoints
├── components/
│   ├── ui/                  # Generic UI components
│   ├── layout/              # Layout components
│   └── [feature]/           # Feature-specific components
├── pages/                   # Page components
├── hooks/                   # Custom hooks
├── stores/                  # Zustand stores
└── types/                   # TypeScript types
```

---

## Reference Documents

- `/docs/quantumcue-prd.md` - Complete Product Requirements Document
- `/docs/APPLICATION_TEMPLATE.md` - Technology stack patterns template
