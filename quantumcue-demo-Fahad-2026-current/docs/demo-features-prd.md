# QuantumCue Demo Features PRD

**Stakeholder Review Document: QCI Integration Demo & Feature Enhancements**

## 1. Demo Objective & Narrative

**Goal:** Demonstrate the end-to-end workflow of a user leveraging QuantumCue to train a custom Quantum Machine Learning (QML) model using **QCI (Quantum Computing Inc)** hardware.

**The "Story":**
A medical researcher uploads a dataset of brain scans (MRI images) to train a Quantum Neural Network (QNN). They configure the job to run on QCI's photonic hardware, review the estimated price range, and subsequently use the hosted model to infer diagnosis on a new patient scan.

**Demo Use Case:** Alzheimer's Detection using Quantum Neural Networks
- **Dataset**: Brain scan images (MRI) with labeled folders
- **Model**: Variational Quantum Classifier (VQC) / Quantum Neural Network (QNN)
- **Provider**: QCI Photonic Series 1
- **Outcome**: Trained model deployed for real-time inference

---

## 2. Current Data Model

### Overview

The current QuantumCue data model supports multi-tenant accounts with users, quantum job execution, and provider management. The following is a comprehensive overview of the existing schema.

### Entity Relationship Diagram

```
Account (1) ──────< (N) User
    │
    │ (1)
    │
    └──────< (N) Dataset
    │
    └──────< (N) Job ──────< (N) JobAudit
    │              │
    │              └──────< (1) Model (produced by)
    │
    └──────< (N) ProviderAccount >──────(1) Provider
```

### Core Models (Existing)

#### Account
- **Purpose**: Multi-tenant organization container
- **Key Fields**:
  - `id` (UUID, PK)
  - `name` (String)
  - `status` (Enum: active, suspended, cancelled)
  - `tier` (Enum: free, starter, professional, enterprise)
  - `data_budget_mb` (Integer, default: 1024)
  - `data_used_mb` (Integer, default: 0)
  - `settings` (JSONB)
  - `created_at`, `updated_at` (Timestamps)

#### User
- **Purpose**: Authentication and user profile
- **Key Fields**:
  - `id` (UUID, PK)
  - `account_id` (UUID, FK → Account)
  - `email` (String, unique)
  - `password_hash` (String)
  - `first_name`, `last_name` (String, nullable)
  - `role` (Enum: admin, user)
  - `status` (Enum: active, inactive, pending)
  - `preferences` (JSONB)
  - `last_login_at` (DateTime, nullable)
  - `created_at`, `updated_at` (Timestamps)

#### Provider
- **Purpose**: Quantum computing provider information
- **Key Fields**:
  - `id` (UUID, PK)
  - `name`, `code` (String, code is unique, e.g., "qci", "dwave", "ionq")
  - `description` (Text)
  - `provider_type` (Enum: quantum_annealer, gate_based, photonic, trapped_ion, superconducting, neutral_atom)
  - `status` (Enum: online, offline, degraded, maintenance)
  - Hardware specs: `qubit_count`, `gate_fidelity_1q`, `gate_fidelity_2q`, etc.
  - `supported_algorithms`, `supported_problem_types` (JSONB)
  - `pricing_model`, `price_per_shot`, `price_per_task` (Float)
  - `queue_depth`, `avg_queue_time_seconds` (Integer)
  - `created_at`, `updated_at` (Timestamps)

#### ProviderAccount
- **Purpose**: Links accounts to providers with credentials
- **Key Fields**:
  - `id` (UUID, PK)
  - `account_id` (UUID, FK → Account)
  - `provider_id` (UUID, FK → Provider)
  - `api_key_encrypted`, `api_token_encrypted` (String, nullable)
  - `external_account_id` (String, nullable)
  - `status` (Enum: active, inactive, pending, error)
  - `settings` (JSONB)
  - `created_at`, `updated_at` (Timestamps)

