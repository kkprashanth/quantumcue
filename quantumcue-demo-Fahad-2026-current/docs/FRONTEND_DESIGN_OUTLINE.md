# QuantumCue Frontend Design Outline

## Overview

This document outlines the current frontend design structure, user experience flows, and component organization for the QuantumCue platform.

---

## Navigation Structure

### Main Layout
- **Sidebar Navigation** (collapsible, persistent)
  - Main sections: Dashboard, Jobs, Models, Datasets, Providers
  - Admin section: Account, Billing (admin-only)
  - Bottom section: Settings, Documentation, Help
- **Header** (top bar with page title)
- **Main Content Area** (responsive, adjusts based on sidebar state)

### Route Structure

```
/ (redirects to /dashboard)
├── /login (public)
├── /dashboard (protected)
├── /jobs
│   ├── /jobs (list)
│   ├── /jobs/new (wizard)
│   ├── /jobs/new/chat (chat interface)
│   ├── /jobs/:jobId (detail)
│   └── /jobs/:jobId/results (results view)
├── /models
│   ├── /models (list)
│   └── /models/:id (detail)
├── /datasets
│   ├── /datasets (list)
│   ├── /datasets/upload (upload wizard)
│   └── /datasets/:id (detail)
├── /providers
│   ├── /providers (list)
│   └── /providers/:providerId (detail)
├── /settings (user settings)
├── /profile (user profile)
├── /documentation
├── /help
└── /account (admin-only)
    ├── /account (account settings)
    ├── /account/users (user management)
    └── /billing (billing)
```

---

## Core Pages & User Flows

### 1. Dashboard (`/dashboard`)

**Purpose:** Central hub showing overview of all resources

**Layout:**
- Quick Actions bar (Create Job, Upload Dataset, etc.)
- Overview Cards (3-column grid):
  - Models Overview Card
  - Jobs Overview Card
  - Datasets Overview Card
- Recent Activity Row (3-column grid):
  - Recent Activity Feed
  - Models Overview (recent models)
  - Recent Jobs Table
- Provider Status Panel (full width)

**Key Components:**
- `QuickActions` - Action buttons for common tasks
- `ModelsOverviewCard` - Model statistics summary
- `JobsOverviewCard` - Job statistics summary
- `DatasetsOverviewCard` - Dataset statistics summary
- `RecentActivityFeed` - Timeline of recent actions
- `ModelsOverview` - Recent models list
- `RecentJobsTable` - Recent jobs table
- `ProviderStatusPanel` - Provider availability status

---

### 2. Jobs Section

#### 2.1 Jobs List (`/jobs`)

**Purpose:** View and filter all quantum computing jobs

**Features:**
- Job cards/list view
- Filtering by status, provider, search
- Status badges (draft, queued, running, completed, failed, cancelled)
- Job progress indicators
- Quick actions (view, cancel, delete)

**Key Components:**
- `JobCard` - Individual job card
- `JobFilters` - Filter controls
- `JobStatusBadge` - Status indicator
- `JobProgressBar` - Progress visualization

---

#### 2.2 Job Creation - Wizard (`/jobs/new`)

**Purpose:** Step-by-step job creation with guided workflow

**6-Step Wizard:**
1. **Select Dataset** - Choose existing dataset or upload new
2. **Problem Type** - Select job type (optimization, simulation, ML, etc.) and name
3. **Data Review** - Review dataset details and confirm
4. **Provider** - Select quantum provider
5. **Configuration** - Set parameters (shots, optimization level, provider-specific config)
6. **Review** - Final review with cost estimates before submission

**Key Components:**
- `JobWizard` - Main wizard container
- `JobWizardStep1Upload` - Dataset selection/upload
- `JobWizardStep2ProblemType` - Problem type selection
- `JobWizardStep3DataReview` - Data review
- `JobWizardStep4Provider` - Provider selection
- `JobWizardStep5Config` - Configuration form
- `JobWizardStep6Review` - Final review
- `ProviderConfigurationForm` - Dynamic provider config form

