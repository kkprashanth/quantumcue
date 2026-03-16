/**
 * Dataset upload component.
 */

import { useState, useCallback } from 'react';
import { Upload, X, File } from 'lucide-react';
import { Button, buttonVariants, buttonSizes } from '@/components/ui/Button';
import { useCreateDataset, useUploadDataset } from '@/hooks/useDatasets';
import type { DatasetCreate } from '@/types';

interface DatasetUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DatasetUpload = ({ onSuccess, onCancel }: DatasetUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const createDataset = useCreateDataset();
  const uploadDataset = useUploadDataset();

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
      setFile(droppedFile);
      if (!name) {
        setName(droppedFile.name);
      }
    }
  }, [name]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name);
      }
    }
  };

  const handleSubmit = async () => {
    if (!file || !name) return;

    try {
      // Determine file format and data type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let fileFormat: 'csv' | 'json' | 'parquet' | 'images' | 'image_directory' | 'zip' | 'txt' = 'txt';
      let dataType: 'structured' | 'unstructured' | 'images' | 'text' | 'mixed' = 'unstructured';

      if (fileExtension === 'csv') {
        fileFormat = 'csv';
        dataType = 'structured';
      } else if (fileExtension === 'json') {
        fileFormat = 'json';
        dataType = 'structured';
      } else if (fileExtension === 'parquet') {
        fileFormat = 'parquet';
        dataType = 'structured';
      } else if (['png', 'jpg', 'jpeg', 'gif'].includes(fileExtension || '')) {
        fileFormat = 'images';
        dataType = 'images';
      } else if (fileExtension === 'zip') {
        fileFormat = 'zip';
        dataType = 'mixed';
      }

      const datasetData: DatasetCreate = {
        name,
        description: description || undefined,
        file_path: `s3://quantumcue-data/temp/${file.name}`, // Will be updated after upload
        file_size_bytes: file.size,
        file_format: fileFormat,
        data_type: dataType,
      };

      const createdDataset = await createDataset.mutateAsync(datasetData);

      // Upload the file
      await uploadDataset.mutateAsync({
        datasetId: createdDataset.id,
        file,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Failed to upload dataset:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-accent-primary bg-accent-primary/10' : 'border-border-primary'}
          ${file ? 'border-green-500 bg-green-500/10' : ''}
        `}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <File className="w-8 h-8 text-green-500" />
            <div className="text-left">
              <p className="text-text-primary font-medium">{file.name}</p>
              <p className="text-text-tertiary text-sm">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="ml-auto text-text-tertiary hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div>
            <Upload className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-primary mb-2">
              Drag and drop a file here, or click to select
            </p>
            <p className="text-text-tertiary text-sm mb-4">
              Supports CSV, JSON, Parquet, Images, ZIP
            </p>
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <span className={`${buttonVariants.secondary} ${buttonSizes.sm} cursor-pointer`}>
                Select File
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Dataset Info */}
      {file && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Dataset Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary"
              placeholder="Enter dataset name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary"
              rows={3}
              placeholder="Enter dataset description"
            />
          </div>

          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!name || createDataset.isPending || uploadDataset.isPending}
            >
              {createDataset.isPending || uploadDataset.isPending ? 'Uploading...' : 'Upload Dataset'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetUpload;
