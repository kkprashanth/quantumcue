/**
 * Dataset Labeling Preview Component
 * Displays extracted structure and allows editing before saving
 */

import { useState, useEffect } from 'react';
import { CheckCircle, Edit2, Save, X, Code2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal, ModalActions } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import type { ExtractedStructure } from '@/hooks/useDatasetLabelingChat';

interface DatasetLabelingPreviewProps {
  structure: ExtractedStructure | null;
  onSave: (structure: ExtractedStructure) => Promise<void>;
  onSaveAndContinue?: () => Promise<void> | void;
  onEdit?: () => void;
  isSaving?: boolean;
}

export const DatasetLabelingPreview = ({
  structure,
  onSave,
  onSaveAndContinue,
  onEdit,
  isSaving = false,
}: DatasetLabelingPreviewProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [editedStructure, setEditedStructure] = useState<ExtractedStructure | null>(structure);
  const { addToast } = useToast();

  // Update edited structure when structure prop changes
  useEffect(() => {
    if (structure) {
      setEditedStructure({ ...structure });
    }
  }, [structure]);

  if (!structure) {
    return null;
  }

  const handleEditClick = () => {
    setEditedStructure({ ...structure });
    setShowEditModal(true);
    onEdit?.();
  };

  const handleCancelEdit = () => {
    setEditedStructure({ ...structure });
    setShowEditModal(false);
  };

  const handleSaveEdit = async () => {
    if (editedStructure) {
      try {
        await onSave(editedStructure);
        setShowEditModal(false);
        addToast({
          type: 'success',
          title: 'Structure updated',
          message: 'The labeling structure has been updated.',
        });
      } catch (error) {
        console.error('Failed to save structure:', error);
        addToast({
          type: 'error',
          title: 'Save failed',
          message: error instanceof Error ? error.message : 'Failed to save structure. Please try again.',
        });
      }
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(structure, null, 2));
    addToast({
      type: 'success',
      title: 'Copied to clipboard!',
      message: 'Extracted JSON structure copied.',
    });
  };

  // Get regex pattern from labeling_structure
  const regexPattern = (structure.labeling_structure?.regex as string) || 'No regex pattern defined';

  return (
    <>
      <Card padding="md">
        <div className="space-y-4">
          {/* Header with checkmark */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-status-success flex-shrink-0" />
              <h3 className="text-lg font-medium text-text-primary">Extracted Structure</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                leftIcon={<Edit2 className="w-4 h-4" />}
              >
                Edit
              </Button>
            </div>
          </div>

          {/* View JSON button on separate line */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJsonModal(true)}
              leftIcon={<Code2 className="w-4 h-4" />}
            >
              View JSON
            </Button>
          </div>

          {/* Description/Goal */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Dataset Goal/Description
            </label>
            <p className="text-sm text-text-secondary bg-bg-secondary p-3 rounded-lg">
              {structure.description}
            </p>
          </div>

          {/* Labeling Pattern - Show Regex Prominently */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Labeling Pattern (Regex)
            </label>
            <div className="bg-bg-secondary p-3 rounded-lg">
              <code className="text-sm text-text-primary font-mono break-all">
                {regexPattern}
              </code>
            </div>
          </div>

          {/* Classifications */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Classifications
            </label>
            <div className="flex flex-wrap gap-2">
              {structure.classifications.map((classification) => (
                <span
                  key={classification}
                  className="px-2 py-1 bg-navy-700/20 text-navy-700 rounded text-sm font-medium"
                >
                  {classification}
                </span>
              ))}
            </div>
          </div>

          {/* Required Subdirectories */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Required Subdirectories
            </label>
            <div className="flex flex-wrap gap-2">
              {structure.required_subdirectories.map((subdir) => (
                <span
                  key={subdir}
                  className="px-2 py-1 bg-bg-secondary text-text-secondary rounded text-sm"
                >
                  {subdir}
                </span>
              ))}
            </div>
          </div>

          {/* File Types */}
          {Object.keys(structure.file_types).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                File Types
              </label>
              <div className="space-y-2">
                {Object.entries(structure.file_types).map(([subdir, types]) => (
                  <div key={subdir} className="bg-bg-secondary p-2 rounded">
                    <p className="text-xs text-text-tertiary mb-1">{subdir}</p>
                    <div className="flex flex-wrap gap-1">
                      {types.map((type) => (
                        <span
                          key={type}
                          className="px-2 py-0.5 bg-surface text-text-secondary rounded text-xs font-mono"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCancelEdit}
        title="Edit Labeling Structure"
        description="Modify the extracted structure before saving"
        size="xl"
      >
        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Dataset Goal/Description
            </label>
            <textarea
              value={editedStructure?.description || ''}
              onChange={(e) =>
                setEditedStructure((prev) =>
                  prev ? { ...prev, description: e.target.value } : null
                )
              }
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary resize-none"
              rows={3}
            />
          </div>

          {/* Regex Pattern */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Labeling Pattern (Regex) *
            </label>
            <Input
              value={(editedStructure?.labeling_structure?.regex as string) || ''}
              onChange={(e) =>
                setEditedStructure((prev) =>
                  prev
                    ? {
                      ...prev,
                      labeling_structure: {
                        ...prev.labeling_structure,
                        regex: e.target.value,
                      },
                    }
                    : null
                )
              }
              placeholder="e.g., ^(0X)?[0-9A-Fa-f]{16,32}(Critical|Urgent|Emergent|Normal)$"
              className="font-mono text-sm"
            />
            <p className="text-xs text-text-tertiary mt-1">
              Regular expression pattern that matches directory names
            </p>
          </div>

          {/* Classifications */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Classifications (comma-separated) *
            </label>
            <Input
              value={editedStructure?.classifications.join(', ') || ''}
              onChange={(e) => {
                const classifications = e.target.value
                  .split(',')
                  .map((c) => c.trim())
                  .filter((c) => c.length > 0);
                setEditedStructure((prev) =>
                  prev ? { ...prev, classifications } : null
                );
              }}
              placeholder="Critical, Urgent, Emergent, Normal"
            />
            <p className="text-xs text-text-tertiary mt-1">
              List of classification labels, separated by commas
            </p>
          </div>

          {/* Required Subdirectories */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Required Subdirectories (comma-separated)
            </label>
            <Input
              value={editedStructure?.required_subdirectories.join(', ') || ''}
              onChange={(e) => {
                const subdirs = e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0);
                setEditedStructure((prev) =>
                  prev ? { ...prev, required_subdirectories: subdirs } : null
                );
              }}
              placeholder="videos, reports, metadata"
            />
            <p className="text-xs text-text-tertiary mt-1">
              Subdirectories that must exist in each record directory
            </p>
          </div>

          {/* File Types */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              File Types (JSON format)
            </label>
            <textarea
              value={JSON.stringify(editedStructure?.file_types || {}, null, 2)}
              onChange={(e) => {
                try {
                  const fileTypes = JSON.parse(e.target.value);
                  setEditedStructure((prev) =>
                    prev ? { ...prev, file_types: fileTypes } : null
                  );
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary resize-none font-mono text-sm"
              rows={6}
            />
            <p className="text-xs text-text-tertiary mt-1">
              JSON object mapping subdirectory names to arrays of file extensions
            </p>
          </div>
        </div>

        <ModalActions>
          <Button variant="secondary" onClick={handleCancelEdit} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            disabled={isSaving || !editedStructure?.labeling_structure?.regex || !editedStructure?.classifications.length}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </ModalActions>
      </Modal>

      {/* JSON Structure Modal */}
      <Modal
        isOpen={showJsonModal}
        onClose={() => setShowJsonModal(false)}
        title="Extracted Structure JSON"
        description="Complete JSON structure extracted from the conversation"
        size="xl"
      >
        <div className="space-y-4">
          <div className="bg-background rounded-lg border border-border-primary p-4 max-h-[60vh] overflow-auto">
            <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap break-words">
              {JSON.stringify(structure, null, 2)}
            </pre>
          </div>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={() => setShowJsonModal(false)}>
            Close
          </Button>
          <Button onClick={handleCopyJson}>Copy JSON</Button>
        </ModalActions>
      </Modal>
    </>
  );
};