**User Flow:**
```
Select Dataset → Choose Problem Type → Review Data → 
Select Provider → Configure Parameters → Review & Submit
```

---

#### 2.3 Job Creation - Chat Interface (`/jobs/new/chat`)

**Purpose:** AI-guided job creation through conversational interface

**Layout:**
- Split view (2/3 chat, 1/3 config panel)
- Chat interface on left
- Job configuration panel on right (updates based on chat suggestions)

**Features:**
- Natural language job description
- AI suggests job configuration
- Real-time config panel updates
- Save draft functionality
- Submit job when ready

**Key Components:**
- `ChatContainer` - Main chat interface
- `ChatInput` - Message input
- `ChatMessage` - Individual messages
- `ChatSuggestions` - Suggested actions
- `JobConfigPanel` - Configuration sidebar
- `TypingIndicator` - Loading state

**User Flow:**
```
Create Draft Job → Chat with AI → AI Suggests Config → 
Review Config Panel → Adjust if Needed → Save/Submit
```

---

#### 2.4 Job Detail (`/jobs/:jobId`)

**Purpose:** View job details, status, and progress

**Features:**
- Job information card
- Status and progress tracking
- Provider information
- Configuration details
- Cost information
- Execution timeline
- Logs and error messages
- Link to results

**Key Components:**
- `JobStatusBadge` - Status indicator
- `JobProgressBar` - Progress visualization
- `JobConfigPanel` - Configuration display

---

#### 2.5 Results View (`/jobs/:jobId/results`)

**Purpose:** View and analyze job results

**Features:**
- Results summary
- Energy histogram
- Solution distribution charts
- Results table
- Chat interface for results analysis
- Export functionality

**Key Components:**
- `ResultsSummary` - Summary statistics
- `EnergyHistogram` - Energy distribution chart
- `SolutionDistribution` - Solution distribution chart
- `ResultsTable` - Detailed results table
- `ResultsChat` - AI assistant for results

---

### 3. Models Section

#### 3.1 Models List (`/models`)

**Purpose:** Browse trained quantum models

**Features:**
- Model cards with key metrics
- Filter by type, status
- Search functionality
- Quick actions (view, test, deploy)

**Key Components:**
- `ModelCard` - Individual model card
- Model type badges
- Status indicators

---

#### 3.2 Model Detail (`/models/:id`)

**Purpose:** Comprehensive model view with testing and analysis

**Tabbed Interface:**
1. **Overview**
   - Model information
   - Provider configuration display
   - Submission details (job submission JSON, file config)
   - Enable/disable reasoning toggle
   - Usage statistics
   - Links to related resources

2. **Metrics**
   - Training metrics visualization
   - ROC curves
   - Precision-recall curves
   - Performance statistics

3. **Performance Comparison** (if available)
   - Quantum vs Classical comparison
   - Side-by-side metrics

4. **Interactions**
   - History of model interactions
   - Predictions with feedback
   - Correction tracking

5. **Recommendations**
   - Configure recommendation settings
   - Classification-based recommendations

6. **AI Assistant**
   - Chat interface for model questions
   - Insights and recommendations

7. **Test Model** (if ready/hosted)
   - Upload inference data
   - View predictions
   - Provide feedback
   - View statistics

**Key Components:**
- `ModelMetrics` - Metrics visualization
- `ROCCurveChart` - ROC curve chart
- `PrecisionRecallChart` - Precision-recall chart
- `QuantumClassicalComparison` - Comparison view
- `ModelInteractionHistory` - Interaction list
- `ModelInferenceUpload` - Test interface
- `ModelStats` - Usage statistics
- `ModelChat` - AI assistant
- `RecommendationsConfig` - Recommendations settings
- `AddClassificationsModal` - Add classifications modal

**Special Features:**
- Warning banner if classifications not configured
- Enable reasoning toggle (generates AI explanations)
- Provider configuration display (formatted from training job)
- Job submission JSON display (for reference)

---

### 4. Datasets Section

#### 4.1 Datasets List (`/datasets`)

**Purpose:** Manage datasets

