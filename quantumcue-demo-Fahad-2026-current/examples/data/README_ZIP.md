# Ejection Fraction Sample Dataset

This ZIP file contains a sample multi-modal dataset for ejection fraction classification.

## Structure

The ZIP file follows the pattern: `data/{patientIDHash}{Classification}/`

```
data/
├── 0X1AEE3CDCAEC1A61Critical/
│   ├── videos/
│   │   └── 0X1AEE3CDCAEC1A61.avi
│   ├── reports/
│   │   └── 0X1AEE3CDCAEC1A61_report.pdf
│   └── metadata/
│       └── 0X1AEE3CDCAEC1A61_metadata.json
├── 0X1B7B728C3E99A716Urgent/
│   ├── videos/
│   │   └── 0X1B7B728C3E99A716.avi
│   ├── reports/
│   │   └── 0X1B7B728C3E99A716_report.pdf
│   └── metadata/
│       └── 0X1B7B728C3E99A716_metadata.json
```

## Classifications

- **Critical**: Ejection fraction < 30% (1 patient)
- **Urgent**: Ejection fraction 30-40% (1 patient)
- **Emergent**: Ejection fraction 40-50% (0 patients in this sample)
- **Normal**: Ejection fraction > 50% (0 patients in this sample)

## Labeling Pattern

Pattern Type: `patient_id_hash_classification`

- Patient ID: 16-character hexadecimal hash (e.g., `0X1AEE3CDCAEC1A61`)
- Classification: One of `Critical`, `Urgent`, `Emergent`, or `Normal`
- Format: `{patientIDHash}{Classification}` (no separator)

## File Types

- **Videos**: `.avi` files containing echocardiogram video data
- **Reports**: `.pdf` files containing medical reports
- **Metadata**: `.json` files containing structured patient data including:
  - Patient ID
  - Classification
  - Ejection fraction percentage
  - Age, gender
  - Study date and findings
  - Recommendations

## Usage

1. Upload this ZIP file through the Dataset Upload Wizard
2. Select the labeling pattern: `patient_id_hash_classification`
3. The system will process and extract:
   - Patient IDs and classifications
   - File counts per patient
   - Classification distribution
   - Training/validation/test split estimates

## File Size

- Total size: ~1.5 MB
- Contains 2 patient records
- 2 video files, 2 report files, 2 metadata files

