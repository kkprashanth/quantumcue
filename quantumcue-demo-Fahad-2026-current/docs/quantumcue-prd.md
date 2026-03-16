# QuantumCue Demo - Product Requirements Document

## Executive Summary

QuantumCue is a marketplace and orchestration platform for quantum compute. This PRD defines the requirements for a working demo with complete UI, database, and API layers, with stubbed quantum algorithm integrations. The demo will run locally and deploy to DigitalOcean.

**Target Users**: Enterprise customers seeking to leverage quantum computing for optimization, simulation, and machine learning acceleration.

**Demo Objective**: Demonstrate the end-to-end user experience of uploading data, defining quantum jobs through an AI-guided chat interface, selecting providers, and viewing results.

---

## 1. Technology Stack

### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI 0.109+
- **ASGI Server**: Uvicorn
- **ORM**: SQLAlchemy 2.0+ (async)
- **Database Driver**: asyncpg (PostgreSQL)
- **Migrations**: Alembic 1.13+
- **Validation**: Pydantic 2.5+
- **Settings**: Pydantic Settings 2.1+
- **Authentication**: python-jose with cryptography, passlib with bcrypt
- **HTTP Client**: httpx 0.26+
- **LLM Integration**: Anthropic SDK (with provider-agnostic adapter pattern)

### Frontend
- **Framework**: React 18.2+
- **Language**: TypeScript 5.3+
- **Build Tool**: Vite 5.0+
- **State Management**: TanStack Query 5.17+ (server state), Zustand 4.4+ (client state)
- **Routing**: React Router DOM 6.21+
- **HTTP Client**: Axios 1.6+
- **Styling**: Tailwind CSS 3.4+
- **Charts**: Chart.js 4.5+ with react-chartjs-2
- **Icons**: Lucide React
- **Date Handling**: date-fns 3.2+

### Infrastructure (Demo)
- **Database**: PostgreSQL 15
- **Containerization**: Docker & Docker Compose
- **Deployment**: DigitalOcean App Platform or Droplet

---

## 2. Design System

### 2.1 Design Philosophy
Follow Linear.app design principles:
- Clean, minimal interfaces with generous whitespace
- Subtle shadows and borders
- Smooth micro-interactions and transitions
- Dark mode as primary (with light mode support)
- Monospace fonts for technical data, sans-serif for UI

### 2.2 Color Palette

```css
/* Primary Colors */
--primary-50: #f0f9ff;
--primary-100: #e0f2fe;
--primary-500: #0ea5e9;
--primary-600: #0284c7;
--primary-700: #0369a1;

/* Neutral Colors (Dark Theme) */
--background: #0a0a0b;
--surface: #141415;
--surface-elevated: #1c1c1e;
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

/* Accent (Quantum Theme) */
--quantum-purple: #8b5cf6;
--quantum-blue: #06b6d4;
--quantum-gradient: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
```

### 2.3 Typography

```css
/* Font Families */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### 2.4 Component Patterns

#### Buttons
- **Primary**: Gradient background (quantum-gradient), white text
- **Secondary**: Surface background, primary text, subtle border
- **Ghost**: Transparent, text only, hover shows surface
- **Destructive**: Error color background

#### Cards
- Surface background
- Subtle border (border-subtle)
- 8px border radius
- Hover state with elevated surface + slight shadow

#### Inputs
- Surface background
- Border on focus (primary-500)
- Placeholder text in text-tertiary
- Error state with error border

#### Status Badges
- Pill shape (full border radius)
- Background opacity at 10-20%
- Text in full color
- Draft: text-secondary
- Queued: info
- Running: warning (with pulse animation)
- Completed: success
- Failed: error

### 2.5 Logo Specifications

#### Full Logo
- Text: "QuantumCue" with quantum-gradient on "Quantum" and white on "Cue"
- Icon: Stylized "Q" made of interconnected nodes (representing qubits)
- Usage: Login page, expanded sidebar header

#### Compact Logo
- "QC" initials with quantum-gradient
- Geometric design suggesting quantum superposition
- Usage: Collapsed sidebar, favicon, loading states

---

## 3. Authentication & Authorization

### 3.1 Authentication Flow

#### Login Page
- Branded page with full logo centered
- Email/password form
- "Remember me" checkbox
- "Forgot password" link (stubbed)
- SSO buttons (Google, Microsoft, Okta) - disabled with "Coming Soon" tooltip
- Footer with "Enterprise SSO? Contact Sales"

#### Session Management
- JWT tokens with 24-hour expiration
- Refresh token rotation (7-day expiration)
- Token stored in httpOnly cookies (production) or localStorage (demo)
- Automatic token refresh on API calls

#### Logout
- Clear all tokens
- Invalidate session server-side
- Redirect to login page

### 3.2 Authorization Model

#### Roles
| Role | Description | Permissions |
|------|-------------|-------------|
| Admin | Account administrator | Full access to all features including Account, Billing, Settings, User Management |
| User | Standard user | Access to Dashboard, Jobs, Results, Providers, Profile, User Settings, Help |

#### Permission Matrix
| Feature | Admin | User |
|---------|-------|------|
| Dashboard | ✓ | ✓ |
| Jobs (CRUD) | ✓ | ✓ |
| Results | ✓ | ✓ |
| Providers | ✓ | ✓ |
| Profile | ✓ | ✓ |
| User Settings | ✓ | ✓ |
| Account | ✓ | ✗ |
| Billing | ✓ | ✗ |
| Settings (Account-level) | ✓ | ✗ |
| User Management | ✓ | ✗ |

---

## 4. Data Model

### 4.1 Entity Relationship Diagram

```
Account (1) ──────< (N) User
    │
    │ (1)
    │
    └──────< (N) Job ──────< (N) JobAudit
    │              │
    │              └──────< (N) Result
    │
    └──────< (N) ProviderAccount >──────(1) Provider
```

### 4.2 Database Schema

#### Account
```sql
CREATE TABLE account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
    tier VARCHAR(50) DEFAULT 'trial', -- trial, starter, professional, enterprise
    data_budget_bytes BIGINT DEFAULT 1073741824, -- 1GB default
    data_used_bytes BIGINT DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### User
```sql
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user', -- admin, user
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, pending
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_account ON "user"(account_id);
CREATE INDEX idx_user_email ON "user"(email);
```

#### Provider
```sql
CREATE TABLE provider (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- QCI, D-Wave, IonQ
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    documentation_url VARCHAR(500),
    provider_type VARCHAR(50), -- annealer, gate-based, hybrid
    hardware_info JSONB DEFAULT '{}',
    capabilities JSONB DEFAULT '{}', -- supported problem types, max qubits, etc.
    pricing_info JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'available', -- available, degraded, unavailable
    queue_depth INTEGER DEFAULT 0,
    estimated_wait_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### ProviderAccount (Junction)
```sql
CREATE TABLE provider_account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    api_key_encrypted VARCHAR(500), -- encrypted provider API key
    settings JSONB DEFAULT '{}',
    usage_stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id, provider_id)
);