**Features:**
- Dataset cards
- Status indicators (uploading, processing, ready, error)
- File format badges
- Quick actions (view, delete)

**Key Components:**
- `DatasetCard` - Individual dataset card
- Status badges

---

#### 4.2 Dataset Upload Wizard (`/datasets/upload`)

**Purpose:** Upload and configure new datasets

**Multi-step Process:**
1. **Upload** - File selection and upload
2. **Labeling** (for image datasets) - Review extracted labels
3. **Summary** - Review dataset details before finalizing

**Key Components:**
- `DatasetUpload` - Main upload component
- `DatasetUploadStep1` - File upload
- `DatasetUploadStep2Labeling` - Labeling review
- `DatasetUploadStep3Summary` - Final summary
- `DatasetProcessingProgress` - Processing status
- `DatasetValidationErrors` - Error display

---

#### 4.3 Dataset Detail (`/datasets/:id`)

**Purpose:** View dataset details and statistics

**Features:**
- Dataset information
- File details
- Schema information
- Statistics
- Labeling structure (for image datasets)
- Split estimates (train/validation/test)
- Processing status

**Key Components:**
- `DatasetSummaryCard` - Summary information
- `DatasetLabelingPreview` - Labeling structure display

---

### 5. Providers Section

#### 5.1 Providers List (`/providers`)

**Purpose:** Browse available quantum providers

**Features:**
- Provider cards with status
- Provider type badges (annealer, gate-based, hybrid)
- Status indicators (available, degraded, unavailable)
- Queue depth information
- Estimated wait times

**Key Components:**
- `ProviderCard` - Individual provider card
- `ProviderStatusIndicator` - Status indicator
- `ProviderLogo` - Provider logo

---

#### 5.2 Provider Detail (`/providers/:providerId`)

**Purpose:** Detailed provider information

**Features:**
- Provider description
- Hardware specifications
- Capabilities
- Pricing information
- Status and queue information
- Documentation links

**Key Components:**
- `ProviderSpecsTable` - Specifications table
- `ProviderStatusIndicator` - Status display

---

### 6. Account & Settings

#### 6.1 User Settings (`/settings`)

**Purpose:** User preferences and settings

**Features:**
- Profile settings
- Preferences
- Notification settings

---

#### 6.2 Profile (`/profile`)

**Purpose:** User profile information

**Features:**
- User information
- Avatar
- Account details

---

#### 6.3 Account Settings (`/account`) - Admin Only

**Purpose:** Account-level configuration

**Features:**
- Account information
- Data budget and usage
- Account settings

---

#### 6.4 User Management (`/account/users`) - Admin Only

**Purpose:** Manage account users

**Features:**
- User list/table
- Invite users
- Manage roles
- User status management

**Key Components:**
- `UserTable` - User list
- `InviteUserModal` - Invite user modal

---

#### 6.5 Billing (`/billing`) - Admin Only

**Purpose:** Billing and subscription management

**Features:**
- Subscription details
- Usage tracking
- Billing history
- Payment methods

---

### 7. Documentation & Help

#### 7.1 Documentation (`/documentation`)

**Purpose:** Platform documentation

**Features:**
- Documentation content
- Search functionality
- Table of contents

---

#### 7.2 Help (`/help`)

**Purpose:** Help and support

**Features:**
- FAQ
- Support contact
- Getting started guides

---

## Component Organization

### Layout Components (`components/layout/`)
- `MainLayout` - Main app layout with sidebar and header
- `Sidebar` - Navigation sidebar
- `Header` - Top header bar
- `PageContainer` - Page wrapper with title/description

### UI Components (`components/ui/`)
- `Button` - Button component
- `Card` - Card container
- `Input` - Form input
- `Modal` - Modal dialog
- `Tabs` - Tab navigation
- `Dropdown` - Dropdown menu
- `Pagination` - Pagination controls
- `Skeleton` - Loading skeleton
- `LoadingSpinner` - Loading indicator
- `Toast` - Toast notifications
- `Tooltip` - Tooltip
- `Avatar` - User avatar
- `ConfirmationModal` - Confirmation dialog
- `ErrorBoundary` - Error boundary

