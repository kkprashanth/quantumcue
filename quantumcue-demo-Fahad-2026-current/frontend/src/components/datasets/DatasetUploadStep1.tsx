/**
 * Dataset Upload Wizard Step 1: Upload Data
 */

import { useState, useCallback } from 'react';
import { Upload, X, File, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export interface DatasetUploadData {
  uploadedFile: File | null;
  fileFormat: string | null;
  dataType: string | null;
}

interface DatasetUploadStep1Props {
  data: DatasetUploadData;
  onUpdate: (updates: Partial<DatasetUploadData>) => void;
}

export const DatasetUploadStep1 = ({ data, onUpdate }: DatasetUploadStep1Props) => {
  const [file, setFile] = useState<File | null>(data.uploadedFile);
  const [isDragging, setIsDragging] = useState(false);

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

    onUpdate({
      uploadedFile: selectedFile,
      fileFormat,
      dataType,
    });
  }, [onUpdate]);

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
      dataType: null,
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const isZipFile = data.fileFormat === 'zip';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Upload Your Data</h2>
        <p className="text-text-secondary">
          Upload a file to create a new dataset. Supported formats: CSV, JSON, Parquet, Images, ZIP, TXT
        </p>
      </div>

      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-colors
            ${isDragging
              ? 'border-navy-700 bg-navy-700/10'
              : 'border-border-primary hover:border-navy-700/50'
            }
            cursor-pointer
          `}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-navy-700' : 'text-text-tertiary'}`} />
          <p className="text-text-primary font-medium mb-2">
            {isDragging ? 'Drop your file here' : 'Drag and drop a file here, or click to select'}
          </p>
          <p className="text-sm text-text-tertiary">
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
      ) : (
        <div className="border border-grey-200 dark:border-border rounded-xl p-6 bg-white dark:bg-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-navy-100 dark:bg-navy-700/20">
                <File className="w-6 h-6 text-navy-800 dark:text-navy-600" />
              </div>
              <div>
                <p className="text-grey-900 dark:text-text-primary font-medium">{file.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-grey-500 dark:text-text-tertiary">{formatFileSize(file.size)}</span>
                  <span className="text-xs px-2 py-1 rounded bg-grey-100 dark:bg-surface-elevated text-grey-600 dark:text-text-secondary uppercase">
                    {data.fileFormat}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-grey-100 dark:bg-surface-elevated text-grey-600 dark:text-text-secondary capitalize">
                    {data.dataType}
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
      )}
    </div>
  );
};