#### Job (Existing - Enhanced for Demo)
- **Purpose**: Quantum computing job execution
- **Key Fields** (Existing):
  - `id` (UUID, PK)
  - `account_id` (UUID, FK → Account)
  - `created_by_id` (UUID, FK → User, nullable)
  - `provider_id` (UUID, FK → Provider, nullable)
  - `name`, `description` (String/Text)
  - `job_type` (Enum: optimization, simulation, machine_learning, chemistry, custom)
  - `status` (Enum: draft, pending, queued, running, completed, failed, cancelled)
  - `priority` (Enum: low, normal, high, urgent)
  - `input_data_type`, `input_data_ref` (String, nullable)
  - `parameters` (JSONB, nullable)
  - `qubit_count_requested`, `shot_count`, `optimization_level` (Integer)
  - `result_data`, `result_summary` (JSONB/Text, nullable)
  - `error_message` (Text, nullable)
  - `execution_time_ms`, `queue_time_ms`, `total_cost` (Integer/Float, nullable)
  - `submitted_at`, `started_at`, `completed_at` (DateTime, nullable)
  - `chat_history` (JSONB, nullable)
  - `created_at`, `updated_at` (Timestamps)

- **Enhanced Fields for Demo** (New):
  - `dataset_id` (UUID, FK → Dataset, nullable) - Link to uploaded dataset
  - `provider_code` (String, nullable) - Provider code for quick lookup (e.g., "qci")
  - `provider_metadata` (JSONB, nullable) - Specific provider machine specs at runtime
    ```json
    {
      "machine": "QCI Photonic Series 1",
      "region": "us-east-1",
      "queue_time_ms": 450,
      "execution_time_ms": 124000,
      "machine_id": "qci-photonic-v1-001"
    }
    ```
  - `job_metadata` (JSONB, nullable) - Quantum circuit and compilation details
    ```json
    {
      "circuit_depth": 45,
      "gate_count": 1200,
      "entanglement_entropy": 0.85,
      "compilation_time_ms": 120,
      "ansatz_type": "PhotonicLayer",
      "optimization_level": 2
    }
    ```
  - `cost_min_est` (Float, nullable) - Minimum estimated cost
  - `cost_max_est` (Float, nullable) - Maximum estimated cost
  - `cost_actual` (Float, nullable) - Actual cost after completion
  - `cost_breakdown` (JSONB, nullable) - Detailed cost breakdown
    ```json
    {
      "compute_cost": 450.00,
      "storage_cost": 10.00,
      "data_transfer_cost": 5.00,
      "total": 465.00,
      "currency": "USD",
      "billing_basis": "per_shot_and_duration"
    }
    ```
  - `progress_percentage` (Integer, 0-100, nullable) - Current training progress
  - `current_epoch` (Integer, nullable) - Current training epoch
  - `total_epochs` (Integer, nullable) - Total epochs planned
  - `training_metrics_history` (JSONB, nullable) - Per-epoch metrics array
    ```json
    [
      {
        "epoch": 1,
        "loss": 0.9,
        "accuracy": 0.65,
        "validation_loss": 0.95,
        "validation_accuracy": 0.62,
        "timestamp": "2024-12-06T10:00:00Z"
      },
      {
        "epoch": 5,
        "loss": 0.7,
        "accuracy": 0.75,
        "validation_loss": 0.75,
        "validation_accuracy": 0.72,
        "timestamp": "2024-12-06T10:15:00Z"
      }
    ]
    ```
  - `final_metrics` (JSONB, nullable) - Final training metrics
    ```json
    {
      "final_accuracy": 0.89,
      "final_loss": 0.12,
      "validation_accuracy": 0.87,
      "validation_loss": 0.15,
      "f1_score": 0.88,
      "precision": 0.90,
      "recall": 0.86,
      "roc_auc": 0.92
    }
    ```
  - `logs` (Text, nullable) - Training logs (can be large, consider external storage)
  - `checkpoints` (JSONB, nullable) - Training checkpoint information
  - `display_id` (String, unique, nullable) - Human-readable job ID (e.g., "QC-2024-001")

#### JobAudit
- **Purpose**: Audit trail for job changes
- **Key Fields**:
  - `id` (UUID, PK)
  - `job_id` (UUID, FK → Job)
  - `user_id` (UUID, FK → User, nullable)
  - `action` (String)
  - `previous_status`, `new_status` (String, nullable)
  - `details` (JSONB, nullable)
  - `ip_address` (String, nullable)
  - `created_at`, `updated_at` (Timestamps)

---

## 3. Enhanced Data Model for Demo

### New Models

