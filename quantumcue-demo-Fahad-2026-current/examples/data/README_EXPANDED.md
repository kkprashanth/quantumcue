# Ejection Fraction Expanded Dataset

This ZIP file contains an expanded multi-modal dataset for ejection fraction classification with comprehensive examples across all classification categories.

## Structure

The ZIP file follows the pattern: `data/{patientIDHash}{Classification}/`

```
data/
├── 0X1BBA2A3BF9D0DF31Critical/
│   ├── videos/
│   │   └── 0X1BBA2A3BF9D0DF31.avi
│   ├── reports/
│   │   └── 0X1BBA2A3BF9D0DF31_report.pdf
│   └── metadata/
│       └── 0X1BBA2A3BF9D0DF31_metadata.json
├── 0X64D50129BEA0187DCritical/
│   └── ...
├── 0XA2E9301564423BFEUrgent/
│   └── ...
├── 0XFB0F293F4C14A02BEmergent/
│   └── ...
├── 0XFC2A145383D63799Normal/
│   └── ...
└── ... (40 total patient directories)
```

## Classifications

- **Critical**: Ejection fraction < 30% (10 patients)
- **Urgent**: Ejection fraction 30-40% (10 patients)
- **Emergent**: Ejection fraction 40-50% (10 patients)
- **Normal**: Ejection fraction > 50% (10 patients)

## Labeling Pattern

Pattern Type: Regex-based

- Patient ID: 16-character hexadecimal hash with "0X" prefix (e.g., `0X1BBA2A3BF9D0DF31`)
- Classification: One of `Critical`, `Urgent`, `Emergent`, or `Normal`
- Format: `{patientIDHash}{Classification}` (no separator)
- Regex Pattern: `^(0X)?[0-9A-Fa-f]{16,32}(Critical|Urgent|Emergent|Normal)$`

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
2. Use the AI assistant to configure the labeling pattern (or manually set regex)
3. The system will process and extract:
   - Patient IDs and classifications
   - File counts per patient
   - Classification distribution
   - Training/validation/test split estimates

## File Size

- Total size: ~30 MB
- Contains 40 patient records
- 40 video files, 40 report files, 40 metadata files
- Balanced distribution: 10 examples per classification

## Generation

This dataset was generated using `generate_expanded_dataset.py` which:
- Clones the original patient directories from `ejection_fraction_sample.zip`
- Generates unique patient IDs following the 0X + 16 hex character pattern
- Updates metadata files with new patient IDs and appropriate ejection fraction values
- Creates a balanced dataset with 10 examples per classification

## Testing

This expanded dataset is ideal for:
- Testing dataset processing and validation
- Training model classification workflows
- Validating labeling pattern extraction
- Testing inference and reinforcement learning flows