CREATE INDEX idx_provider_account_account ON provider_account(account_id);
```

#### Job
```sql
CREATE TABLE job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES "user"(id),
    provider_id UUID REFERENCES provider(id),
    
    -- Job Identification
    display_id VARCHAR(20) NOT NULL, -- Human-readable ID: QC-XXXXX
    provider_job_id VARCHAR(255), -- ID from quantum provider
    
    -- Job Definition
    name VARCHAR(255) NOT NULL,
    description TEXT,
    job_type VARCHAR(50), -- optimization, simulation, classification, regression
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'draft', -- draft, queued, transforming, submitted, running, completed, failed, cancelled
    status_message TEXT,
    progress_percent INTEGER DEFAULT 0,
    
    -- Data References
    input_data_ref VARCHAR(500), -- S3/storage reference for input
    input_data_size_bytes BIGINT,
    input_data_type VARCHAR(50), -- csv, json, text, document
    
    -- Transformation Data (stubbed)
    transformation_config JSONB DEFAULT '{}',
    qubo_matrix_ref VARCHAR(500), -- Reference to transformed QUBO/Ising
    
    -- Provider Submission
    provider_payload JSONB DEFAULT '{}',
    provider_response JSONB DEFAULT '{}',
    
    -- Timing
    queued_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion_at TIMESTAMP WITH TIME ZONE,
    
    -- Chat History
    chat_history JSONB DEFAULT '[]',
    
    -- Metadata
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_account ON job(account_id);
CREATE INDEX idx_job_status ON job(status);
CREATE INDEX idx_job_display_id ON job(display_id);
CREATE UNIQUE INDEX idx_job_display_id_unique ON job(display_id);
```

#### JobAudit
```sql
CREATE TABLE job_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES job(id) ON DELETE CASCADE,
    user_id UUID REFERENCES "user"(id),
    
    event_type VARCHAR(100) NOT NULL, -- created, status_changed, transformation_started, etc.
    event_data JSONB DEFAULT '{}',
    
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    
    source VARCHAR(50), -- user, system, provider
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_audit_job ON job_audit(job_id);
CREATE INDEX idx_job_audit_created ON job_audit(created_at);
```

#### Result
```sql
CREATE TABLE result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES job(id) ON DELETE CASCADE,
    
    -- Result Identification
    result_type VARCHAR(50), -- primary, intermediate, comparison
    
    -- Result Data (stubbed structure)
    raw_provider_response JSONB DEFAULT '{}',
    normalized_response JSONB DEFAULT '{}',
    
    -- Computed Results
    solution_vector JSONB DEFAULT '[]',
    energy_values JSONB DEFAULT '[]',
    probabilities JSONB DEFAULT '[]',
    
    -- Visualizations
    chart_data JSONB DEFAULT '{}',
    summary_stats JSONB DEFAULT '{}',
    
    -- Execution Stats
    execution_time_ms INTEGER,
    queue_time_ms INTEGER,
    total_shots INTEGER,
    
    -- Storage
    result_file_ref VARCHAR(500), -- Reference to full result file
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_result_job ON result(job_id);
```

### 4.3 Seed Data

#### Providers Seed Data
```json
[
  {
    "name": "QCI",
    "slug": "qci",
    "description": "Quantum Computing Inc. provides full-stack quantum computing solutions with their Dirac series quantum computers optimized for optimization and machine learning problems.",
    "provider_type": "gate-based",
    "website_url": "https://www.quantumcomputinginc.com",
    "documentation_url": "https://www.quantumcomputinginc.com/docs",
    "hardware_info": {
      "qubit_count": 32,
      "qubit_type": "photonic",
      "connectivity": "all-to-all",
      "gate_fidelity": "99.5%"
    },
    "capabilities": {
      "problem_types": ["optimization", "machine_learning", "simulation"],
      "max_variables": 10000,
      "supports_qubo": true,
      "supports_ising": true
    },
    "pricing_info": {
      "model": "per_job",
      "base_cost_usd": 0.01,
      "per_variable_usd": 0.001
    },
    "status": "available",
    "queue_depth": 3,
    "estimated_wait_seconds": 120
  },
  {
    "name": "D-Wave",
    "slug": "dwave",
    "description": "D-Wave Systems is the leader in quantum annealing technology, offering Advantage systems with 5000+ qubits for solving complex optimization problems.",
    "provider_type": "annealer",
    "website_url": "https://www.dwavesys.com",
    "documentation_url": "https://docs.dwavesys.com",
    "hardware_info": {
      "qubit_count": 5627,
      "qubit_type": "superconducting",
      "connectivity": "pegasus",
      "topology": "Pegasus P16"
    },
    "capabilities": {
      "problem_types": ["optimization", "sampling"],
      "max_variables": 5000,
      "supports_qubo": true,
      "supports_ising": true,
      "supports_cqm": true
    },
    "pricing_info": {
      "model": "per_minute",
      "qpu_access_per_minute_usd": 2.00
    },
    "status": "available",
    "queue_depth": 12,
    "estimated_wait_seconds": 45
  },
  {
    "name": "IonQ",
    "slug": "ionq",
    "description": "IonQ builds high-fidelity trapped-ion quantum computers suitable for complex algorithms requiring high gate fidelity and full connectivity.",
    "provider_type": "gate-based",
    "website_url": "https://ionq.com",
    "documentation_url": "https://docs.ionq.com",
    "hardware_info": {
      "qubit_count": 32,
      "qubit_type": "trapped-ion",
      "connectivity": "all-to-all",
      "gate_fidelity": "99.9%",
      "coherence_time": "10+ seconds"
    },
    "capabilities": {
      "problem_types": ["optimization", "simulation", "machine_learning", "circuit_execution"],
      "max_qubits": 32,
      "supports_qasm": true,
      "supports_qir": true
    },
    "pricing_info": {
      "model": "per_shot",
      "per_shot_usd": 0.00003,
      "per_qubit_gate_usd": 0.00022
    },
    "status": "available",
    "queue_depth": 8,
    "estimated_wait_seconds": 90
  }
]
```

---

## 5. API Specifications

### 5.1 API Overview
- Base URL: `/api/v1`
- Authentication: Bearer token (JWT)
- Content-Type: `application/json`
- Error Format: `{ "detail": "message", "code": "ERROR_CODE" }`

### 5.2 Authentication Endpoints

#### POST /api/v1/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "account": {
      "id": "uuid",
      "name": "Acme Corp",
      "slug": "acme-corp"
    }
  }
}
```

#### POST /api/v1/auth/refresh
Refresh access token.

#### POST /api/v1/auth/logout
Invalidate current session.

#### GET /api/v1/auth/me
Get current user profile.

### 5.3 Account Endpoints

#### GET /api/v1/account
Get current account details (Admin only).

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "status": "active",
  "tier": "professional",
  "data_budget_bytes": 10737418240,
  "data_used_bytes": 1073741824,
  "settings": {},
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### PATCH /api/v1/account
Update account details (Admin only).

#### GET /api/v1/account/users
List users in account (Admin only).

#### POST /api/v1/account/users
Create new user (Admin only).

#### PATCH /api/v1/account/users/{user_id}
Update user (Admin only).

#### DELETE /api/v1/account/users/{user_id}
Deactivate user (Admin only).

### 5.4 User Endpoints

#### GET /api/v1/users/me
Get current user profile.

#### PATCH /api/v1/users/me
Update current user profile.

#### PATCH /api/v1/users/me/password
Change password.

#### PATCH /api/v1/users/me/preferences
Update user preferences.

### 5.5 Provider Endpoints

#### GET /api/v1/providers
List all providers with account-specific enablement status.

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "QCI",
      "slug": "qci",
      "description": "...",
      "provider_type": "gate-based",
      "status": "available",
      "queue_depth": 3,
      "estimated_wait_seconds": 120,
      "is_enabled_for_account": true,
      "capabilities": {...},
      "hardware_info": {...}
    }
  ]
}
```

#### GET /api/v1/providers/{provider_id}
Get provider details.

#### GET /api/v1/providers/{provider_id}/status
Get real-time provider status (mock for demo).

### 5.6 Job Endpoints

#### GET /api/v1/jobs
List jobs with filtering and pagination.

**Query Parameters:**
- `status`: Filter by status (comma-separated)
- `provider_id`: Filter by provider
- `search`: Search in name/description
- `sort`: Sort field (created_at, updated_at, name)
- `order`: asc/desc
- `page`: Page number (default 1)
- `page_size`: Items per page (default 20, max 100)

**Response (200):**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "pages": 5
}
```

#### POST /api/v1/jobs
Create new job.

**Request:**
```json
{
  "name": "Optimization Run 1",
  "description": "Portfolio optimization",
  "job_type": "optimization",
  "provider_id": "uuid"
}
```

#### GET /api/v1/jobs/{job_id}
Get job details.

#### PATCH /api/v1/jobs/{job_id}
Update job (only draft status).

#### DELETE /api/v1/jobs/{job_id}
Delete job (only draft/failed status).

#### POST /api/v1/jobs/{job_id}/submit
Submit job for execution.

#### POST /api/v1/jobs/{job_id}/cancel
Cancel running job.

#### GET /api/v1/jobs/{job_id}/audit
Get job audit trail.

### 5.7 Job Chat Endpoints

#### POST /api/v1/jobs/{job_id}/chat
Send message to job chat (LLM interaction).

**Request:**
```json
{
  "message": "I want to optimize my portfolio allocation",
  "attachments": []
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "role": "assistant",
  "content": "I can help you with portfolio optimization...",
  "suggestions": [
    {"type": "action", "label": "Upload portfolio data", "action": "upload"},
    {"type": "question", "label": "What constraints do you have?"}
  ],
  "job_updates": {
    "job_type": "optimization",
    "transformation_config": {...}
  }
}
```