#### Dataset
- **Purpose**: Store uploaded datasets for reuse across multiple jobs
- **Key Fields**:
  - `id` (UUID, PK)
  - `account_id` (UUID, FK → Account)
  - `created_by_id` (UUID, FK → User)
  - `name` (String) - User-friendly name
  - `description` (Text, nullable)
  - `file_path` (String) - Storage location (S3 path, local path, etc.)
  - `file_size_bytes` (BigInteger) - Total file size in bytes
  - `file_format` (Enum: csv, json, parquet, images, image_directory, zip, txt)
  - `data_type` (Enum: structured, unstructured, images, text, mixed)
  - `row_count` (Integer, nullable) - Number of rows/samples
  - `column_count` (Integer, nullable) - Number of columns/features (for structured data)
  - `schema` (JSONB, nullable) - Column definitions, types, etc.
    ```json
    {
      "columns": [
        {"name": "patient_id", "type": "string", "nullable": false},
        {"name": "age", "type": "integer", "nullable": false},
        {"name": "diagnosis", "type": "string", "nullable": false}
      ],
      "primary_key": ["patient_id"]
    }
    ```
  - `statistics` (JSONB, nullable) - Dataset statistics
    ```json
    {
      "total_images": 5000,
      "resolution": "256x256",
      "class_balance": {
        "healthy": 2500,
        "atrophy": 2500
      },
      "size_gb": 12.5,
      "format": "png",
      "label_structure": "folder_based"
    }
    ```
  - `metadata` (JSONB, nullable) - Custom metadata, tags, etc.
    ```json
    {
      "tags": ["medical", "brain-scans", "alzheimers"],
      "source": "internal_research",
      "license": "proprietary",
      "version": "1.0"
    }
    ```
  - `status` (Enum: uploading, processing, ready, error) - Dataset processing status
  - `is_public` (Boolean, default: false) - Shareable across account
  - `validation_errors` (JSONB, nullable) - Any validation errors encountered
  - `created_at`, `updated_at` (Timestamps)

#### Model
- **Purpose**: Store trained model artifacts and metadata
- **Key Fields**:
  - `id` (UUID, PK)
  - `account_id` (UUID, FK → Account)
  - `created_by_id` (UUID, FK → User)
  - `name` (String) - User-friendly model name
  - `description` (Text, nullable)
  - `model_type` (Enum: qnn, vqc, qsvm, generative, custom) - Type of quantum ML model
  - `model_architecture` (JSONB) - Architecture definition
    ```json
    {
      "type": "VariationalQuantumClassifier",
      "layers": [
        {"type": "feature_map", "qubits": 12, "reps": 2},
        {"type": "ansatz", "qubits": 12, "depth": 3, "ansatz_type": "PhotonicLayer"},
        {"type": "measurement", "observables": ["Z"]}
      ],
      "input_dim": 256,
      "output_dim": 2
    }
    ```
  - `model_weights_path` (String, nullable) - Storage location for weights (S3, local, etc.)
  - `model_config` (JSONB) - Model configuration/parameters used during training
    ```json
    {
      "learning_rate": 0.05,
      "optimizer": "ADAM",
      "batch_size": 32,
      "epochs": 50,
      "qubits": 12,
      "shots": 2000,
      "ansatz_type": "PhotonicLayer"
    }
    ```
  - `training_job_id` (UUID, FK → Job) - Job that created this model
  - `dataset_id` (UUID, FK → Dataset) - Dataset used for training
  - `provider_id` (UUID, FK → Provider) - Provider used for training
  - `version` (Integer, default: 1) - Model version number
  - `parent_model_id` (UUID, FK → Model, nullable) - For fine-tuning/iterations
  - `metrics` (JSONB) - Training metrics
    ```json
    {
      "final_accuracy": 0.89,
      "training_loss": [0.9, 0.7, 0.4, 0.12],
      "validation_accuracy": 0.87,
      "f1_score": 0.88
    }
    ```
  - `evaluation_results` (JSONB, nullable) - Test set evaluation results
    ```json
    {
      "test_accuracy": 0.85,
      "test_loss": 0.18,
      "confusion_matrix": [[450, 50], [60, 440]],
      "classification_report": {
        "precision": 0.88,
        "recall": 0.86,
        "f1_score": 0.87
      }
    }
    ```
  - `status` (Enum: training, ready, hosted_active, archived, error)
  - `hosting_endpoint` (String, nullable) - API endpoint for hosted model
    - Example: `https://api.quantumcue.com/inference/v1/models/{model_id}`
  - `hosting_status` (Enum: not_hosted, deploying, active, error, nullable)
  - `prediction_count` (Integer, default: 0) - Number of predictions made
  - `last_used_at` (DateTime, nullable) - Last interaction timestamp
  - `usage_stats` (JSONB, nullable) - Aggregated usage statistics
  - `created_at`, `updated_at` (Timestamps)
  - `display_id` (String, unique, nullable) - Human-readable model ID (e.g., "MODEL-2024-001")

