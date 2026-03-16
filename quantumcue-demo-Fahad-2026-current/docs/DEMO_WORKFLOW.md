# QuantumCue Demo Workflow Guide

## Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup)
2. [Initial Data Seeding](#initial-data-seeding)
3. [Primary Demo Workflow](#primary-demo-workflow)
4. [Additional Demo Features](#additional-demo-features)
5. [Advanced Use Cases](#advanced-use-cases)

---

## Prerequisites & Setup

### Quick Setup Reference

For detailed setup instructions, see the [README.md](../README.md) in the project root.

**Required Prerequisites:**
- Git
- Docker & Docker Compose (v20.10+)
- curl (for health checks)
- make (optional but recommended)

**Quick Start:**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/quantumcue/quantumcue-demo.git
   cd quantumcue-demo
   ```

2. **Run the setup script:**
   ```bash
   make dev-setup
   # Or: ./scripts/dev-setup.sh
   ```

   This will automatically:
   - Build Docker images
   - Start all services (frontend, backend, database)
   - Run database migrations
   - Seed demo data

3. **Configure environment variables** (if not already set):
   
   Edit `backend/.env`:
   ```env
   SECRET_KEY=your-generated-secret-key-here  # Generate with: openssl rand -hex 32
   ANTHROPIC_API_KEY=your-api-key-here  # Get from https://console.anthropic.com/
   ```

4. **Access the application:**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:8000
   - **API Docs:** http://localhost:8000/docs

5. **Check service status:**
   ```bash
   ./scripts/manage-local.sh status
   ```

   This displays:
   - Container status
   - Service endpoints
   - **Demo login credentials**

### Demo Credentials

After seeding, use these credentials to log in:

| Email | Password | Role |
|-------|----------|------|
| admin@acme.com | demo123! | Admin |
| user@acme.com | demo123! | User |

---

## Initial Data Seeding

### Understanding Seed Data

The seed scripts create realistic demo data to showcase the platform:

- **5 Quantum Providers:** QCI, D-Wave, IonQ, IBM Quantum, Rigetti (each with provider-specific configuration schemas)
- **Demo Account:** "QuantumCue Demo" with 2 users
- **6 Datasets:** Including the key "Alzheimer's MRI Brain Scans - Batch 01"
- **1 Multi-Modal ZIP Dataset:** "Ejection Fraction Multi-Modal Dataset - Sample" with 25 patient records
- **15 Jobs:** Various statuses (completed, running, pending, failed)
- **5 Models:** Including the hosted "Alzheimer's Detection QNN - QCI Photonic"
- **Model Interactions:** Sample inference history for hosted models

### Running Seed Scripts

**If you need to re-seed or add new data:**

```bash
# Run all seed scripts (idempotent - only adds new data)
docker-compose exec backend python -m scripts.seed_demo

# Or run individual seed scripts:
docker-compose exec backend python -m scripts.seed_providers
docker-compose exec backend python -m scripts.seed_provider_configurations
docker-compose exec backend python -m scripts.seed_datasets
docker-compose exec backend python -m scripts.seed_zip_datasets  # Multi-modal dataset
docker-compose exec backend python -m scripts.seed_jobs
docker-compose exec backend python -m scripts.seed_models
docker-compose exec backend python -m scripts.seed_model_interactions
```

**Important:** All seed scripts are **idempotent** - they check for existing records and only create new ones. Safe to run multiple times!

### Verifying Seed Data

After seeding, verify data exists:

1. **Login** to the application at http://localhost:3000
2. **Check Dashboard** - should show:
   - Recent jobs
   - Models overview
   - Datasets list
   - Provider status
3. **Navigate to Datasets** - should see:
   - "Alzheimer's MRI Brain Scans - Batch 01"
   - "Ejection Fraction Multi-Modal Dataset - Sample" (with extracted labels and splits)
4. **Navigate to Models** - should see "Alzheimer's Detection QNN - QCI Photonic" (hosted)

---

## Primary Demo Workflow

### The Complete End-to-End Journey

This workflow demonstrates the full lifecycle: **Upload Data → Train Model → Deploy → Test Inference**

---

### Step 1: Create a New Project (Job)

**Objective:** Start a new quantum machine learning job

1. **Navigate to Dashboard**
   - URL: http://localhost:3000/dashboard
   - Click **"New Project"** button in Quick Actions
   - Or navigate to: http://localhost:3000/jobs/new

2. **Job Creation Wizard Opens**
   - Multi-step wizard guides you through job configuration
   - Step 1: **Data Upload** - Select existing dataset or upload new

---

### Step 2: Select Existing Dataset

**Objective:** Use the pre-seeded Alzheimer's dataset

1. **In Step 1 (Data Upload):**
   - Select **"Use Existing Dataset"** option
   - Browse available datasets
   - **Select:** "Alzheimer's MRI Brain Scans - Batch 01"
   - This dataset contains:
     - 5,000 MRI brain scan images
     - 256x256 resolution
     - Balanced classes: 2,500 healthy, 2,500 atrophy cases
     - 12.5 GB total size

2. **Click "Next"** to proceed

**What Happens:**
- Dataset metadata is loaded
- File format and statistics are displayed
- System validates dataset is ready for use

---

### Step 3: Configure Problem Type

**Objective:** Define the machine learning task

1. **Step 2: Problem Type**
   - Select **"Machine Learning"** as job type
   - The system recognizes this is an image classification task

2. **Review Dataset Summary:**
   - Dataset name and description
   - File format: Image Directory
   - Data type: Images
   - Statistics: Total images, resolution, class balance

3. **Click "Next"**

---

### Step 4: Review Data & Configuration

**Objective:** Verify dataset details before proceeding

1. **Step 3: Data Review**
   - Review dataset information:
     - Name: "Alzheimer's MRI Brain Scans - Batch 01"
     - Description: Medical imaging dataset
     - Statistics: Image count, resolution, class distribution
   - Verify data structure is correct

2. **Click "Next"**

---

### Step 5: Select Quantum Provider

**Objective:** Choose QCI Photonic hardware (Do we want to provide other details here?)

1. **Step 4: Provider Selection**
   - Browse available providers:
     - **QCI (Quantum Computing Inc.)** - Photonic, Room Temperature
     - D-Wave Systems - Quantum Annealer
     - IonQ - Trapped Ion
     - IBM Quantum - Superconducting
     - Rigetti Computing - Superconducting

2. **Select QCI:**
   - **Why QCI?** 
     - Photonic technology ideal for optimization and ML
     - Room temperature operation
     - Native support for QNN architectures
     - Lower latency for inference workloads

3. **Review Provider Details:**
   - Technology: Entropy Quantum Computing (EQC)
   - Qubits: 949 qudits (200 modes each)
   - Status: Online
   - Queue depth: 3 jobs
   - Average wait time: 2 minutes

4. **Click "Next"**

---

### Step 6: Configure Job Parameters

**Objective:** Set provider-specific configuration parameters

1. **Step 5: Configuration**
   - **Priority Selection:**
     - Choose job priority (Low, Normal, High)
   
   - **Provider-Specific Configuration:**
     - When a provider is selected, the configuration form dynamically displays provider-specific fields
     - **For QCI:**
       - Number of Samples: 10 (default)
       - Relaxation Schedule: 1, 2, 3, or 4
       - Variables Type: integer or continuous
       - If "integer": Number of Qubits per Weight, Number of Levels (2-6)
       - If "continuous": Sum Constraint (1.00 - 10,000.00)
       - Number of Classes: Auto-set from dataset classifications (up to 4), user can override
       - Test Data Percentage: 20% (default)
     - **For D-Wave:**
       - Computer Model: Advantage or Advantage2
       - Number of Qubits: 1-5760 (Advantage) or 1-4589 (Advantage2)
       - Problem Type: qubo or ising
       - Number of Reads: 1-10,000
       - Annealing Time: 0.5-2000.0 microseconds
       - Number of Classes: Auto-set from dataset classifications (up to 4), user can override
       - Test Data Percentage: 20% (default)
     - **For Other Providers:**
       - Basic fields: Number of Classes, Test Data Percentage
   
   - **Auto-Population:**
     - `num_classes` is automatically set based on the number of unique classifications in the selected dataset
     - If dataset has 2 classifications, `num_classes` defaults to 2
     - User can override the auto-populated value
   
   - **Conditional Fields:**
     - Some fields only appear based on other field values (e.g., QCI's "num_qubits_per_weight" only shows when "variables_type" is "integer")
   
   - **Validation:**
     - All fields are validated against provider-specific rules (min/max values, required fields, allowed options)

2. **Review Cost Estimate:**
   - Estimated cost: $0.50 - $0.75 per task
   - Based on QCI pricing model
   - Includes compute, storage, and data transfer

3. **Click "Next"**

---

### Step 7: Review & Submit Job

**Objective:** Final review before submission

1. **Step 6: Review & Submit**
   - **Job Summary:**
     - Name: "Alzheimer's Detection QNN Training"
     - Type: Machine Learning
     - Dataset: Alzheimer's MRI Brain Scans - Batch 01
     - Provider: QCI (Quantum Computing Inc.)
     - Estimated cost: $0.50 - $0.75
   - **Configuration Review:**
     - All parameters displayed
     - Dataset statistics
     - Provider specifications

2. **Click "Submit Job"**

3. **Job Created:**
   - Job is assigned a display ID (e.g., QC-2025-00016)
   - Status changes to "Pending"
   - Redirects to Job Detail page

---

### Step 8: Watch Job Progress

**Objective:** Monitor real-time training progress

1. **Job Detail Page Opens**
   - URL: http://localhost:3000/jobs/{jobId}
   - Shows comprehensive job information

2. **Progress Bar Display:**
   - **Stage 1: Transforming Input** (15% of time)
     - Converting MRI images to quantum-ready format
     - Preparing feature maps
   - **Stage 2: Queued** (20% of time)
     - Waiting in QCI queue
     - Estimated wait: 2 minutes
   - **Stage 3: Executing** (60% of running time)
     - Training on QCI Photonic hardware
     - Real-time metrics updating
   - **Stage 4: Translating** (40% of running time)
     - Converting quantum results to classical format
     - Post-processing results
   - **Stage 5: Completed**
     - Training finished successfully

3. **Real-Time Metrics (for ML jobs):**
   - **Training Progress:**
     - Current epoch: 1 → 50
     - Progress percentage: 0% → 100%
   - **Metrics History:**
     - Loss: Decreasing over epochs
     - Accuracy: Increasing over epochs
     - Validation metrics updating
   - **Estimated Time Remaining:**
     - Updates dynamically
     - Total time: 8-10 seconds (simulated)

4. **Job Completes:**
   - Status changes to "Completed"
   - **Job Completed Card** appears:
     - Display ID
     - Result summary
     - Execution time
     - Total cost
     - **"View Model"** button appears

---

### Step 9: View Trained Model

**Objective:** Explore the completed model

1. **Click "View Model"** from Job Completed Card
   - Or navigate to Models page
   - Find: "Alzheimer's Detection QNN - QCI Photonic"

2. **Model Detail Page:**
   - **Overview Tab:**
     - Model name and description
     - Status: Hosted Active
     - Model type: Variational Quantum Classifier
     - Training metrics:
       - Final accuracy: 89%
       - Validation accuracy: 87%
       - F1-score: 88%
     - Architecture details
     - Training configuration
   - **Metrics Tab:**
     - Training loss curve
     - Accuracy over epochs
     - Validation metrics
     - Confusion matrix
   - **Test Model Tab:** (Key for inference demo)
     - Upload interface
     - Inference history
     - Statistics

3. **Model Information:**
   - **Hosting Status:** Active
   - **Endpoint:** https://api.quantumcue.com/inference/v1/models/{id}
   - **Prediction Count:** 42 (from seed data)
   - **Last Used:** 2 hours ago
   - **Training Job:** Link to original job
   - **Dataset:** Link to training dataset

---

### Step 10: Test Model Inference

**Objective:** Upload an image and get a prediction

1. **Navigate to "Test Model" Tab**
   - On Model Detail page
   - Shows upload interface

2. **Upload Test Image:**
   - Click **"Choose File"** or drag-and-drop
   - **Recommended:** Use the example brain scan image at `examples/data/brain_scan_example.png`
     - This is a grayscale MRI brain scan (axial view)
     - Shows clear anatomical structures suitable for classification
     - High contrast, diagnostic-quality image
   - Or select any MRI brain scan image (PNG/JPG)
   - Image should be 256x256 pixels (will be resized if needed)
   - Click **"Upload & Predict"**

3. **Prediction Results:**
   - **Prediction:** "Early-Stage Alzheimer's" or "Healthy"
   - **Confidence:** 85-98%
   - **Class Probabilities:**
     - Healthy: X%
     - Early-Stage Alzheimer's: Y%
   - **Metadata:**
     - Latency: 100-200ms
     - Backend: Quantum simulation
     - Qubits used: 12

4. **Inference History:**
   - New interaction appears in history
   - Shows timestamp, prediction, confidence
   - Can view details of each interaction
   - Statistics update:
     - Total predictions
     - Average confidence
     - Prediction distribution

5. **Complete Round Trip:**
   - ✅ Dataset uploaded
   - ✅ Model trained
   - ✅ Model deployed
   - ✅ Inference tested
   - ✅ Results displayed

---

## Additional Demo Features

### Dashboard Overview

**Location:** http://localhost:3000/dashboard

**Key Features:**

1. **Quick Actions:**
   - **New Project:** Start job creation wizard
   - **Upload Dataset:** Go to dataset upload page
   - **View Models:** Navigate to models list

2. **Recent Activity Feed:**
   - Mixed timeline of:
     - Jobs created/completed
     - Models trained/hosted
     - Datasets uploaded
     - Model interactions
   - Shows last 10-15 activities
   - Clickable links to details

3. **Models Overview:**
   - **Statistics:**
     - Total models: 5
     - Hosted models: 2
     - Ready models: 2
     - Archived: 1
   - **Recent Models:**
     - List of 5 most recent models
     - Shows name, status, last used
     - Quick links to detail pages

4. **Jobs Overview:**
   - **Statistics:**
     - Total jobs: 15
     - Completed: 12
     - Running: 2
     - Failed: 1
   - **Recent Jobs:**
     - List of 5 most recent jobs
     - Shows name, status, provider
     - Quick links to detail pages

5. **Provider Status:**
   - Real-time status of all providers
   - Queue depths
   - Average wait times
   - Online/offline indicators

---

### Jobs Page

**Location:** http://localhost:3000/jobs

**Features:**

1. **Job List View:**
   - Filterable by:
     - Status (draft, pending, running, completed, failed)
     - Job type (optimization, simulation, ML, chemistry)
     - Provider
     - Date range
   - Sortable columns
   - Pagination

2. **Job Cards:**
   - Display ID (QC-2025-XXXXX)
   - Job name
   - Status badge with color coding
   - Provider logo/name
   - Created date
   - Execution time (if completed)
   - Cost (if completed)

3. **Job Detail Page:**
   - **Overview Tab:**
     - Full job information
     - Status timeline
     - Provider details
     - Dataset information
   - **Progress Tab:** (for running jobs)
     - Real-time progress bar
     - Stage indicators
     - Estimated time remaining
     - Training metrics (for ML jobs)
   - **Results Tab:** (for completed jobs)
     - Result data visualization
     - Metrics charts
     - Download results
   - **Model Tab:** (for ML jobs)
     - Link to trained model
     - Model status
   - **Audit Tab:**
     - Status change history
     - User actions
     - Timestamps

---

### Models Page

**Location:** http://localhost:3000/models

**Features:**

1. **Model List View:**
   - Filterable by:
     - Status (training, ready, hosted_active, archived)
     - Model type (QNN, VQC, QSVM, generative)
     - Provider
     - Training job
   - Sortable columns
   - Search by name

2. **Model Cards:**
   - Display ID (MODEL-2025-XXXXX)
   - Model name
   - Status badge
   - Model type
   - Training metrics (accuracy)
   - Prediction count
   - Last used timestamp

3. **Model Detail Page:**
   - **Overview Tab:**
     - Model information
     - Architecture details
     - Training configuration
     - Metrics summary
   - **Metrics Tab:**
     - Training curves
     - Loss over epochs
     - Accuracy progression
     - Validation metrics
     - Confusion matrix
   - **Test Model Tab:**
     - Image upload interface
     - Inference history
     - Per-interaction statistics
     - Aggregated statistics
   - **Training Tab:**
     - Link to training job
     - Training dataset information
     - Provider used
     - Training parameters

---

### Datasets Page

**Location:** http://localhost:3000/datasets

**Features:**

1. **Dataset List View:**
   - Filterable by:
     - Status (uploading, processing, ready, error)
     - File format (CSV, JSON, Parquet, Images)
     - Data type (structured, unstructured, images, text)
   - Sortable columns
   - Search by name

2. **Dataset Cards:**
   - Dataset name
   - File format badge
   - Data type
   - File size
   - Row/column count (for structured data)
   - Status badge
   - Created date

3. **Dataset Detail Page:**
   - **Overview Tab:**
     - Dataset information
     - Description
     - File details
     - Statistics
   - **Schema Tab:** (for structured data)
     - Column definitions
     - Data types
     - Nullability
   - **Statistics Tab:**
     - Dataset statistics
     - Class distribution (for classification)
     - Data quality metrics
   - **Usage Tab:**
     - Jobs using this dataset
     - Models trained on this dataset
     - Links to related resources

4. **Upload Dataset:**
   - **Upload Wizard:**
     - Step 1: Upload file
     - Step 2: Review & Configure
       - Name and description
       - File format selection
       - Data type selection
   - Supports:
     - CSV files
     - JSON files
     - Parquet files
     - Image directories (ZIP)
     - Text files

---

### Providers Page

**Location:** http://localhost:3000/providers

**Features:**

1. **Provider List View:**
   - All available quantum providers
   - Status indicators (online/offline/degraded)
   - Technology type badges
   - Queue depth indicators

2. **Provider Cards:**
   - Provider name and logo
   - Technology type
   - Qubit count
   - Status
   - Queue depth
   - Average wait time

3. **Provider Detail Page:**
   - **Overview Tab:**
     - Provider information
     - Description
     - Technology details
   - **Hardware Tab:**
     - Qubit specifications
     - Gate fidelities
     - Coherence times
     - Processor details
   - **Capabilities Tab:**
     - Supported algorithms
     - Supported problem types
     - Native gates
     - SDK languages
   - **Pricing Tab:**
     - Pricing model
     - Cost per shot/task
     - Minimum requirements
   - **Status Tab:**
     - Current status
     - Queue depth
     - Average wait time
     - Recent availability

---

## Advanced Use Cases

### Retraining Models with New Data

**Scenario:** Improve model accuracy by training on additional data

1. **Upload New Dataset:**
   - Navigate to Datasets → Upload Dataset
   - Upload "Alzheimer's MRI Brain Scans - Batch 02"
   - Contains 3,000 new images
   - Similar structure to Batch 01

2. **Create New Training Job:**
   - Start New Project
   - Select new dataset (Batch 02)
   - Or combine datasets (future feature)

3. **Fine-Tune Existing Model:**
   - In job configuration, select:
     - **Parent Model:** "Alzheimer's Detection QNN - QCI Photonic"
     - **Fine-tuning:** Enabled
   - This creates a new model version
   - Inherits architecture from parent
   - Trains on new data

4. **Compare Model Versions:**
   - View both models side-by-side
   - Compare metrics:
     - Original: 89% accuracy
     - Fine-tuned: 92% accuracy
   - Evaluate which to deploy

5. **Deploy Best Model:**
   - Archive old model
   - Host new fine-tuned model
   - Update inference endpoint

---

### Using Datasets Across Multiple Jobs

**Scenario:** Reuse datasets for different problem types

1. **Dataset Reusability:**
   - Upload dataset once
   - Use in multiple jobs
   - Example: "Financial Portfolio Data Q3 2024"

2. **Different Job Types:**
   - **Job 1:** Optimization - Portfolio allocation
   - **Job 2:** Simulation - Risk analysis
   - **Job 3:** ML - Feature selection

3. **Benefits:**
   - No need to re-upload data
   - Consistent data across experiments
   - Track dataset usage
   - Version control (future feature)

---

### Monitoring Model Performance

**Scenario:** Track model performance over time

1. **View Model Statistics:**
   - Navigate to Model Detail → Test Model Tab
   - View aggregated statistics:
     - Total predictions: 150
     - Average confidence: 91.5%
     - Prediction distribution
     - Recent trend analysis

2. **Review Inference History:**
   - Scroll through individual predictions
   - Filter by date range
   - Identify patterns:
     - Low confidence predictions
     - Misclassifications
     - Performance degradation

3. **Model Health Monitoring:**
   - Check prediction count trends
   - Monitor confidence distributions
   - Identify when retraining needed
   - Set up alerts (future feature)

---

### Multi-Provider Comparison

**Scenario:** Compare results across different quantum providers

1. **Create Parallel Jobs:**
   - Same dataset
   - Same configuration
   - Different providers:
     - Job 1: QCI (Photonic)
     - Job 2: IonQ (Trapped Ion)
     - Job 3: IBM Quantum (Superconducting)

2. **Compare Results:**
   - Execution times
   - Costs
   - Model accuracy
   - Training stability

3. **Select Best Provider:**
   - Based on:
     - Accuracy
     - Cost efficiency
     - Latency
     - Availability

---

## Multi-Modal Zip Upload Workflow

### Overview

This workflow demonstrates uploading and processing multi-modal patient data in ZIP format. The system extracts patient IDs and classifications from directory structures and prepares the data for model training.

### Step 1: Upload ZIP File

**Objective:** Upload a zip file containing multi-modal patient data

1. **Navigate to Datasets Page**
   - URL: http://localhost:3000/datasets
   - Click **"Upload Dataset"** button

2. **Select ZIP File**
   - In Step 1 (Upload Data), drag and drop or select a ZIP file
   - Supported structure: `data/{patientIDHash}{Classification}/videos|reports|metadata/`
   - Example: `data/0X1AEE3CDCAEC1A61Critical/videos/`, `data/0X1AEE3CDCAEC1A61Critical/reports/`, etc.
   - File size limit: 100MB (for local environment)

3. **File Detected**
   - System detects ZIP format
   - File format badge shows "ZIP"
   - Data type shows "mixed"

### Step 2: Configure Labeling Structure

**Objective:** Select or configure the pattern for extracting patient IDs and classifications

1. **Step 2: Labeling Structure Configuration**
   - System shows available patterns:
     - **Pattern 1:** `{patientIDHash}{Classification}` (e.g., 0X1AEE3CDCAEC1A61Critical)
     - **Pattern 2:** `{patientID}_{Classification}` (e.g., patient123_Critical)
     - **Pattern 3:** `{patientID}-{Classification}` (e.g., patient123-Critical)
   - **Custom Pattern:** Enter regex pattern for custom structures

2. **Select Pattern**
   - Click on pattern to select (for ejection fraction example, select Pattern 1)
   - Or enter custom regex pattern
   - Pattern preview shows example match

3. **Click "Start Processing"**
   - Dataset record is created
   - File is uploaded
   - Background processing begins

### Step 3: Monitor Processing Progress

**Objective:** Watch the dataset being processed through multiple stages

1. **Processing Stages Display**
   - **Uploading** (0-25%): File upload in progress
   - **Analyzing** (25-50%): Analyzing directory structure
   - **Parsing** (50-75%): Extracting patient IDs and classifications
   - **Completed** (100%): Processing finished

2. **Real-Time Updates**
   - Progress bar updates automatically
   - Stage indicators show current status
   - Polling every 2 seconds for status updates

3. **Error Handling**
   - If validation errors occur, they are displayed
   - Shows which directories/files failed
   - Allows partial processing if some records are valid

### Step 4: Review Summary

**Objective:** Review processed dataset information before saving

1. **Label Structure Breakdown**
   - Total patient records count
   - Count per classification (Critical, Urgent, Emergent, Normal)
   - Classification distribution visualization

2. **Split Estimates**
   - Training: 70% (default)
   - Validation: 20%
   - Test: 10%
   - Shows exact counts and percentages

3. **Metadata Summary**
   - Total files processed
   - Total size
   - File type breakdown (videos, reports, metadata)

4. **Click "Save Dataset"**
   - Dataset is finalized and ready for use
   - Navigates to dataset detail page

### Sample Data Structure

For the ejection fraction example, the ZIP file should contain:

```
data/
├── 0X1AEE3CDCAEC1A61Critical/
│   ├── videos/
│   │   └── 0X1AEE3CDCAEC1A61_echo.avi
│   ├── reports/
│   │   └── 0X1AEE3CDCAEC1A61_report.pdf
│   └── metadata/
│       └── 0X1AEE3CDCAEC1A61_metadata.json
├── 0X1B7B728C3E99A716Urgent/
│   ├── videos/
│   ├── reports/
│   └── metadata/
└── ...
```

**Classifications:**
- **Critical**: Ejection fraction < 30%
- **Urgent**: Ejection fraction 30-40%
- **Emergent**: Ejection fraction 40-50%
- **Normal**: Ejection fraction > 50%

---

## Reinforcement Learning Feedback

### Overview

After a model makes a prediction, users can provide feedback to improve the model through reinforcement learning. This feedback is stored for future model retraining.

### Step 1: Test Model with New File

**Objective:** Upload a file and get a prediction

1. **Navigate to Model Detail Page**
   - URL: http://localhost:3000/models/{modelId}
   - Go to **"Test Model"** tab

2. **Upload Test File**
   - Drag and drop or select a file (image, video, etc.)
   - Click **"Run Prediction"**

3. **View Prediction Results**
   - Prediction classification displayed
   - Confidence score shown
   - Class probabilities visualized

### Step 2: View Recommendations

**Objective:** See action items based on the prediction

1. **Recommendations Display**
   - Recommendations appear below prediction results
   - Based on model's recommendations configuration
   - Different recommendations for each classification:
     - **Critical**: Immediate medical intervention required, etc.
     - **Urgent**: Schedule evaluation within 24 hours, etc.
     - **Emergent**: Schedule follow-up within 48 hours, etc.
     - **Normal**: Continue routine monitoring, etc.

2. **Review Action Items**
   - Each recommendation shown as a bullet point
   - Critical classifications highlighted

### Step 3: Provide Feedback

**Objective:** Accept or correct the prediction

1. **Accept Prediction**
   - Click **"Accept Prediction"** button
   - Feedback is saved as "accepted"
   - Interaction is marked as successful

2. **Correct Prediction**
   - Click **"Correct Prediction"** button
   - Feedback form appears:
     - **Corrected Classification:** Dropdown populated with model-specific classifications (e.g., ["Critical", "Urgent", "Emergent", "Normal"] for ejection fraction model, or ["healthy", "atrophy"] for Alzheimer's model)
     - **Feedback / Notes:** Text area for specific feedback
   - Enter corrected classification and notes
   - Click **"Submit Feedback"**

3. **Feedback Stored**
   - Feedback is saved to `ModelInteraction.user_feedback`
   - Feedback type is stored (`accepted` or `corrected`)
   - Recommendations shown are recorded
   - Available for future RL training

### Step 4: Review Feedback History

**Objective:** View all feedback provided for a model

1. **Navigate to Interactions Tab**
   - On Model Detail page
   - View all model interactions

2. **Filter by Feedback**
   - See interactions with feedback
   - View corrected predictions
   - Review feedback notes

---

## Model Recommendations Configuration

### Overview

Model owners can configure rules-based recommendations that are shown to users when the model predicts specific classifications. These recommendations are action items based on classification thresholds.

### Step 1: Navigate to Recommendations Tab

**Objective:** Access recommendations configuration

1. **Go to Model Detail Page**
   - URL: http://localhost:3000/models/{modelId}
   - Click **"Recommendations"** tab

2. **View Current Configuration**
   - See existing recommendations per classification
   - Or see empty state if not configured

### Step 2: Configure Recommendations

**Objective:** Set action items for each classification

1. **For Each Classification**
   - **Critical**: Add action items
     - Example: "Immediate medical intervention required"
     - Example: "Notify attending physician immediately"
   - **Urgent**: Add action items
     - Example: "Schedule evaluation within 24 hours"
   - **Emergent**: Add action items
     - Example: "Schedule follow-up within 48 hours"
   - **Normal**: Add action items
     - Example: "Continue routine monitoring"

2. **Add Action Items**
   - Click **"Add"** button next to classification
   - Enter action item text
   - Press Enter or click **"Add"** button
   - Repeat for multiple items

3. **Remove Action Items**
   - Click **X** button next to item to remove

4. **Click "Save Recommendations"**
   - Configuration is saved to `Model.recommendations_config`
   - Recommendations will be shown for future predictions

### Step 3: Test Recommendations

**Objective:** Verify recommendations appear correctly

1. **Go to Test Model Tab**
   - Upload a test file
   - Get a prediction

2. **Verify Recommendations**
   - Recommendations section appears below prediction
   - Shows action items for the predicted classification
   - Matches the configured recommendations

---

## Troubleshooting

### Common Issues

1. **Services Not Starting:**
   ```bash
   # Check container status
   docker-compose ps
   
   # View logs
   docker-compose logs backend
   docker-compose logs frontend
   ```

2. **Database Connection Issues:**
   ```bash
   # Restart database
   docker-compose restart postgres
   
   # Check database logs
   docker-compose logs postgres
   ```

3. **Seed Script Errors:**
   ```bash
   # Run migrations first
   docker-compose exec backend alembic upgrade head
   
   # Then run seed scripts
   docker-compose exec backend python -m scripts.seed_demo
   ```

4. **Port Conflicts:**
   - Check if ports 3000, 5432, or 8000 are in use
   - Modify `docker-compose.yml` to use different ports
   - Or stop conflicting services

### Getting Help

- **API Documentation:** http://localhost:8000/docs
- **Application Help:** http://localhost:3000/help
- **Documentation:** http://localhost:3000/documentation

---

## Demo Script Summary

### Quick Demo Flow (5 minutes)

1. **Login** → admin@acme.com / demo123!
2. **Dashboard** → Review overview, recent activity
3. **New Project** → Select "Alzheimer's MRI Brain Scans - Batch 01"
4. **Configure** → Machine Learning, QCI provider
5. **Submit** → Watch progress bar (8-10 seconds)
6. **View Model** → Check metrics, test inference
7. **Upload Image** → Get prediction result

### Extended Demo Flow (15 minutes)

1. **Complete Quick Demo Flow** (above)
2. **Explore Jobs Page** → Filter by status, view details
3. **Explore Models Page** → Compare different models
4. **Explore Datasets Page** → Review dataset statistics
5. **Explore Providers Page** → Compare provider specs
6. **Upload Multi-Modal ZIP Dataset** → Show zip upload workflow with labeling structure
7. **Configure Model Recommendations** → Set action items for classifications
8. **Test Model with Feedback** → Upload file, view recommendations, provide feedback

### Full Demo Flow (30 minutes)

1. **Complete Extended Demo Flow** (above)
2. **Multi-Modal ZIP Upload** → Upload ejection fraction dataset, configure labeling, review summary
3. **Model Recommendations** → Configure recommendations for each classification
4. **RL Feedback Workflow** → Test model, view recommendations, provide corrections
5. **Retraining Scenario** → Upload new dataset, fine-tune model
6. **Multi-Provider Comparison** → Create parallel jobs
7. **Model Performance Analysis** → Review inference history and feedback
8. **Dataset Reusability** → Use same dataset for different jobs
9. **Admin Features** → User management, account settings (if admin)

---

## Key Talking Points

### During Demo

1. **Quantum Advantage:**
   - Explain why quantum ML for medical imaging
   - QCI photonic technology benefits
   - Room temperature operation

2. **End-to-End Workflow:**
   - Emphasize seamless experience
   - From data to deployed model
   - Real-time progress tracking

3. **Model Management:**
   - Version control
   - Performance monitoring
   - Easy retraining

4. **Provider Flexibility:**
   - Multiple quantum providers
   - Compare and choose
   - No vendor lock-in

5. **Enterprise Features:**
   - Multi-tenant architecture
   - User management
   - Audit trails
   - Cost tracking

---

## Conclusion

This demo workflow showcases QuantumCue as a complete quantum computing marketplace and orchestration platform. The end-to-end journey from dataset upload to model deployment and inference demonstrates the platform's capabilities for quantum machine learning applications.

For additional information, refer to:
- [README.md](../README.md) - Setup and development guide
- [DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md) - Database schema documentation
- [demo-features-prd.md](./demo-features-prd.md) - Feature specifications