#### GET /api/v1/jobs/{job_id}/chat
Get chat history.

### 5.8 Results Endpoints

#### GET /api/v1/jobs/{job_id}/results
Get job results.

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "result_type": "primary",
      "solution_vector": [...],
      "energy_values": [...],
      "summary_stats": {
        "best_energy": -142.5,
        "average_energy": -138.2,
        "num_solutions": 100
      },
      "chart_data": {
        "energy_histogram": {...},
        "solution_distribution": {...}
      },
      "execution_time_ms": 1250
    }
  ]
}
```

#### POST /api/v1/jobs/{job_id}/results/chat
Chat with results (LLM interaction).

**Request:**
```json
{
  "message": "What does this result mean for my portfolio?"
}
```

### 5.9 Dashboard Endpoints

#### GET /api/v1/dashboard/stats
Get dashboard statistics.

**Response (200):**
```json
{
  "jobs": {
    "total": 150,
    "completed": 120,
    "running": 5,
    "queued": 10,
    "draft": 15
  },
  "data_usage": {
    "budget_bytes": 10737418240,
    "used_bytes": 1073741824,
    "percentage": 10
  },
  "recent_jobs": [...],
  "provider_status": [
    {
      "provider_id": "uuid",
      "name": "QCI",
      "status": "available",
      "queue_depth": 3,
      "estimated_wait_seconds": 120
    }
  ]
}
```

### 5.10 File Upload Endpoints (Stubbed)

#### POST /api/v1/upload/presigned
Get presigned URL for file upload (stubbed).

**Request:**
```json
{
  "filename": "data.csv",
  "content_type": "text/csv",
  "size_bytes": 1048576
}
```

**Response (200):**
```json
{
  "upload_url": "https://storage.example.com/presigned...",
  "file_ref": "uploads/uuid/data.csv",
  "expires_at": "2024-01-01T01:00:00Z"
}
```

---

## 6. Frontend Architecture

### 6.1 Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts           # Axios instance with interceptors
│   │   ├── endpoints/
│   │   │   ├── auth.ts
│   │   │   ├── jobs.ts
│   │   │   ├── providers.ts
│   │   │   ├── results.ts
│   │   │   └── dashboard.ts
│   │   └── types.ts            # API request/response types
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── PageContainer.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── chat/
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── ChatSuggestions.tsx
│   │   ├── jobs/
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobList.tsx
│   │   │   ├── JobStatusBadge.tsx
│   │   │   └── JobFilters.tsx
│   │   ├── results/
│   │   │   ├── ResultsChart.tsx
│   │   │   ├── ResultsTable.tsx
│   │   │   └── ResultsSummary.tsx
│   │   ├── providers/
│   │   │   ├── ProviderCard.tsx
│   │   │   └── ProviderStatusIndicator.tsx
│   │   └── dashboard/
│   │       ├── StatsCard.tsx
│   │       ├── UsageChart.tsx
│   │       └── ProviderStatusPanel.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useJobs.ts
│   │   ├── useProviders.ts
│   │   └── useChat.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Jobs/
│   │   │   ├── JobsList.tsx
│   │   │   ├── JobDetail.tsx
│   │   │   └── JobCreate.tsx
│   │   ├── Results/
│   │   │   └── ResultsView.tsx
│   │   ├── Providers/
│   │   │   ├── ProvidersList.tsx
│   │   │   └── ProviderDetail.tsx
│   │   ├── Account/
│   │   │   ├── AccountSettings.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   └── Billing.tsx
│   │   └── Settings/
│   │       ├── UserSettings.tsx
│   │       └── Profile.tsx
│   ├── stores/
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   ├── styles/
│   │   └── globals.css
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── format.ts
│   │   └── validation.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── logo.svg
│   ├── logo-compact.svg
│   └── favicon.ico
└── ...config files
```

### 6.2 Routing Structure

```typescript
const routes = [
  { path: '/login', element: <Login />, public: true },
  { 
    path: '/', 
    element: <MainLayout />,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'jobs', element: <JobsList /> },
      { path: 'jobs/new', element: <JobCreate /> },
      { path: 'jobs/:jobId', element: <JobDetail /> },
      { path: 'jobs/:jobId/results', element: <ResultsView /> },
      { path: 'results', element: <ResultsList /> },
      { path: 'providers', element: <ProvidersList /> },
      { path: 'providers/:providerId', element: <ProviderDetail /> },
      { path: 'account', element: <AccountSettings />, adminOnly: true },
      { path: 'billing', element: <Billing />, adminOnly: true },
      { path: 'settings', element: <Settings /> },
      { path: 'profile', element: <Profile /> },
      { path: 'help', element: <Help /> },
    ]
  }
];
```

---

## 7. Page Specifications

### 7.1 Login Page

**Layout:**
- Centered card on dark gradient background
- Full QuantumCue logo at top
- Email input with mail icon
- Password input with lock icon, show/hide toggle
- "Remember me" checkbox
- Primary "Sign In" button
- "Forgot password?" link (disabled, shows "Coming Soon")
- Divider with "or continue with"
- SSO buttons row (Google, Microsoft, Okta) - disabled with tooltips
- Footer: "Enterprise SSO? Contact Sales"

**Interactions:**
- Form validation on blur and submit
- Loading state on submit
- Error display below form
- Redirect to Dashboard on success

### 7.2 Main Layout

**Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] QuantumCue                          [User Avatar ▼]  │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ Sidebar  │              Page Content                        │
│          │                                                  │
│ Dashboard│                                                  │
│ Jobs     │                                                  │
│ Results  │                                                  │
│ Providers│                                                  │
│          │                                                  │
│ ──────── │                                                  │
│ Account* │                                                  │
│ Billing* │                                                  │
│ Settings │                                                  │
│ Help     │                                                  │
│          │                                                  │
│ [Collapse│                                                  │
│  Button] │                                                  │
└──────────┴──────────────────────────────────────────────────┘
* Admin only
```

**Sidebar Behavior:**
- Collapsible (stores preference in localStorage)
- Collapsed: Show icons only with tooltips
- Expanded: Icons + labels
- Smooth transition animation (200ms)
- Active state: Background highlight + left border accent

**User Menu (Top Right):**
- Avatar with first initial or image
- Dropdown on click:
  - Profile
  - User Settings
  - Help
  - Divider
  - Logout

### 7.3 Dashboard Page

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard                              [+ Create New Job]   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────────┐ │
│ │Completed│ │ Running │ │ Queued  │ │   Data Budget       │ │
│ │   120   │ │    5    │ │   10    │ │ ████████░░ 45%      │ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Provider Status                                             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │ QCI          │ │ D-Wave       │ │ IonQ         │         │
│ │ ● Available  │ │ ● Available  │ │ ● Available  │         │
│ │ Queue: 3     │ │ Queue: 12    │ │ Queue: 8     │         │
│ │ ~2 min wait  │ │ ~45s wait    │ │ ~90s wait    │         │
│ └──────────────┘ └──────────────┘ └──────────────┘         │
├─────────────────────────────────────────────────────────────┤
│ Recent Jobs                                    [View All →] │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ QC-00142 │ Portfolio Optimization │ ● Completed │ View  │ │
│ │ QC-00141 │ Supply Chain Analysis  │ ● Running   │       │ │
│ │ QC-00140 │ Risk Assessment        │ ● Queued    │       │ │
│ │ QC-00139 │ Resource Allocation    │ ○ Draft     │ Edit  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- Stats Cards: Animated counters on load
- Data Budget: Progress bar with percentage
- Provider Status Cards: Status indicator (green/yellow/red dot), queue depth, estimated wait
- Recent Jobs List: Clickable rows, status badges, action buttons

### 7.4 Jobs List Page

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Jobs                                   [+ Create New Job]   │
├─────────────────────────────────────────────────────────────┤
│ [Search...          ] [Status ▼] [Provider ▼] [Sort ▼]     │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ □ │ QC-00142 │ Portfolio Opt... │ QCI │ ● Completed │...│ │
│ │ □ │ QC-00141 │ Supply Chain...  │D-Wave│ ● Running  │...│ │
│ │ □ │ QC-00140 │ Risk Assessment  │ IonQ │ ● Queued   │...│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Showing 1-20 of 150                    [< 1 2 3 ... 8 >]   │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Search with debounce (300ms)
- Multi-select filters
- Sortable columns
- Pagination
- Bulk actions (delete draft jobs)
- Click row to view details

### 7.5 Job Create Page (Chat-First Interface)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ New Job                                                     │
├───────────────────────────────────┬─────────────────────────┤
│                                   │ Job Configuration       │
│   QuantumCue Quantum Consultant   │ ─────────────────────── │
│                                   │ Name: [            ]    │
│   ┌───────────────────────────┐   │ Type: [Optimization ▼]  │
│   │ 🤖 Hello! I'm your        │   │ Provider: [Select... ▼] │
│   │ Quantum Consultant. I'll  │   │                         │
│   │ help you set up your      │   │ Status: Draft           │
│   │ quantum computing job.    │   │                         │
│   │                           │   │ ─────────────────────── │
│   │ What problem would you    │   │ Attached Files          │
│   │ like to solve today?      │   │ └ No files attached     │
│   └───────────────────────────┘   │                         │
│                                   │ ─────────────────────── │
│   ┌───────────────────────────┐   │ Estimated Cost          │
│   │ [Suggested prompts]       │   │ $0.00 - $0.00          │
│   │ • Optimize my portfolio   │   │                         │
│   │ • Solve routing problem   │   │ Estimated Time          │
│   │ • Train ML model faster   │   │ -- minutes              │
│   └───────────────────────────┘   │                         │
│                                   │                         │
│ ┌───────────────────────────────┐ │ ┌─────────────────────┐ │
│ │ Type your message...    [📎] │ │ │   Submit Job        │ │
│ └───────────────────────────────┘ │ └─────────────────────┘ │
└───────────────────────────────────┴─────────────────────────┘
```

