#!/usr/bin/env python3
"""
Generate expanded ejection fraction dataset with 10 examples each for
Critical, Urgent, Emergent, and Normal classifications.
"""

import os
import shutil
import json
import random
import zipfile
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent
TEMP_DIR = BASE_DIR / "temp_extract"
OUTPUT_DIR = BASE_DIR / "expanded_data"
ZIP_OUTPUT = BASE_DIR / "ejection_fraction_expanded.zip"

# Source patient directories
SOURCE_CRITICAL = TEMP_DIR / "data" / "0X1AEE3CDCAEC1A61Critical"
SOURCE_URGENT = TEMP_DIR / "data" / "0X1B7B728C3E99A716Urgent"

# Classifications and their ejection fraction ranges
CLASSIFICATIONS = {
    "Critical": {"min": 20, "max": 29.9, "source": SOURCE_CRITICAL},
    "Urgent": {"min": 30, "max": 39.9, "source": SOURCE_URGENT},
    "Emergent": {"min": 40, "max": 49.9, "source": SOURCE_URGENT},  # Use Urgent as template
    "Normal": {"min": 50, "max": 70, "source": SOURCE_URGENT},  # Use Urgent as template
}

# Number of examples per classification
EXAMPLES_PER_CLASS = 10


def generate_patient_id() -> str:
    """Generate a unique 16-character hexadecimal patient ID with 0X prefix."""
    return f"0X{''.join(random.choices('0123456789ABCDEF', k=16))}"


def update_metadata_file(metadata_path: Path, patient_id: str, classification: str, ejection_fraction: float):
    """Update metadata JSON file with new patient ID and classification."""
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    # Update patient ID
    metadata["patient_id"] = patient_id
    metadata["classification"] = classification
    metadata["ejection_fraction"] = ejection_fraction
    
    # Update findings
    metadata["findings"]["left_ventricular_ejection_fraction"] = ejection_fraction
    
    # Update recommendations based on classification
    if classification == "Critical":
        metadata["recommendations"] = [
            "Immediate cardiology consultation",
            "Consider advanced heart failure therapy",
            "Monitor closely for decompensation"
        ]
    elif classification == "Urgent":
        metadata["recommendations"] = [
            "Cardiology consultation within 24-48 hours",
            "Optimize medical therapy",
            "Close monitoring recommended"
        ]
    elif classification == "Emergent":
        metadata["recommendations"] = [
            "Cardiology follow-up within 1 week",
            "Continue current medical therapy",
            "Routine monitoring"
        ]
    else:  # Normal
        metadata["recommendations"] = [
            "Routine follow-up as scheduled",
            "Continue preventive care",
            "No immediate intervention needed"
        ]
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)


def copy_and_rename_files(source_dir: Path, dest_dir: Path, old_id: str, new_id: str):
    """Copy directory structure and rename files with new patient ID."""
    # Create destination directory
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy and rename files
    for subdir in ["videos", "reports", "metadata"]:
        source_subdir = source_dir / subdir
        dest_subdir = dest_dir / subdir
        dest_subdir.mkdir(parents=True, exist_ok=True)
        
        if source_subdir.exists():
            for file in source_subdir.iterdir():
                if file.is_file():
                    # Generate new filename with new patient ID
                    old_filename = file.name
                    new_filename = old_filename.replace(old_id, new_id)
                    dest_file = dest_subdir / new_filename
                    shutil.copy2(file, dest_file)


def generate_expanded_dataset():
    """Generate expanded dataset with 10 examples per classification."""
    print("Generating expanded ejection fraction dataset...")
    
    # Clean up output directory
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)
    
    data_dir = OUTPUT_DIR / "data"
    data_dir.mkdir(parents=True)
    
    all_patient_ids = set()
    
    # Generate examples for each classification
    for classification, config in CLASSIFICATIONS.items():
        print(f"\nGenerating {EXAMPLES_PER_CLASS} examples for {classification}...")
        source_dir = config["source"]
        
        for i in range(EXAMPLES_PER_CLASS):
            # Generate unique patient ID
            while True:
                patient_id = generate_patient_id()
                if patient_id not in all_patient_ids:
                    all_patient_ids.add(patient_id)
                    break
            
            # Generate ejection fraction in range
            ejection_fraction = round(random.uniform(config["min"], config["max"]), 1)
            
            # Create directory name
            dir_name = f"{patient_id}{classification}"
            dest_dir = data_dir / dir_name
            
            # Extract old patient ID from source directory name
            old_dir_name = source_dir.name
            old_id = old_dir_name.replace("Critical", "").replace("Urgent", "").replace("Emergent", "").replace("Normal", "")
            
            # Copy and rename files
            copy_and_rename_files(source_dir, dest_dir, old_id, patient_id)
            
            # Update metadata file
            metadata_file = dest_dir / "metadata" / f"{patient_id}_metadata.json"
            if metadata_file.exists():
                update_metadata_file(metadata_file, patient_id, classification, ejection_fraction)
            
            print(f"  Created {dir_name} (EF: {ejection_fraction}%)")
    
    # Create ZIP file
    print(f"\nCreating ZIP file: {ZIP_OUTPUT.name}...")
    if ZIP_OUTPUT.exists():
        ZIP_OUTPUT.unlink()
    
    with zipfile.ZipFile(ZIP_OUTPUT, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(data_dir):
            for file in files:
                file_path = Path(root) / file
                arcname = file_path.relative_to(OUTPUT_DIR)
                zipf.write(file_path, arcname)
    
    print(f"\n✓ Expanded dataset created successfully!")
    print(f"  Total patient records: {len(all_patient_ids)}")
    print(f"  - Critical: {EXAMPLES_PER_CLASS}")
    print(f"  - Urgent: {EXAMPLES_PER_CLASS}")
    print(f"  - Emergent: {EXAMPLES_PER_CLASS}")
    print(f"  - Normal: {EXAMPLES_PER_CLASS}")
    print(f"  Output: {ZIP_OUTPUT}")
    print(f"  Size: {ZIP_OUTPUT.stat().st_size / (1024 * 1024):.2f} MB")


if __name__ == "__main__":
    # Check if source directories exist
    if not SOURCE_CRITICAL.exists():
        print(f"Error: Source directory not found: {SOURCE_CRITICAL}")
        print("Please extract ejection_fraction_sample.zip first")
        exit(1)
    
    if not SOURCE_URGENT.exists():
        print(f"Error: Source directory not found: {SOURCE_URGENT}")
        print("Please extract ejection_fraction_sample.zip first")
        exit(1)
    
    generate_expanded_dataset()