#### ModelInteraction
- **Purpose**: Track user interactions with trained models (predictions, evaluations, etc.)
- **Key Fields**:
  - `id` (UUID, PK)
  - `model_id` (UUID, FK → Model)
  - `user_id` (UUID, FK → User)
  - `interaction_type` (Enum: inference_single, inference_batch, evaluation, fine_tune)
  - `input_data` (JSONB, nullable) - Input data for interaction
    ```json
    {
      "type": "image",
      "file_name": "patient_doe_scan.png",
      "dimensions": [256, 256],
      "size_bytes": 245760
    }
    ```
  - `input_metadata` (JSONB, nullable) - Additional input metadata
  - `output_data` (JSONB, nullable) - Model output/predictions
    ```json
    {
      "prediction": "Early-Stage Alzheimer's",
      "confidence": 0.942,
      "class_probabilities": {
        "healthy": 0.058,
        "early_stage_alzheimers": 0.942
      },
      "latency_ms": 125
    }
  ```
  - `result_metadata` (JSONB, nullable) - Additional result metadata
    ```json
    {
      "confidence": 0.942,
      "latency_ms": 125,
      "backend": "quantum_simulation",
      "qubits_used": 12
    }
    ```
  - `metadata` (JSONB, nullable) - Additional interaction metadata
  - `created_at` (Timestamp)

---

## 4. User Experience Flow (Step-by-Step Demo)

### Phase 1: Ingestion & Definition

#### Step 1: Data Upload & Job Initialization

**UI Location**: Main Dashboard → "New Project" button → "Upload Data" option

**User Actions**:
- User clicks "New Project" and selects "Upload Data"
- User drags and drops a ZIP file named `alzheimers_mri_batch_01.zip` (containing labeled folders of images)
- User inputs **Job Name:** "Alzheimers Detection QNN - QCI Phase 1"
- User inputs **Description:** "Training a Variational Quantum Classifier on MRI data using QCI photonic backbone."

**System Actions**:
- Backend validates file structure (Images + Folder Labels)
- CSV support is disabled for this specific demo flow (image-based only)
- Dataset record created with status "uploading"
- File uploaded to storage (S3 or local)
- Background job processes dataset to extract metadata

**Data Model Impact**:
- New `Dataset` record created
- `Job` record created in "draft" status
- `Job.dataset_id` linked to new dataset

#### Step 2: Problem Type Selection

**UI Location**: Job Configuration Wizard → Step 2

**User Actions**:
- User selects the **Problem Type**: "Quantum Machine Learning (QML)"

**System Actions**:
- System filters available Providers list based on problem type
- QCI is highlighted as the "Recommended Partner" for high-dimensional feature mapping
- UI shows provider compatibility matrix

**Data Model Impact**:
- `Job.job_type` set to "machine_learning"
- Provider recommendations stored in session/cache

#### Step 3: Data Mapping & Review

**UI Location**: Job Configuration Wizard → Step 3

**User Actions**:
- User verifies that Folder Names = Class Labels (e.g., "Healthy" vs. "Atrophy")
- User reviews dataset metadata card

**System Display**:
- **Dataset Metadata Card**:
  - Total Images: 5,000
  - Resolution: 256x256 (Auto-resized)
  - Class Balance: 50/50
  - Format: PNG
  - Size: 12.5 GB
  - Label Structure: Folder-based

**Data Model Impact**:
- `Dataset.statistics` populated with parsed metadata
- `Dataset.status` updated to "ready"
- `Dataset.schema` populated with class labels

### Phase 2: Configuration & Submission

#### Step 4: Provider & Machine Selection

**UI Location**: Job Configuration Wizard → Step 4

**User Actions**:
- User selects Provider: **QCI**
- User selects Machine: **QCI Photonic Series 1**

**System Display**:
- **Provider Status Card**:
  - System Status: Online
  - Queue Depth: Low (< 2 mins)
  - Capabilities: All-to-All Connectivity, High Coherence
  - Estimated Availability: Immediate

**Data Model Impact**:
- `Job.provider_id` set to QCI provider
- `Job.provider_code` set to "qci"
- Provider metadata cached for display

#### Step 5: Quantum Parameter Configuration

**UI Location**: Job Configuration Wizard → Step 5