### Feature Components

#### Jobs (`components/jobs/`)
- `JobCard` - Job list item
- `JobWizard` - Multi-step wizard
- `JobWizardStep*` - Individual wizard steps
- `JobConfigPanel` - Configuration panel
- `JobStatusBadge` - Status indicator
- `JobProgressBar` - Progress bar
- `JobFilters` - Filter controls
- `JobCompletedCard` - Completed job card
- `ProviderConfigurationForm` - Dynamic provider config

#### Models (`components/models/`)
- `ModelCard` - Model list item
- `ModelMetrics` - Metrics visualization
- `ModelChat` - AI chat interface
- `ModelInferenceUpload` - Test interface
- `ModelInteractionHistory` - Interaction list
- `ModelStats` - Usage statistics
- `ModelRecommendations` - Recommendations display
- `RecommendationsConfig` - Recommendations settings
- `QuantumClassicalComparison` - Comparison view
- `AddClassificationsModal` - Add classifications

#### Datasets (`components/datasets/`)
- `DatasetCard` - Dataset list item
- `DatasetUpload` - Upload component
- `DatasetUploadStep*` - Upload wizard steps
- `DatasetSummaryCard` - Summary card
- `DatasetLabelingPreview` - Labeling display
- `DatasetProcessingProgress` - Processing status
- `DatasetValidationErrors` - Error display

#### Providers (`components/providers/`)
- `ProviderCard` - Provider list item
- `ProviderLogo` - Provider logo
- `ProviderSpecsTable` - Specifications table
- `ProviderStatusIndicator` - Status indicator

#### Results (`components/results/`)
- `ResultsSummary` - Summary statistics
- `EnergyHistogram` - Energy chart
- `SolutionDistribution` - Distribution chart
- `ResultsTable` - Results table
- `ResultsChat` - AI assistant

#### Chat (`components/chat/`)
- `ChatContainer` - Main chat interface
- `ChatInput` - Message input
- `ChatMessage` - Message display
- `ChatSuggestions` - Suggested actions
- `TypingIndicator` - Loading indicator

#### Dashboard (`components/dashboard/`)
- `QuickActions` - Action buttons
- `ModelsOverviewCard` - Models summary
- `JobsOverviewCard` - Jobs summary
- `DatasetsOverviewCard` - Datasets summary
- `RecentActivityFeed` - Activity timeline
- `ModelsOverview` - Recent models
- `RecentJobsTable` - Recent jobs table
- `ProviderStatusPanel` - Provider status
- `StatsCard` - Statistics card
- `DataUsageCard` - Data usage card

#### Charts (`components/charts/`)
- `ROCCurveChart` - ROC curve visualization
- `PrecisionRecallChart` - Precision-recall curve

#### Account (`components/account/`)
- `UserTable` - User management table
- `InviteUserModal` - Invite user dialog

---

## Design System

### Color Palette
- **Background:** `#0a0a0b` (bg-bg-primary)
- **Surface:** `#141415` (bg-bg-secondary)
- **Surface Elevated:** `#1c1c1e` (bg-bg-tertiary)
- **Border:** `#2e2e32` (border-border-primary)
- **Border Subtle:** `#232326` (border-border-subtle)
- **Text Primary:** `#fafafa` (text-text-primary)
- **Text Secondary:** `#a1a1aa` (text-text-secondary)
- **Text Tertiary:** `#71717a` (text-text-tertiary)
- **Success:** `#22c55e` (text-green-500)
- **Warning:** `#f59e0b` (text-amber-500)
- **Error:** `#ef4444` (text-red-500)
- **Info:** `#3b82f6` (text-blue-500)
- **Quantum Purple:** `#8b5cf6` (text-violet-500)
- **Quantum Cyan:** `#06b6d4` (text-cyan-500)

### Typography
- **Font Family:** Inter, system-ui, sans-serif
- **Monospace:** JetBrains Mono, Fira Code, monospace

