import { useState, useCallback } from 'react';
import { Upload, X, File as FileIcon, Check } from 'lucide-react';
import type { Dataset } from '@/types';
import type { NewProjectWizardData } from './NewProjectWizard';
import { ExistingDatasetsList } from './ExistingDatasetsList';

interface NewProjectWizardStep1UploadProps {
  data: NewProjectWizardData;
  onUpdate: (updates: Partial<NewProjectWizardData>) => void;
}

export const NewProjectWizardStep1Upload = ({ data, onUpdate }: NewProjectWizardStep1UploadProps) => {
  const [file, setFile] = useState<File | null>(data.uploadedFile);
  const [isDragging, setIsDragging] = useState(false);
  const [description, setDescription] = useState(data.description || '');

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);

    // Determine file format and data type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    let fileFormat: string = 'txt';
    let dataType: string = 'unstructured';

    if (fileExtension === 'csv') {
      fileFormat = 'csv';
      dataType = 'structured';
    } else if (fileExtension === 'json') {
      fileFormat = 'json';
      dataType = 'structured';
    } else if (fileExtension === 'parquet') {
      fileFormat = 'parquet';
      dataType = 'structured';
    } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension || '')) {
      fileFormat = 'images';
      dataType = 'images';
    } else if (fileExtension === 'zip') {
      fileFormat = 'zip';
      dataType = 'mixed';
    } else if (fileExtension === 'txt') {
      fileFormat = 'txt';
      dataType = 'text';
    }

    // Generate a default name from the filename if no name is set
    const defaultName = selectedFile.name.split('.').slice(0, -1).join('.') || selectedFile.name;
    const updates: Partial<NewProjectWizardData> = {
      uploadedFile: selectedFile,
      fileFormat,
      fileSize: selectedFile.size,
      description: description || null,
      dataset_id: null,
    };

    if (!data.name?.trim()) {
      updates.name = defaultName;
    }

    onUpdate(updates);
  }, [onUpdate, description, data.name]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleRemoveFile = () => {
    setFile(null);
    onUpdate({
      uploadedFile: null,
      fileFormat: null,
      fileSize: null,
      description: null,
    });
  };

  const handleDatasetSelect = (dataset: Dataset | null) => {
    if (dataset) {
      // If a dataset is selected, clear any uploaded file
      setFile(null);
      onUpdate({
        dataset_id: dataset.id,
        uploadedFile: null,
        fileFormat: dataset.file_format || null,
        fileSize: dataset.file_size_bytes || null,
        name: dataset.name || data.name,
        description: dataset.description || data.description,
      });
    } else {
      onUpdate({ dataset_id: null });
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onUpdate({ description: value || null });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Upload Your Data</h2>
        <p className="text-text-secondary text-sm">
          Upload a file to create a new dataset or select a previously uploaded one.
        </p>
      </div>

      {!file ? (
        <div className="space-y-8">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-xl p-10 text-center transition-colors
              ${isDragging
                ? 'border-navy-700 bg-navy-700/10'
                : 'border-border-primary hover:border-navy-700/50'
              }
              ${data.dataset_id ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
            `}
            onClick={() => !data.dataset_id && document.getElementById('file-input')?.click()}
          >
            <Upload className={`w-10 h-10 mx-auto mb-4 ${isDragging ? 'text-navy-700' : 'text-text-tertiary'}`} />
            <p className="text-text-primary font-medium mb-1">
              {isDragging ? 'Drop your file here' : 'Drag and drop a file here, or click to select'}
            </p>
            <p className="text-xs text-text-tertiary">
              Supports CSV, JSON, Parquet, Images, ZIP, TXT files
            </p>
            <input
              id="file-input"
              type="file"
              className="hidden"
              onChange={handleFileInputChange}
              accept=".csv,.json,.parquet,.png,.jpg,.jpeg,.gif,.webp,.zip,.txt,application/zip,application/x-zip-compressed"
            />
          </div>

          <ExistingDatasetsList
            selectedDatasetId={data.dataset_id}
            onSelect={handleDatasetSelect}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-grey-200 dark:border-border rounded-xl p-6 bg-white dark:bg-surface">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-navy-100 dark:bg-navy-700/20">
                  <FileIcon className="w-6 h-6 text-navy-800 dark:text-navy-600" />
                </div>
                <div>
                  <p className="text-grey-900 dark:text-text-primary font-medium">{file.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-grey-500 dark:text-text-tertiary">{formatFileSize(file.size)}</span>
                    <span className="text-xs px-2 py-1 rounded bg-grey-100 dark:bg-surface-elevated text-grey-600 dark:text-text-secondary uppercase">
                      {data.fileFormat}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-success-500" />
                <button
                  onClick={handleRemoveFile}
                  className="p-2 hover:bg-grey-100 dark:hover:bg-surface-elevated rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-grey-500 dark:text-text-tertiary" />
                </button>
              </div>
            </div>
          </div>

          {/* <div>
            <Input
              label="Description"
              required
              type="text"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Describe your dataset..."
            />
          </div> */}
        </div>
      )}
    </div>
  );
};