**Chat Interface Features:**
- Message bubbles (user right-aligned, assistant left-aligned)
- Typing indicator with animated dots
- Suggested prompts/actions as clickable chips
- File attachment button (📎) - opens file picker (stubbed)
- Auto-scroll to bottom on new messages
- Markdown rendering in assistant messages
- Code blocks with syntax highlighting

**Side Panel Features:**
- Auto-updates based on chat context
- Job name editable
- Job type dropdown (populated by LLM suggestions)
- Provider selection (shows enabled providers)
- File list with remove option
- Cost/time estimates (mock calculations)
- Submit button (disabled until required fields complete)

### 7.6 Job Detail Page

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Jobs         QC-00142: Portfolio Optimization     │
├───────────────────────────────────┬─────────────────────────┤
│ Chat History                      │ Job Details             │
│ ─────────────────────────────     │ ─────────────────────── │
│ [Full chat history from creation] │ Status: ● Completed     │
│                                   │ Provider: QCI           │
│                                   │ Type: Optimization      │
│                                   │ Created: Jan 1, 2024    │
│                                   │ Completed: Jan 1, 2024  │
│                                   │                         │
│                                   │ ─────────────────────── │
│                                   │ Execution Stats         │
│                                   │ Queue Time: 45s         │
│                                   │ Execution: 12s          │
│                                   │ Total: 57s              │
│                                   │                         │
│                                   │ ─────────────────────── │
│                                   │ [View Results →]        │
│                                   │ [Download Data]         │
│                                   │ [View Audit Log]        │
└───────────────────────────────────┴─────────────────────────┘
```

**Status-Specific Views:**
- **Draft**: Show chat interface, allow editing, Submit button
- **Queued/Running**: Show progress indicator, estimated completion
- **Completed**: Show summary stats, link to results
- **Failed**: Show error message, retry option

### 7.7 Results View Page

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Job          Results: QC-00142                    │
├─────────────────────────────────────────────────────────────┤
│ [Summary] [Charts] [Data] [Chat]                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Summary Tab:                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Best Solution Found                                     │ │
│ │ ───────────────────                                     │ │
│ │ Energy: -142.5 | Probability: 23.4%                     │ │
│ │ Variables: [1, 0, 1, 1, 0, 0, 1, ...] (truncated)      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────┐ ┌───────────────────────┐        │
│ │ Solutions Found: 100  │ │ Execution Time: 12s   │        │
│ │ Unique Solutions: 45  │ │ Total Shots: 1000     │        │
│ └───────────────────────┘ └───────────────────────┘        │
│                                                             │
│ Charts Tab:                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Energy Distribution Histogram]                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Solution Probability Distribution]                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Data Tab:                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Sortable/filterable table of all solutions]            │ │
│ │ [Export CSV] [Export JSON]                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Chat Tab:                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Ask questions about your results...                     │ │
│ │ "What does the best solution mean for my portfolio?"    │ │
│ │ "Show me solutions with energy below -140"              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 7.8 Providers List Page

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Quantum Providers                                           │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐   │
│ │ [QCI Logo]                                            │   │
│ │ QCI - Quantum Computing Inc.            ● Available   │   │
│ │ Full-stack quantum computing solutions...             │   │
│ │ Type: Gate-based | Qubits: 32 | Queue: 3 jobs        │   │
│ │                                    [View Details →]   │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ [D-Wave Logo]                                         │   │
│ │ D-Wave Systems                          ● Available   │   │
│ │ Leader in quantum annealing technology...             │   │
│ │ Type: Annealer | Qubits: 5627 | Queue: 12 jobs       │   │
│ │                                    [View Details →]   │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ [IonQ Logo]                              (Disabled)   │   │
│ │ IonQ                                    ○ Unavailable │   │
│ │ High-fidelity trapped-ion quantum computers...        │   │
│ │ Type: Gate-based | Qubits: 32                        │   │
│ │                              [Contact Sales to Enable]│   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 7.9 Provider Detail Page

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Providers                                         │
├─────────────────────────────────────────────────────────────┤
│ [QCI Logo]  QCI - Quantum Computing Inc.      ● Available   │
│ ─────────────────────────────────────────────────────────── │
│ Full-stack quantum computing solutions with Dirac series    │
│ quantum computers optimized for optimization and ML.        │
│                                                             │
│ [Website ↗] [Documentation ↗]                              │
├─────────────────────────────────────────────────────────────┤
│ Hardware Specifications                                     │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐      │
│ │ Qubit Count   │ │ Qubit Type    │ │ Connectivity  │      │
│ │ 32            │ │ Photonic      │ │ All-to-All    │      │
│ └───────────────┘ └───────────────┘ └───────────────┘      │
├─────────────────────────────────────────────────────────────┤
│ Capabilities                                                │
│ • Optimization problems (QUBO, Ising)                       │
│ • Machine learning acceleration                             │
│ • Quantum simulation                                        │
│ • Max variables: 10,000                                     │
├─────────────────────────────────────────────────────────────┤
│ Pricing                                                     │
│ Base cost: $0.01 per job                                   │
│ Per variable: $0.001                                       │
├─────────────────────────────────────────────────────────────┤
│ Current Status                                              │
│ Queue Depth: 3 jobs | Estimated Wait: ~2 minutes           │
└─────────────────────────────────────────────────────────────┘
```

### 7.10 Account Page (Admin Only)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Account Settings                                            │
├─────────────────────────────────────────────────────────────┤
│ [General] [Users] [API Keys] [Integrations]                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ General Tab:                                                │
│ Account Name: [Acme Corporation        ]                   │
│ Account Slug: acme-corp (read-only)                        │
│ Tier: Professional                                          │
│ Status: Active                                              │
│                                           [Save Changes]    │
│                                                             │
│ Users Tab:                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Email            │ Name      │ Role  │ Status │ Actions│ │
│ │ admin@acme.com   │ John Doe  │ Admin │ Active │ Edit   │ │
│ │ user@acme.com    │ Jane Doe  │ User  │ Active │ Edit   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                          [+ Invite User]    │
└─────────────────────────────────────────────────────────────┘
```

### 7.11 Billing Page (Admin Only - Stubbed)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Billing & Usage                                             │
├─────────────────────────────────────────────────────────────┤
│ Current Plan: Professional                [Upgrade Plan]    │
│                                                             │
│ Usage This Month                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Jobs Executed: 45                                       │ │
│ │ Compute Time: 12.5 hours                               │ │
│ │ Data Processed: 2.3 GB                                 │ │
│ │ Estimated Cost: $234.56                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Usage chart placeholder]                                   │
│                                                             │
│ Invoices                                                    │
│ Coming soon...                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. LLM Integration

### 8.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     LLM Service Layer                       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐                                             │
│ │  LLM Router │ ← Provider-agnostic interface               │
│ └──────┬──────┘                                             │
│        │                                                    │
│ ┌──────┴──────────────────────────────────────────────┐     │
│ │                    LLM Adapters                      │    │
│ │ ┌───────────┐ ┌───────────┐ ┌───────────┐          │     │
│ │ │ Anthropic │ │  OpenAI   │ │  Custom   │          │     │
│ │ │  Adapter  │ │  Adapter  │ │  Adapter  │          │     │
│ │ └───────────┘ └───────────┘ └───────────┘          │     │
│ └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Provider-Agnostic Interface

```python
# app/services/llm/base.py
from abc import ABC, abstractmethod
from typing import AsyncIterator
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str