**User Actions**:
- User configures quantum parameters:
  - **Ansatz Type:** `PhotonicLayer`
  - **Qubits (Modes):** `12`
  - **Shots:** `2000`
  - **Optimization:** `GradientDescent` (or ADAM)
  - **Learning Rate:** `0.05`
  - **Epochs:** `50`
  - **Batch Size:** `32`

**System Actions**:
- Parameters validated against provider capabilities
- Cost estimation calculated based on parameters

**Data Model Impact**:
- `Job.parameters` populated with quantum config
  ```json
  {
    "quantum_config": {
      "backend": "qci_photonic_v1",
      "qubits": 12,
      "shots": 2000,
      "ansatz_type": "PhotonicLayer",
      "parameters": {
        "learning_rate": 0.05,
        "optimizer": "ADAM",
        "epochs": 50,
        "batch_size": 32
      }
    }
  }
  ```
- `Job.qubit_count_requested` set to 12
- `Job.shot_count` set to 2000

#### Step 6: Review & Submit (Price Range)

**UI Location**: Job Configuration Wizard → Step 6 (Review)

**User Actions**:
- User reviews the "Job Summary Card"
- User clicks **"Start Training"**

**System Display**:
- **Job Summary Card**:
  - Input: `alzheimers_mri_batch_01.zip`
  - Model: QNN / QCI Photonic
  - **Estimated Cost:** **$450.00 - $525.00** (Displayed as a range based on estimated convergence time)
  - **Hosting:** "Model will be deployed to QuantumCue Secure Cloud upon completion."
  - Parameters Summary
  - Provider Details

**System Actions**:
- Job enters the database with comprehensive metadata snapshot
- Job status changes from "draft" to "queued"
- Cost estimation stored

**Data Model Impact**:
- `Job.status` updated to "queued"
- `Job.cost_min_est` set to 450.00
- `Job.cost_max_est` set to 525.00
- `Job.submitted_at` set to current timestamp
- Job submission payload created (see JSON examples below)

### Phase 3: Execution & Monitoring (Demo Magic)

#### Step 7: Real-time Status (The Mock)

**UI Location**: Jobs Dashboard → Active Jobs Tab → Job Detail View

**User Actions**:
- User navigates to Jobs Dashboard
- User sees job listed as "In Progress"
- User clicks on job to view details

**System Display**:
- **Real-time Status Updates** (WebSocket/SSE):
  - "Initializing QCI QPU..."
  - "Encoding Classical Data to Quantum States..."
  - "Minimizing Loss Function (Epoch 5/50)..."
  - Progress bar showing percentage complete
  - Live metrics chart (loss, accuracy over epochs)

**System Actions**:
- WebSocket/SSE pushes status updates
- Training metrics updated in real-time
- Progress percentage calculated and updated

**Data Model Impact**:
- `Job.status` updated to "running"
- `Job.started_at` set when execution begins
- `Job.progress_percentage` updated periodically
- `Job.current_epoch` updated each epoch
- `Job.training_metrics_history` appended with each epoch
- `Job.job_metadata` updated with circuit compilation details

**Notification**:
- Push notification: "Training Complete. Model deployed and ready for inference."

### Phase 4: Results & Interaction

#### Step 8: Job Results View

**UI Location**: Jobs Dashboard → Completed Jobs → Job Detail View

**User Actions**:
- User clicks the completed job
- User navigates through result tabs

**System Display**:
- **Overview Tab**:
  - Job name, status, dates, provider
  - Final cost: $482.50
  - Duration: 2 hours 4 minutes
  - Provider: QCI Photonic Series 1

- **Performance Tab**:
  - Accuracy graph (Training vs. Validation) over epochs
  - Loss graph over epochs
  - Final metrics summary:
    - Final Accuracy: 89%
    - Validation Accuracy: 87%
    - F1 Score: 0.88

- **Quantum Details Tab**:
  - Circuit Depth: 45
  - Gate Count: 1200
  - Gate Fidelity: 99.9%
  - Entanglement Entropy: 0.85
  - Compilation Time: 120ms

- **Cost Breakdown Tab**:
  - Compute Cost: $450.00
  - Storage Cost: $10.00
  - Data Transfer Cost: $5.00
  - Total: $482.50

- **Model Tab**:
  - Model information
  - Download model button
  - Deploy model button

