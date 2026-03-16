/**
 * Dataset card component for dataset list.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Database, FileText, Calendar, User, ChevronRight, Trash2, MoreVertical } from 'lucide-react';
import { useDeleteDataset } from '@/hooks/useDatasets';
import { Card } from '@/components/ui/Card';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import type { Dataset } from '@/types';

interface DatasetCardProps {
  dataset: Dataset;
}

export const DatasetCard = ({ dataset }: DatasetCardProps) => {
  const navigate = useNavigate();
  const deleteDataset = useDeleteDataset();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteDataset.mutateAsync(dataset.id);
      setShowDeleteConfirm(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to delete dataset:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-green-500 bg-green-500/20';
      case 'processing':
        return 'text-blue-500 bg-blue-500/20';
      case 'uploading':
        return 'text-yellow-500 bg-yellow-500/20';
      case 'error':
        return 'text-red-500 bg-red-500/20';
      default:
        return 'text-text-tertiary bg-text-tertiary/20';
    }
  };

  return (
    <>
      <Card variant="stat" padding="none" className="relative hover:shadow-md transition-all">
        <Link
          to={`/datasets/${dataset.id}`}
          className="block p-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-text-primary font-medium truncate">
                {dataset.name}
              </h3>
              {dataset.description && (
                <p className="text-text-tertiary text-sm mt-0.5 line-clamp-1">
                  {dataset.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 capitalize rounded text-xs font-medium ${getStatusColor(dataset.status)}`}>
                {dataset.status}
              </span>
              <ChevronRight className="w-4 h-4 text-text-tertiary" />
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
            {/* File Format */}
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-text-tertiary" />
              <span className="uppercase">{dataset.file_format}</span>
            </div>

            {/* Data Type */}
            <div className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-text-tertiary" />
              <span className="capitalize">{dataset.data_type}</span>
            </div>

            {/* File Size */}
            <div className="flex items-center gap-1.5">
              <span className="text-text-tertiary">Size:</span>
              <span>{formatFileSize(dataset.file_size_bytes)}</span>
            </div>

            {/* Row/Column Count */}
            {dataset.row_count && (
              <div className="flex items-center gap-1.5">
                <span className="text-text-tertiary">Rows:</span>
                <span>{dataset.row_count.toLocaleString()}</span>
              </div>
            )}

            {/* Creator */}
            {dataset.created_by_name && (
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-text-tertiary" />
                <span>{dataset.created_by_name}</span>
              </div>
            )}

            {/* Date */}
            <div className="flex items-center gap-1.5 ml-auto">
              <Calendar className="w-4 h-4 text-text-tertiary" />
              <span>{formatDate(dataset.created_at)}</span>
            </div>
          </div>
        </Link>

        {/* Actions Menu */}
        <div className="absolute top-4 right-4">
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg hover:bg-background-elevated transition-colors"
              aria-label="Dataset actions"
            >
              <MoreVertical className="w-4 h-4 text-text-tertiary" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 mt-1 w-48 bg-background-elevated border border-border-primary rounded-lg shadow-lg z-20">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-status-error hover:bg-background-secondary flex items-center gap-2 transition-colors rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Dataset
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Dataset"
        message={`Are you sure you want to delete "${dataset.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteDataset.isPending}
      />
    </>
  );
};

export default DatasetCard;