### Component Patterns
- **Cards:** Surface background, subtle border, 8px radius
- **Buttons:** Primary (gradient), Secondary (surface), Ghost (transparent)
- **Inputs:** Surface background, focus ring with primary color
- **Status Badges:** Pill shape, 10-20% background opacity

---

## Key User Flows

### Flow 1: Create Job via Wizard
```
Dashboard → Quick Action "Create Job" → 
Job Wizard Step 1 (Select Dataset) → 
Step 2 (Problem Type) → 
Step 3 (Data Review) → 
Step 4 (Provider) → 
Step 5 (Configuration) → 
Step 6 (Review) → 
Submit → Job Detail Page
```

### Flow 2: Create Job via Chat
```
Dashboard → Quick Action "Create Job" → 
Chat Interface → 
Describe Problem → 
AI Suggests Config → 
Review Config Panel → 
Adjust if Needed → 
Save Draft / Submit → 
Job Detail Page
```

### Flow 3: Upload Dataset
```
Dashboard → Quick Action "Upload Dataset" → 
Dataset Upload Wizard Step 1 (Upload) → 
Step 2 (Labeling Review - if images) → 
Step 3 (Summary) → 
Submit → Dataset Detail Page
```

### Flow 4: Train Model from Job
```
Job Detail → Job Completed → 
View Results → 
Create Model from Results → 
Model Detail Page → 
Test Model → 
View Metrics → 
Deploy Model
```

### Flow 5: Test Model
```
Models List → Select Model → 
Model Detail → Test Tab → 
Upload Inference Data → 
View Prediction → 
Provide Feedback → 
View Statistics
```

---

## State Management

### Server State (TanStack Query)
- All API data fetching
- Automatic caching and refetching
- Optimistic updates for mutations

### Client State (Zustand)
- UI preferences (sidebar collapsed state)
- Authentication state
- Toast notifications

---

## Responsive Design

### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### Layout Adaptations
- Sidebar collapses to icon-only on smaller screens
- Grid layouts adapt from multi-column to single column
- Chat interface stacks vertically on mobile
- Tables become cards on mobile

---

## Key Features

### AI Integration
- **Chat Interface:** Conversational job creation
- **Model Assistant:** Chat about models and results
- **Results Analysis:** AI-powered results interpretation
- **Reasoning:** AI explanations for model predictions

### Data Management
- **Dataset Upload:** Multi-format support (CSV, JSON, images, ZIP)
- **Labeling Extraction:** Automatic label extraction for image datasets
- **Data Validation:** Real-time validation and error reporting
- **Processing Status:** Real-time processing progress

### Job Management
- **Multi-step Wizard:** Guided job creation
- **Provider Selection:** Choose quantum provider
- **Cost Estimation:** Real-time cost estimates
- **Progress Tracking:** Real-time job status and progress
- **Results Visualization:** Charts and tables for results

### Model Management
- **Metrics Visualization:** ROC curves, precision-recall
- **Performance Comparison:** Quantum vs Classical
- **Model Testing:** Upload and test with inference data
- **Recommendations:** Classification-based recommendations
- **Interaction History:** Track all model interactions

---

## Future Considerations

### Potential Enhancements
- Real-time job status updates (WebSocket)
- Advanced filtering and search
- Bulk operations
- Export functionality
- Custom dashboards
- Notification system
- Collaboration features
- Version control for models
- Model marketplace
- Advanced analytics

---

## Technical Stack

- **Framework:** React 18.2+
- **Language:** TypeScript 5.3+
- **Build Tool:** Vite 5.0+
- **State Management:** TanStack Query 5.17+, Zustand 4.4+
- **Routing:** React Router DOM 6.21+
- **HTTP Client:** Axios 1.6+
- **Styling:** Tailwind CSS 3.4+
- **Charts:** Chart.js 4.5+ with react-chartjs-2
- **Icons:** Lucide React
- **Date Handling:** date-fns 3.2+

---

This outline provides a comprehensive view of the current frontend design and user experience. Use this as a reference when planning UX changes or new features.

