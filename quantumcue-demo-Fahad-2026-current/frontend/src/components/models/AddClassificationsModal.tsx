/**
 * Modal for adding classifications to a model.
 */

import { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUpdateModel } from '@/hooks/useModels';

interface AddClassificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelId: string;
  currentClassifications?: string[] | null;
  onSuccess?: () => void;
}

export function AddClassificationsModal({
  isOpen,
  onClose,
  modelId,
  currentClassifications = [],
  onSuccess,
}: AddClassificationsModalProps) {
  const [classifications, setClassifications] = useState<string[]>(
    currentClassifications || []
  );
  const [newClassification, setNewClassification] = useState('');
  const updateModel = useUpdateModel();

  if (!isOpen) return null;

  const handleAddClassification = () => {
    const trimmed = newClassification.trim();
    if (trimmed && !classifications.includes(trimmed)) {
      setClassifications([...classifications, trimmed]);
      setNewClassification('');
    }
  };

  const handleRemoveClassification = (index: number) => {
    setClassifications(classifications.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (classifications.length === 0) {
      return;
    }

    try {
      await updateModel.mutateAsync({
        modelId,
        data: {
          classifications: classifications,
        },
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to save classifications:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddClassification();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-surface rounded-lg shadow-xl w-full max-w-md mx-4 border border-grey-200 dark:border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-grey-200 dark:border-border">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-warning-500" />
            <h2 className="text-lg font-semibold text-grey-900 dark:text-text-primary">
              Add Classifications
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-grey-100 dark:hover:bg-surface-elevated rounded transition-colors"
          >
            <X className="w-5 h-5 text-grey-500 dark:text-text-tertiary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-grey-600 dark:text-text-secondary text-sm">
            Classifications define the possible output labels for this model. These are typically extracted from the training dataset, but can be added manually if needed.
          </p>

          {/* Current Classifications */}
          <div>
            <label className="block text-sm font-medium text-grey-600 dark:text-text-secondary mb-2">
              Classifications
            </label>
            {classifications.length > 0 ? (
              <div className="space-y-2 mb-3">
                {classifications.map((classification, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-grey-50 dark:bg-surface-elevated rounded border border-grey-200 dark:border-border"
                  >
                    <span className="text-grey-900 dark:text-text-primary">{classification}</span>
                    <button
                      onClick={() => handleRemoveClassification(index)}
                      className="p-1 hover:bg-grey-100 dark:hover:bg-surface rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-grey-500 dark:text-text-tertiary" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-grey-500 dark:text-text-tertiary text-sm mb-3">
                No classifications added yet.
              </p>
            )}

            {/* Add New Classification */}
            <div className="flex gap-2">
              <Input
                value={newClassification}
                onChange={(e) => setNewClassification(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter classification label..."
                className="flex-1"
              />
              <Button
                onClick={handleAddClassification}
                disabled={!newClassification.trim()}
                size="sm"
                variant="secondary"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-grey-200 dark:border-border">
          <Button onClick={onClose} variant="secondary" disabled={updateModel.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={classifications.length === 0 || updateModel.isPending}
            isLoading={updateModel.isPending}
          >
            Save Classifications
          </Button>
        </div>
      </div>
    </div>
  );
}