class ChatResponse(BaseModel):
    content: str
    suggestions: list[dict] | None = None
    job_updates: dict | None = None
    usage: dict | None = None

class LLMProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        messages: list[ChatMessage],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> ChatResponse:
        pass
    
    @abstractmethod
    async def chat_stream(
        self,
        messages: list[ChatMessage],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> AsyncIterator[str]:
        pass
```

### 8.3 Anthropic Adapter (Primary)

```python
# app/services/llm/anthropic_adapter.py
import anthropic
from .base import LLMProvider, ChatMessage, ChatResponse

class AnthropicAdapter(LLMProvider):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = model
    
    async def chat(
        self,
        messages: list[ChatMessage],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> ChatResponse:
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt or "",
            messages=[{"role": m.role, "content": m.content} for m in messages],
        )
        
        return ChatResponse(
            content=response.content[0].text,
            usage={
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            }
        )
```

### 8.4 System Prompts

#### Quantum Consultant (Job Creation)

```python
QUANTUM_CONSULTANT_SYSTEM_PROMPT = """
You are the QuantumCue Quantum Consultant, an expert AI assistant helping users 
define and configure quantum computing jobs. Your role is to:

1. UNDERSTAND the user's problem domain and goals
2. GUIDE them toward the right type of quantum computation
3. HELP them specify constraints, objectives, and parameters
4. RECOMMEND appropriate quantum providers based on their needs

## Your Knowledge Areas
- Optimization problems (portfolio, routing, scheduling, resource allocation)
- Machine learning acceleration (training, inference, feature selection)
- Quantum simulation (molecular, materials, financial)
- Combinatorial problems (satisfiability, graph problems)

## Conversation Flow
1. Greet the user and ask what problem they want to solve
2. Ask clarifying questions to understand:
   - Problem type and domain
   - Data they have available
   - Constraints they need to satisfy
   - Objective they want to optimize
3. Once understood, provide:
   - Recommended job type
   - Suggested provider(s)
   - What data format they should upload
   - Any preprocessing needed

## Response Format
Always structure your responses to be helpful and actionable. When you have 
enough information to configure the job, include a JSON block in your response:

```json
{
  "job_updates": {
    "name": "suggested job name",
    "job_type": "optimization|simulation|classification|regression",
    "description": "auto-generated description",
    "recommended_provider": "qci|dwave|ionq"
  },
  "suggestions": [
    {"type": "action", "label": "Upload your data", "action": "upload"},
    {"type": "question", "label": "What constraints do you have?"}
  ]
}
```

## Guidelines
- Be concise but thorough
- Use analogies to explain quantum concepts
- Always validate user understanding before proceeding
- If unsure, ask clarifying questions
- Never make promises about specific results or accuracy
- Be honest about current quantum computing limitations
"""
```

#### Results Assistant

```python
RESULTS_ASSISTANT_SYSTEM_PROMPT = """
You are the QuantumCue Results Assistant, helping users understand and interpret 
their quantum computation results. You have access to:

- The job configuration and parameters
- The full results including solution vectors, energies, and statistics
- Historical context from the job creation chat

## Your Capabilities
1. EXPLAIN what the results mean in the context of the user's problem
2. HIGHLIGHT key findings and optimal solutions
3. COMPARE different solutions and their trade-offs
4. SUGGEST next steps or follow-up analyses
5. ANSWER questions about specific data points

## Response Guidelines
- Translate technical quantum results into business/domain language
- Use the user's original problem framing
- Provide specific numbers and percentages
- Suggest visualizations when helpful
- Be honest about uncertainty and confidence levels

## Context Available
The following job and result data is available to reference:
{job_context}
{result_context}
"""
```

### 8.5 LLM Service Implementation

```python
# app/services/llm/service.py
from .base import LLMProvider, ChatMessage, ChatResponse
from .anthropic_adapter import AnthropicAdapter
from app.config import get_settings
import json
import re

class LLMService:
    def __init__(self):
        settings = get_settings()
        self.provider = AnthropicAdapter(
            api_key=settings.ANTHROPIC_API_KEY,
            model=settings.LLM_MODEL
        )
    
    async def job_chat(
        self,
        messages: list[dict],
        job_context: dict | None = None,
    ) -> ChatResponse:
        """Handle chat for job creation/configuration."""
        chat_messages = [ChatMessage(**m) for m in messages]
        
        response = await self.provider.chat(
            messages=chat_messages,
            system_prompt=QUANTUM_CONSULTANT_SYSTEM_PROMPT,
            temperature=0.7,
        )
        
        # Parse any embedded JSON for job updates
        response = self._extract_structured_data(response)
        
        return response
    
    async def results_chat(
        self,
        messages: list[dict],
        job_context: dict,
        result_context: dict,
    ) -> ChatResponse:
        """Handle chat for results interpretation."""
        chat_messages = [ChatMessage(**m) for m in messages]
        
        system_prompt = RESULTS_ASSISTANT_SYSTEM_PROMPT.format(
            job_context=json.dumps(job_context, indent=2),
            result_context=json.dumps(result_context, indent=2),
        )
        
        response = await self.provider.chat(
            messages=chat_messages,
            system_prompt=system_prompt,
            temperature=0.5,  # Lower temperature for factual responses
        )
        
        return response
    
    def _extract_structured_data(self, response: ChatResponse) -> ChatResponse:
        """Extract JSON blocks from response content."""
        json_pattern = r'```json\s*(.*?)\s*```'
        matches = re.findall(json_pattern, response.content, re.DOTALL)
        
        if matches:
            try:
                data = json.loads(matches[0])
                response.job_updates = data.get("job_updates")
                response.suggestions = data.get("suggestions")
                # Remove JSON block from display content
                response.content = re.sub(json_pattern, '', response.content).strip()
            except json.JSONDecodeError:
                pass
        
        return response
```

### 8.6 Environment Configuration

```env
# LLM Configuration
ANTHROPIC_API_KEY=your-api-key-here
LLM_MODEL=claude-sonnet-4-20250514
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2000

# Future providers (stubbed)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4-turbo
```

---

## 9. Quantum Algorithm Stubs

### 9.1 Overview

The quantum transformation and provider integration layers are stubbed with mock implementations. These stubs simulate the processing pipeline and return realistic mock data.

### 9.2 Transformation Service (Stubbed)

```python
# app/services/quantum/transformation.py
"""
STUB: Quantum Transformation Service

This service will eventually:
1. Accept user data (CSV, JSON, etc.)
2. Parse and validate the data structure
3. Transform into intermediate representation
4. Generate QUBO/Ising/Circuit based on problem type

Currently returns mock transformed data.
"""

import asyncio
from uuid import UUID
from typing import Any
from app.models.job import Job
from app.utils.logger import logger

class TransformationService:
    """
    INTEGRATION POINT: Quantum Data Transformation
    
    This class should be replaced with actual transformation logic that:
    - Parses uploaded data files
    - Extracts relevant features/variables
    - Builds constraint matrices
    - Generates objective functions
    - Produces QUBO/Ising/Circuit representations
    
    Reference: Patent application - "Quantum Computing for Accelerating 
    Machine Learning Model Training" (PCT/US24/36157)
    """
    
    async def transform(
        self,
        job: Job,
        input_data_ref: str,
    ) -> dict[str, Any]:
        """
        Transform user data into quantum-ready format.
        
        STUB: Simulates transformation with delay and mock output.
        
        Args:
            job: The job being processed
            input_data_ref: Reference to uploaded data
            
        Returns:
            dict containing:
                - qubo_matrix: The QUBO representation
                - num_variables: Number of binary variables
                - metadata: Transformation metadata
        """
        logger.info(f"[STUB] Starting transformation for job {job.id}")
        
        # Simulate transformation time (2-5 seconds)
        await asyncio.sleep(3)
        
        # TODO: REPLACE WITH ACTUAL TRANSFORMATION LOGIC
        # 1. Load data from input_data_ref
        # 2. Parse based on job.input_data_type
        # 3. Apply transformation based on job.job_type
        # 4. Generate QUBO/Ising representation
        
        # Mock QUBO matrix (small example)
        num_variables = 10
        qubo_matrix = self._generate_mock_qubo(num_variables)
        
        logger.info(f"[STUB] Transformation complete for job {job.id}")
        
        return {
            "qubo_matrix": qubo_matrix,
            "num_variables": num_variables,
            "metadata": {
                "transformation_type": "mock",
                "original_features": 50,
                "reduced_features": num_variables,
                "sparsity": 0.3,
            }
        }
    
    def _generate_mock_qubo(self, n: int) -> dict:
        """Generate a mock QUBO matrix."""
        import random
        qubo = {}
        for i in range(n):
            # Diagonal terms
            qubo[(i, i)] = random.uniform(-2, 2)
            # Off-diagonal terms (sparse)
            for j in range(i + 1, n):
                if random.random() < 0.3:  # 30% connectivity
                    qubo[(i, j)] = random.uniform(-1, 1)
        return qubo


class QUBOBuilder:
    """
    INTEGRATION POINT: QUBO Matrix Construction
    
    Build QUBO matrices from different problem types:
    - Optimization: Convert objective + constraints to QUBO
    - ML Training: Jacobian-based weight updates (per patent)
    - Classification: Feature selection QUBO
    """
    
    def from_optimization(
        self,
        objective: dict,
        constraints: list[dict],
        penalty_weight: float = 1.0,
    ) -> dict:
        """
        STUB: Build QUBO from optimization problem.
        
        TODO: Implement actual QUBO construction:
        1. Convert linear objective to diagonal terms
        2. Convert quadratic objective to off-diagonal terms
        3. Add penalty terms for constraints
        """
        logger.info("[STUB] Building QUBO from optimization problem")
        return {"stub": True}
    
    def from_ml_jacobian(
        self,
        jacobian_matrix: Any,
        loss_vector: Any,
        precision_bits: int = 5,
    ) -> dict:
        """
        STUB: Build QUBO from ML Jacobian (per patent method).
        
        TODO: Implement the patented method:
        1. Binarize weight updates: Sj = sum(2^k * x_jk) - delta
        2. Expand Q = ||J*S + L||^2 over binary variables
        3. Extract coefficients for QUBO
        
        Reference: Patent equations (3), (4) from specification
        """
        logger.info("[STUB] Building QUBO from Jacobian matrix")
        return {"stub": True}
```

### 9.3 Provider Adapter Service (Stubbed)

```python
# app/services/quantum/providers/base.py
"""
STUB: Quantum Provider Adapters

These adapters handle communication with quantum hardware providers.
Currently returns mock responses simulating quantum execution.
"""

from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID
import asyncio
import random

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
        await asyncio.sleep(1)  # Simulate API call
        return f"qci-job-{random.randint(10000, 99999)}"
    
    async def get_job_status(self, provider_job_id: str) -> dict:
        logger.info(f"[STUB] Getting status for QCI job {provider_job_id}")
        return {"status": "completed", "progress": 100}
    
    async def get_results(self, provider_job_id: str) -> dict:
        logger.info(f"[STUB] Getting results for QCI job {provider_job_id}")
        return self._generate_mock_results()
    
    def _generate_mock_results(self) -> dict:
        """Generate realistic mock quantum results."""
        num_solutions = 100
        num_variables = 10
        
        solutions = []
        for _ in range(num_solutions):
            solution = [random.randint(0, 1) for _ in range(num_variables)]
            energy = sum(
                -2 * solution[i] + random.uniform(-0.5, 0.5)
                for i in range(num_variables)
            )
            solutions.append({
                "vector": solution,
                "energy": round(energy, 4),
                "num_occurrences": random.randint(1, 50),
            })
        
        # Sort by energy
        solutions.sort(key=lambda x: x["energy"])
        
        return {
            "solutions": solutions,
            "timing": {
                "total_time_ms": random.randint(10000, 30000),
                "qpu_time_ms": random.randint(100, 500),
                "post_processing_ms": random.randint(50, 200),
            },
            "metadata": {
                "num_reads": 1000,
                "num_variables": num_variables,
            }
        }


class DWaveAdapter(QuantumProviderAdapter):
    """
    INTEGRATION POINT: D-Wave Provider Adapter
    
    TODO: Implement actual D-Wave Ocean SDK integration:
    - BQM construction
    - Sampler configuration
    - Embedding and topology mapping
    - Result interpretation
    """
    
    async def submit_job(self, qubo: dict, params: dict) -> str:
        logger.info("[STUB] Submitting job to D-Wave")
        await asyncio.sleep(1)
        return f"dwave-job-{random.randint(10000, 99999)}"
    
    async def get_job_status(self, provider_job_id: str) -> dict:
        return {"status": "completed", "progress": 100}
    
    async def get_results(self, provider_job_id: str) -> dict:
        return self._generate_mock_results()
    
    def _generate_mock_results(self) -> dict:
        # Similar to QCI but with D-Wave specific format
        return QCIAdapter()._generate_mock_results()


class IonQAdapter(QuantumProviderAdapter):
    """
    INTEGRATION POINT: IonQ Provider Adapter
    
    TODO: Implement actual IonQ API integration:
    - Circuit generation (QASM/QIR)
    - Job submission via IonQ API
    - Shot-based result retrieval
    """
    
    async def submit_job(self, qubo: dict, params: dict) -> str:
        logger.info("[STUB] Submitting job to IonQ")
        await asyncio.sleep(1)
        return f"ionq-job-{random.randint(10000, 99999)}"
    
    async def get_job_status(self, provider_job_id: str) -> dict:
        return {"status": "completed", "progress": 100}
    
    async def get_results(self, provider_job_id: str) -> dict:
        return self._generate_mock_results()
    
    def _generate_mock_results(self) -> dict:
        return QCIAdapter()._generate_mock_results()
```

### 9.4 Job Execution Service (Stubbed)

```python
# app/services/quantum/execution.py
"""
STUB: Job Execution Orchestrator

Manages the full lifecycle of quantum job execution:
1. Transformation
2. Provider submission
3. Status monitoring
4. Result retrieval
5. Result normalization
"""

import asyncio
from uuid import UUID
from datetime import datetime, timezone
from app.models.job import Job, JobStatus
from app.services.quantum.transformation import TransformationService
from app.services.quantum.providers.base import (
    QCIAdapter, DWaveAdapter, IonQAdapter
)
from app.utils.logger import logger

class JobExecutionService:
    """
    INTEGRATION POINT: Job Execution Orchestrator
    
    This orchestrates the full quantum job pipeline.
    Currently uses mock implementations but structure is production-ready.
    """
    
    def __init__(self):
        self.transformation_service = TransformationService()
        self.provider_adapters = {
            "qci": QCIAdapter(),
            "dwave": DWaveAdapter(),
            "ionq": IonQAdapter(),
        }
    
    async def execute_job(self, job: Job) -> dict:
        """
        Execute a quantum job through the full pipeline.
        
        STUB: Simulates full execution with delays.
        
        Pipeline stages:
        1. TRANSFORMING: Convert user data to quantum format
        2. SUBMITTED: Send to quantum provider
        3. RUNNING: Provider is executing
        4. COMPLETED: Results retrieved and normalized
        """
        try:
            # Stage 1: Transformation
            await self._update_job_status(job, JobStatus.TRANSFORMING)
            transformation_result = await self.transformation_service.transform(
                job=job,
                input_data_ref=job.input_data_ref,
            )
            
            # Stage 2: Submit to provider
            await self._update_job_status(job, JobStatus.SUBMITTED)
            provider_adapter = self.provider_adapters[job.provider.slug]
            provider_job_id = await provider_adapter.submit_job(
                qubo=transformation_result["qubo_matrix"],
                params=job.transformation_config,
            )
            job.provider_job_id = provider_job_id
            
            # Stage 3: Running (simulate wait)
            await self._update_job_status(job, JobStatus.RUNNING)
            await asyncio.sleep(5)  # Simulate quantum execution
            
            # Stage 4: Get results
            raw_results = await provider_adapter.get_results(provider_job_id)
            
            # Stage 5: Normalize results
            normalized_results = self._normalize_results(raw_results)
            
            # Complete
            await self._update_job_status(job, JobStatus.COMPLETED)
            
            return normalized_results
            
        except Exception as e:
            logger.error(f"Job execution failed: {e}")
            await self._update_job_status(job, JobStatus.FAILED, str(e))
            raise
    
    def _normalize_results(self, raw_results: dict) -> dict:
        """
        INTEGRATION POINT: Result Normalization
        
        TODO: Implement provider-specific result normalization:
        - Convert provider formats to standard QuantumCue format
        - Calculate summary statistics
        - Generate chart data
        """
        solutions = raw_results.get("solutions", [])
        
        return {
            "solution_vector": solutions[0]["vector"] if solutions else [],
            "energy_values": [s["energy"] for s in solutions],
            "probabilities": [
                s["num_occurrences"] / sum(s2["num_occurrences"] for s2 in solutions)
                for s in solutions
            ],
            "summary_stats": {
                "best_energy": solutions[0]["energy"] if solutions else 0,
                "average_energy": sum(s["energy"] for s in solutions) / len(solutions) if solutions else 0,
                "num_solutions": len(solutions),
                "unique_solutions": len(set(tuple(s["vector"]) for s in solutions)),
            },
            "chart_data": {
                "energy_histogram": self._build_histogram([s["energy"] for s in solutions]),
                "solution_distribution": self._build_distribution(solutions),
            },
            "execution_stats": raw_results.get("timing", {}),
        }
    
    def _build_histogram(self, values: list[float], bins: int = 20) -> dict:
        """Build histogram data for charting."""
        if not values:
            return {"labels": [], "data": []}
        
        min_val, max_val = min(values), max(values)
        bin_width = (max_val - min_val) / bins if max_val != min_val else 1
        
        histogram = [0] * bins
        for v in values:
            bin_idx = min(int((v - min_val) / bin_width), bins - 1)
            histogram[bin_idx] += 1
        
        labels = [f"{min_val + i * bin_width:.2f}" for i in range(bins)]
        
        return {"labels": labels, "data": histogram}
    
    def _build_distribution(self, solutions: list[dict]) -> dict:
        """Build solution distribution data for charting."""
        # Top 10 solutions by occurrence
        sorted_solutions = sorted(
            solutions, 
            key=lambda x: x["num_occurrences"], 
            reverse=True
        )[:10]
        
        return {
            "labels": [f"Sol {i+1}" for i in range(len(sorted_solutions))],
            "data": [s["num_occurrences"] for s in sorted_solutions],
            "energies": [s["energy"] for s in sorted_solutions],
        }
    
    async def _update_job_status(
        self, 
        job: Job, 
        status: JobStatus, 
        message: str = None
    ):
        """Update job status (stub - should update DB)."""
        logger.info(f"[STUB] Job {job.id} status: {status.value}")
        job.status = status
        if message:
            job.status_message = message
```

### 9.5 Integration Points Summary

| Component | File Location | Integration Notes |
|-----------|---------------|-------------------|
| Data Transformation | `app/services/quantum/transformation.py` | Replace `TransformationService.transform()` with actual logic |
| QUBO Builder | `app/services/quantum/transformation.py` | Implement `QUBOBuilder` methods per patent |
| QCI Adapter | `app/services/quantum/providers/qci.py` | Integrate QCI API SDK |
| D-Wave Adapter | `app/services/quantum/providers/dwave.py` | Integrate Ocean SDK |
| IonQ Adapter | `app/services/quantum/providers/ionq.py` | Integrate IonQ API |
| Result Normalizer | `app/services/quantum/execution.py` | Implement provider-specific parsing |

---

## 10. Mock Data & Simulation

### 10.1 Job Status Simulation

For demo purposes, jobs progress through states automatically:

```python
# Simulated job lifecycle timing
JOB_SIMULATION_TIMING = {
    "draft_to_queued": 0,  # Immediate on submit
    "queued_to_transforming": 5,  # 5 seconds
    "transforming_to_submitted": 10,  # 10 seconds
    "submitted_to_running": 3,  # 3 seconds
    "running_to_completed": 15,  # 15 seconds
    "total_simulated_time": 33,  # ~33 seconds total
}
```

### 10.2 Demo User Accounts

```json
{
  "accounts": [
    {
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "tier": "professional",
      "users": [
        {
          "email": "admin@acme.com",
          "password": "demo123!",
          "first_name": "John",
          "last_name": "Admin",
          "role": "admin"
        },
        {
          "email": "user@acme.com",
          "password": "demo123!",
          "first_name": "Jane",
          "last_name": "User",
          "role": "user"
        }
      ],
      "enabled_providers": ["qci", "dwave"]
    }
  ]
}
```

### 10.3 Sample Jobs for Demo

```json
{
  "sample_jobs": [
    {
      "display_id": "QC-00001",
      "name": "Portfolio Optimization",
      "description": "Optimize asset allocation across 50 securities with risk constraints",
      "job_type": "optimization",
      "provider": "qci",
      "status": "completed"
    },
    {
      "display_id": "QC-00002",
      "name": "Supply Chain Routing",
      "description": "Find optimal delivery routes for 20 warehouses",
      "job_type": "optimization",
      "provider": "dwave",
      "status": "running"
    },
    {
      "display_id": "QC-00003",
      "name": "Risk Assessment Model",
      "description": "Train classification model for credit risk",
      "job_type": "classification",
      "provider": "qci",
      "status": "queued"
    },
    {
      "display_id": "QC-00004",
      "name": "Energy Grid Optimization",
      "description": "Optimize power distribution across regional grid",
      "job_type": "optimization",
      "provider": "dwave",
      "status": "draft"
    }
  ]
}
```

---

## 11. Deployment Guide

### 11.1 Local Development Setup

```bash
# Clone repository
git clone https://github.com/quantumcue/quantumcue-demo.git
cd quantumcue-demo

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update backend/.env with your Anthropic API key
# ANTHROPIC_API_KEY=your-key-here

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# Seed database with demo data
docker-compose exec backend python scripts/seed_demo.py

# Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### 11.2 Docker Compose Configuration

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: quantumcue-postgres
    environment:
      POSTGRES_USER: quantumcue
      POSTGRES_PASSWORD: quantumcue_dev
      POSTGRES_DB: quantumcue
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U quantumcue"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: quantumcue-backend
    env_file:
      - ./backend/.env
    environment:
      - DATABASE_URL=postgresql+asyncpg://quantumcue:quantumcue_dev@postgres:5432/quantumcue
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: quantumcue-frontend
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

volumes:
  postgres_data:
```

### 11.3 DigitalOcean Deployment

#### Option A: App Platform (Recommended for Demo)

1. **Create App Platform App**
   - Connect GitHub repository
   - Configure components:
     - Backend: Dockerfile, port 8000
     - Frontend: Dockerfile, port 3000 (or static site)
     - Database: Managed PostgreSQL (Dev tier)

2. **Environment Variables**
   ```
   # Backend
   DATABASE_URL=${db.DATABASE_URL}
   SECRET_KEY=generate-secure-key
   ANTHROPIC_API_KEY=your-key
   CORS_ORIGINS=https://your-app.ondigitalocean.app
   
   # Frontend
   VITE_API_BASE_URL=https://your-api.ondigitalocean.app/api/v1
   ```

3. **Deploy**
   ```bash
   # Using doctl CLI
   doctl apps create --spec .do/app.yaml
   ```

#### Option B: Droplet (More Control)

1. **Create Droplet**
   - Ubuntu 22.04
   - 2GB RAM minimum
   - Docker pre-installed

2. **Setup Script**
   ```bash
   # SSH into droplet
   ssh root@your-droplet-ip
   
   # Clone repository
   git clone https://github.com/quantumcue/quantumcue-demo.git
   cd quantumcue-demo
   
   # Setup environment
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit .env files with production values
   
   # Build and run
   docker-compose -f docker-compose.prod.yml up -d
   
   # Setup Nginx reverse proxy
   apt install nginx certbot python3-certbot-nginx
   # Configure nginx for your domain
   ```

### 11.4 Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: quantumcue-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    container_name: quantumcue-backend
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    container_name: quantumcue-frontend
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: quantumcue-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 12. Implementation Plan for Claude Code

### 12.1 Phase 1: Project Setup (Day 1)

```markdown
## Tasks
1. Initialize monorepo structure
2. Setup backend with FastAPI boilerplate
3. Setup frontend with Vite + React + TypeScript
4. Configure Docker Compose for local development
5. Create base Tailwind configuration with design system
6. Setup ESLint, Prettier, and pre-commit hooks

## Deliverables
- Running development environment
- Basic project structure
- Design system CSS variables configured
```

### 12.2 Phase 2: Database & Models (Day 1-2)

```markdown
## Tasks
1. Create SQLAlchemy models (Account, User, Provider, Job, etc.)
2. Setup Alembic migrations
3. Create initial migration
4. Implement seed script for demo data
5. Create Pydantic schemas for all models

## Deliverables
- Complete database schema
- Migrations working
- Demo data seeding
```

### 12.3 Phase 3: Authentication (Day 2)

```markdown
## Tasks
1. Implement JWT token generation/validation
2. Create login/logout endpoints
3. Create auth middleware
4. Implement password hashing
5. Create protected route decorator
6. Build login page UI

## Deliverables
- Working authentication flow
- Protected API routes
- Login page with design system styling
```

### 12.4 Phase 4: Core API Endpoints (Day 2-3)

```markdown
## Tasks
1. Account endpoints (CRUD)
2. User endpoints (CRUD, profile, password)
3. Provider endpoints (list, detail, status)
4. Job endpoints (CRUD, submit, cancel)
5. Dashboard endpoints (stats)
6. Implement role-based access control

## Deliverables
- All core API endpoints functional
- Swagger documentation complete
- RBAC working
```

### 12.5 Phase 5: Frontend Layout & Navigation (Day 3)

```markdown
## Tasks
1. Create UI component library (Button, Card, Input, etc.)
2. Build MainLayout with sidebar
3. Implement navigation and routing
4. Create Header with user menu
5. Build responsive sidebar (collapsible)
6. Create QuantumCue logo components

## Deliverables
- Complete layout system
- All routes navigable
- Responsive design working
```

### 12.6 Phase 6: Dashboard & Jobs List (Day 3-4)

```markdown
## Tasks
1. Build Dashboard page with stats cards
2. Create Provider status panel
3. Build Jobs list with filtering/sorting
4. Create Job cards and status badges
5. Implement pagination
6. Connect to API with React Query

## Deliverables
- Functional dashboard
- Jobs list with all features
- Real-time data from API
```

### 12.7 Phase 7: Job Creation Chat Interface (Day 4-5)

```markdown
## Tasks
1. Build chat container component
2. Create message components (user/assistant)
3. Implement chat input with file attachment button
4. Build suggestions/actions chips
5. Create job configuration side panel
6. Integrate LLM service for chat
7. Implement chat-to-job-config updates

## Deliverables
- Full chat interface working
- LLM integration functional
- Job configuration from chat
```

### 12.8 Phase 8: Job Detail & Results (Day 5-6)

```markdown
## Tasks
1. Build Job detail page
2. Create status-specific views
3. Build Results page with tabs
4. Create chart components (histogram, distribution)
5. Build results data table
6. Implement results chat interface
7. Create export functionality

## Deliverables
- Job detail page complete
- Results visualization working
- Results chat functional
```

### 12.9 Phase 9: Providers & Settings (Day 6)

```markdown
## Tasks
1. Build Providers list page
2. Create Provider detail page
3. Build Account settings page
4. Create User management (admin)
5. Build Billing page (stubbed)
6. Create Settings and Profile pages

## Deliverables
- All secondary pages complete
- Admin functionality working
```

### 12.10 Phase 10: Quantum Stubs & Job Simulation (Day 6-7)

```markdown
## Tasks
1. Implement transformation service stub
2. Create provider adapter stubs
3. Build job execution orchestrator
4. Implement job status simulation
5. Create result generation mocks
6. Test full job lifecycle

## Deliverables
- Full job simulation working
- Mock results generation
- End-to-end flow testable
```

### 12.11 Phase 11: Polish & Deployment (Day 7)

```markdown
## Tasks
1. UI polish and animations
2. Error handling and loading states
3. Mobile responsiveness check
4. Create production Docker configs
5. Setup DigitalOcean deployment
6. Write deployment documentation

## Deliverables
- Production-ready demo
- Deployed to DigitalOcean
- Documentation complete
```

---

## 13. Success Criteria

### 13.1 Functional Requirements

- [ ] User can login with email/password
- [ ] Dashboard shows job stats and provider status
- [ ] User can create job through chat interface
- [ ] LLM provides guidance for job configuration
- [ ] Jobs progress through simulated states
- [ ] User can view job details and audit trail
- [ ] Results page shows charts and data
- [ ] User can chat with results assistant
- [ ] Admin can manage account and users
- [ ] Providers page shows all providers with status

### 13.2 Non-Functional Requirements

- [ ] Page load time < 2 seconds
- [ ] Chat response time < 5 seconds
- [ ] Mobile-responsive design
- [ ] Consistent design system application
- [ ] Clean, documented code
- [ ] Working Docker deployment

### 13.3 Demo Scenarios

1. **New User Onboarding**
   - Login as new user
   - Explore dashboard
   - Create first job with chat guidance
   - View results

2. **Admin Management**
   - Login as admin
   - View account settings
   - Manage users
   - View billing/usage

3. **Job Lifecycle**
   - Create job via chat
   - Watch job progress through states
   - View completed results
   - Export data

---

## Appendix A: API Error Codes

| Code | Description |
|------|-------------|
| AUTH_INVALID_CREDENTIALS | Invalid email or password |
| AUTH_TOKEN_EXPIRED | JWT token has expired |
| AUTH_UNAUTHORIZED | User not authorized for this action |
| ACCOUNT_NOT_FOUND | Account does not exist |
| USER_NOT_FOUND | User does not exist |
| JOB_NOT_FOUND | Job does not exist |
| JOB_INVALID_STATE | Job is not in valid state for this action |
| PROVIDER_NOT_AVAILABLE | Provider is currently unavailable |
| PROVIDER_NOT_ENABLED | Provider not enabled for this account |
| VALIDATION_ERROR | Request validation failed |
| INTERNAL_ERROR | Internal server error |

---

## Appendix B: Environment Variables Reference

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| APP_NAME | Application name | QuantumCue |
| APP_ENV | Environment (development/production) | development |
| DEBUG | Enable debug mode | true |
| SECRET_KEY | JWT signing key | (required) |
| DATABASE_URL | PostgreSQL connection URL | (required) |
| ANTHROPIC_API_KEY | Anthropic API key for LLM | (required) |
| LLM_MODEL | LLM model to use | claude-sonnet-4-20250514 |
| CORS_ORIGINS | Allowed CORS origins | http://localhost:3000 |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_BASE_URL | Backend API URL | http://localhost:8000/api/v1 |
| VITE_APP_NAME | Application name | QuantumCue |
| VITE_APP_ENV | Environment | development |

---

*Document Version: 1.0*
*Last Updated: December 2024*

### 7.12 Settings Page

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                    │
├─────────────────────────────────────────────────────────────┤
│ Appearance                                                  │
│ Theme: [Dark ▼]                                            │
│ Sidebar: [Expanded ▼]                                      │
│                                                             │
│ Notifications                                               │
│ □ Email notifications for job completion                   │
│ □ Email notifications for job failures                     │
│ ☑ Browser notifications                                    │
│                                                             │
│ Default Job Settings                                        │
│ Default Provider: [QCI ▼]                                  │
│                                                             │
│                                           [Save Changes]    │
└─────────────────────────────────────────────────────────────┘
```

### 7.13 Profile Page

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Profile                                                     │
├─────────────────────────────────────────────────────────────┤
│ [Avatar]  Change Photo                                      │
│                                                             │
│ First Name: [John          ]                               │
│ Last Name:  [Doe           ]                               │
│ Email:      john@acme.com (read-only)                      │
│                                                             │
│                                           [Save Changes]    │
│ ─────────────────────────────────────────────────────────── │
│ Security                                                    │
│                                        [Change Password]    │
└─────────────────────────────────────────────────────────────┘
```

### 7.14 Help Page (Stubbed)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Help & Support                                              │
├─────────────────────────────────────────────────────────────┤
│ Documentation                                               │
│ [Getting Started Guide →]                                  │
│ [API Reference →]                                          │
│ [Provider Integration Guides →]                            │
│                                                             │
│ Support                                                     │
│ Email: support@quantumcue.com                              │
│                                                             │
│ FAQ                                                         │
│ Coming soon...                                              │
└─────────────────────────────────────────────────────────────┘
```