**Data Model Impact**:
- `Job.status` updated to "completed"
- `Job.completed_at` set to completion timestamp
- `Job.cost_actual` set to 482.50
- `Job.final_metrics` populated
- `Job.provider_metadata` populated with runtime details
- `Job.job_metadata` populated with circuit details
- New `Model` record created
- `Model.status` set to "ready"
- `Model.hosting_status` set to "deploying" then "active"

#### Step 9: Interactive Inference (Hosted Model)

**UI Location**: Models Library → Model Detail → "Test Model" Tab

**User Actions**:
- User navigates to Models Library
- User clicks on the trained model
- User clicks **"Test Model"** tab
- User uploads a single new image: `patient_doe_scan.png`

**System Process**:
- Image sent to hosted model endpoint (serverless wrapper around QCI-trained weights)
- Inference performed (may use quantum simulation or classical backend)
- Results returned

**System Display**:
- **Prediction Result**:
  - **Prediction:** "Early-Stage Alzheimer's"
  - **Confidence:** 94.2%
  - **Class Probabilities:**
    - Healthy: 5.8%
    - Early-Stage Alzheimer's: 94.2%
  - **Latency:** 125ms
  - **Backend:** Quantum Simulation

**Data Model Impact**:
- New `ModelInteraction` record created
- `ModelInteraction.interaction_type` set to "inference_single"
- `ModelInteraction.input_data` populated with image metadata
- `ModelInteraction.output_data` populated with prediction results
- `Model.prediction_count` incremented
- `Model.last_used_at` updated

---

## 5. UI/Tab Structure for Demo

### Main Navigation

1. **Dashboard** (Home)
   - Overview cards (active jobs, models, datasets)
   - Recent activity feed
   - Quick actions (New Project, Upload Data)

2. **Jobs** (Primary Demo Flow)
   - **Tabs**:
     - **Active** - Running/queued jobs with real-time updates
     - **History** - All completed/failed jobs
     - **Drafts** - Unsubmitted job configurations
   - **Job Detail View** (when clicking a job):
     - **Overview Tab** - Basic info, status, dates, cost
     - **Configuration Tab** - Parameters, provider, dataset
     - **Progress Tab** - Real-time training metrics, charts
     - **Results Tab** - Final metrics, model info, download
     - **Quantum Details Tab** - Circuit info, gate counts, fidelity
     - **Cost Tab** - Cost breakdown and billing details
     - **Logs Tab** - Training logs and errors

3. **Models** (Post-Training)
   - **Tabs**:
     - **All Models** - Grid/list of all trained models
     - **Active** - Currently hosted/deployed models
     - **Archived** - Archived models
   - **Model Detail View** (when clicking a model):
     - **Overview Tab** - Model info, metrics, status
     - **Training Details Tab** - Link to training job, dataset info
     - **Test Model Tab** - Single prediction interface
     - **Batch Prediction Tab** - Upload batch file for predictions
     - **Evaluation Tab** - Evaluate on test dataset
     - **Usage Tab** - Prediction history and statistics

4. **Datasets**
   - **Tabs**:
     - **All Datasets** - List of uploaded datasets
     - **Recent** - Recently uploaded datasets
   - **Dataset Detail View**:
     - **Overview Tab** - Dataset info, statistics
     - **Preview Tab** - Sample data preview
     - **Jobs Tab** - Jobs using this dataset
     - **Settings Tab** - Dataset settings and metadata

5. **Providers**
   - Provider comparison table
   - Provider detail pages with capabilities
   - Account provider connections

### Job Creation Wizard (Multi-Step)

**Step 1: Upload Data**
- File upload interface
- Job name and description

**Step 2: Problem Type**
- Problem type selection (QML, Optimization, etc.)
- Provider recommendations

**Step 3: Data Review**
- Dataset metadata card
- Data mapping verification

**Step 4: Provider Selection**
- Provider selection with status
- Machine/hardware selection

**Step 5: Configuration**
- Quantum parameters
- Training parameters
- Model architecture selection

**Step 6: Review & Submit**
- Job summary card
- Cost estimation
- Submit button

---

## 6. Comprehensive Data Payloads

### Job Submission Payload (Step 6)

```json
{
  "job_submission": {
    "name": "Alzheimers QNN - QCI Run",
    "description": "Training a Variational Quantum Classifier on MRI data using QCI photonic backbone.",
    "job_type": "machine_learning",
    "provider_id": "uuid-qci-provider",
    "dataset_ref": {
      "id": "uuid-dataset-mri-01",
      "type": "image_directory",
      "metadata": {
        "format": "png",
        "count": 5000,
        "size_gb": 12.5,
        "label_structure": "folder_based"
      }
    },
    "quantum_config": {
      "backend": "qci_photonic_v1",
      "qubits": 12,
      "shots": 2000,
      "ansatz_type": "PhotonicLayer",
      "parameters": {
        "learning_rate": 0.05,
        "optimizer": "ADAM",
        "epochs": 50,
        "batch_size": 32
      }
    },
    "cost_estimate": {
      "min": 450.00,
      "max": 525.00,
      "currency": "USD"
    }
  }
}
```

### Completed Job & Metadata (Step 8)

```json
{
  "job_id": "9928-uuid",
  "display_id": "QC-2024-001",
  "status": "completed",
  "financials": {
    "estimate_low": 450.00,
    "estimate_high": 525.00,
    "actual": 482.50,
    "currency": "USD",
    "billing_basis": "per_shot_and_duration",
    "breakdown": {
      "compute_cost": 450.00,
      "storage_cost": 10.00,
      "data_transfer_cost": 5.00,
      "total": 465.00
    }
  },
  "provider_metadata": {
    "machine": "QCI Photonic Series 1",
    "region": "us-east-1",
    "machine_id": "qci-photonic-v1-001",
    "queue_time_ms": 450,
    "execution_time_ms": 124000
  },
  "job_metadata": {
    "circuit_depth": 45,
    "gate_count": 1200,
    "entanglement_entropy": 0.85,
    "compilation_time_ms": 120,
    "gate_fidelity": 0.999,
    "ansatz_type": "PhotonicLayer",
    "optimization_level": 2
  },
  "training_metrics_history": [
    {
      "epoch": 1,
      "loss": 0.9,
      "accuracy": 0.65,
      "validation_loss": 0.95,
      "validation_accuracy": 0.62,
      "timestamp": "2024-12-06T10:00:00Z"
    },
    {
      "epoch": 5,
      "loss": 0.7,
      "accuracy": 0.75,
      "validation_loss": 0.75,
      "validation_accuracy": 0.72,
      "timestamp": "2024-12-06T10:15:00Z"
    },
    {
      "epoch": 50,
      "loss": 0.12,
      "accuracy": 0.89,
      "validation_loss": 0.15,
      "validation_accuracy": 0.87,
      "timestamp": "2024-12-06T12:04:00Z"
    }
  ],
  "final_metrics": {
    "final_accuracy": 0.89,
    "final_loss": 0.12,
    "validation_accuracy": 0.87,
    "validation_loss": 0.15,
    "f1_score": 0.88,
    "precision": 0.90,
    "recall": 0.86,
    "roc_auc": 0.92
  },
  "output_model": {
    "id": "model-uuid-qci-v1",
    "display_id": "MODEL-2024-001",
    "hosting_status": "active",
    "hosting_endpoint": "https://api.quantumcue.com/inference/v1/models/model-uuid-qci-v1",
    "metrics": {
      "final_accuracy": 0.89,
      "training_loss": [0.9, 0.7, 0.4, 0.12],
      "validation_accuracy": 0.87,
      "f1_score": 0.88
    }
  },
  "timestamps": {
    "submitted_at": "2024-12-06T10:00:00Z",
    "started_at": "2024-12-06T10:00:45Z",
    "completed_at": "2024-12-06T12:04:00Z"
  }
}
```

### Model Interaction Payload (Step 9)

```json
{
  "model_interaction": {
    "model_id": "model-uuid-qci-v1",
    "interaction_type": "inference_single",
    "input_data": {
      "type": "image",
      "file_name": "patient_doe_scan.png",
      "dimensions": [256, 256],
      "size_bytes": 245760
    },
    "input_metadata": {
      "uploaded_at": "2024-12-06T14:00:00Z",
      "user_id": "user-uuid"
    },
    "output_data": {
      "prediction": "Early-Stage Alzheimer's",
      "confidence": 0.942,
      "class_probabilities": {
        "healthy": 0.058,
        "early_stage_alzheimers": 0.942
      }
    },
    "result_metadata": {
      "confidence": 0.942,
      "latency_ms": 125,
      "backend": "quantum_simulation",
      "qubits_used": 12,
      "timestamp": "2024-12-06T14:00:01Z"
    }
  }
}
```

---

## 7. Implementation Priorities

### Phase 1: Core Data Model & Migrations
1. Create `Dataset` model and migration
2. Enhance `Job` model with new fields (provider_metadata, job_metadata, cost fields, training metrics)
3. Create `Model` model and migration
4. Create `ModelInteraction` model and migration
5. Update relationships and indexes
6. Add `display_id` fields to Job and Model

### Phase 2: Dataset Management
1. Dataset upload API endpoint
2. Dataset validation and processing service
3. Dataset storage (S3 or filesystem integration)
4. Dataset preview and statistics API
5. Dataset management UI components

### Phase 3: Job Creation Wizard
1. Multi-step wizard UI component
2. File upload with drag-and-drop
3. Problem type selection with provider filtering
4. Dataset review and mapping UI
5. Provider selection with status display
6. Parameter configuration forms
7. Review and submit with cost estimation
8. Job submission API

### Phase 4: Real-time Job Monitoring
1. WebSocket/SSE setup for real-time updates
2. Job status polling service
3. Training metrics update service
4. Active jobs dashboard UI
5. Job detail view with tabs
6. Real-time progress charts
7. Notification system

### Phase 5: Results & Model Management
1. Job results view with all tabs
2. Model creation from completed jobs
3. Model library UI
4. Model detail view with tabs
5. Model hosting service (deployment)
6. Model inference API

### Phase 6: Model Interaction
1. Single prediction API and UI
2. Batch prediction API and UI
3. Model evaluation API and UI
4. Prediction history tracking
5. Usage statistics

### Phase 7: QCI-Specific Integration
1. QCI provider branding and logos
2. QCI-specific metadata capture
3. QCI machine selection UI
4. QCI cost estimation logic
5. QCI job submission adapter (stub for demo)

---

## 8. Open Questions & Decisions Needed

### Data Model
1. **Dataset Storage**: 
   - Decision: S3 for production, local filesystem for demo?
   - How to handle large datasets (50GB+)? Streaming? Chunking?
   - Should we support dataset versioning?

2. **Model Storage**:
   - Decision: S3 for model weights, database for metadata?
   - What format for model weights? (Pickle, ONNX, custom format?)
   - Should we support model versioning and lineage?

3. **Real-time Updates**:
   - Decision: WebSockets vs. Server-Sent Events (SSE) vs. polling?
   - How frequently should metrics be updated?
   - Should we store intermediate metrics or only final?

4. **Logs Management**:
   - Decision: External storage (S3) for large logs, database for summaries?
   - How to handle large log files?
   - Should we support log streaming?

### UI/UX
1. **Metadata Visualization**: 
   - For the QCI demo, do we want to visualize the specific photonic circuit (interferometer mesh) if possible, or just standard gate logic?

2. **Price Range Variance**: 
   - What factors should we say drive the price range? (e.g., "Dependent on convergence speed" or "Queue priority")?

3. **Tab Organization**:
   - Are the proposed tabs intuitive for the demo flow?
   - Should we combine any tabs or split others?

### Demo-Specific
1. **Data Retention**: 
   - Since we are storing "all metadata," do we need a "purge" policy for the demo environment to keep storage costs low, or is this persistent?

2. **Mock Data**:
   - How realistic should the mock training progress be?
   - Should we use pre-generated metrics or simulate in real-time?

3. **Hosting Logic**:
   - For demo, should model hosting be a real endpoint or simulated?
   - How to make the "Test Model" button look like an API call to a live service?

---

## 9. Next Steps

1. **Data Model Design Review**: Review proposed models with team, get approval
2. **Storage Strategy**: Finalize dataset and model storage approach (S3 vs. local)
3. **API Design**: Design REST APIs for all new endpoints
4. **UI/UX Design**: Create detailed wireframes and mockups for all pages/tabs
5. **Real-time Strategy**: Decide on WebSocket vs. SSE vs. polling approach
6. **Prototype**: Build minimal viable prototype of job creation wizard
7. **Testing Strategy**: Define testing approach for new features
8. **Documentation**: Update API and user documentation

---

## 10. Notes

- All new models should follow existing patterns (BaseModel, UUID primary keys, timestamps)
- Consider backward compatibility with existing Job model
- Ensure proper indexing for performance (especially on foreign keys and status fields)
- Plan for scalability (large datasets, many models, high query volume)
- Consider security and access control for datasets and models
- Plan for data migration if needed
- QCI branding and terminology should be consistent throughout
- Demo should feel like a production-ready system, not a prototype
