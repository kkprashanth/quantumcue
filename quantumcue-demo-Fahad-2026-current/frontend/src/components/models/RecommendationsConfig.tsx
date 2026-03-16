/**
 * Recommendations Configuration Component
 */

import { useState } from 'react';
import { Plus, X, Save, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { useUpdateRecommendations } from '@/hooks/useModels';

interface RecommendationsConfigProps {
  modelId: string;
  currentConfig?: Record<string, string[]>;
  modelClassifications?: string[] | null;
  onSave?: () => void;
}

export const RecommendationsConfig = ({
  modelId,
  currentConfig = {},
  modelClassifications,
  onSave,
}: RecommendationsConfigProps) => {
  // Use model classifications or fallback to defaults
  const CLASSIFICATIONS = (modelClassifications || ['Critical', 'Urgent', 'Emergent', 'Normal']).map(c => c.toLowerCase());
  // Initialize config with model classifications
  const initialConfig: Record<string, string[]> = {};
  CLASSIFICATIONS.forEach((classification) => {
    initialConfig[classification] = currentConfig[classification] || [];
  });
  
  const [config, setConfig] = useState<Record<string, string[]>>(
    Object.keys(currentConfig).length > 0 ? currentConfig : initialConfig
  );
  // Separate input state for each classification
  const [newItems, setNewItems] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { addToast } = useToast();

  const updateMutation = useUpdateRecommendations();

  const handleAddItem = (classification: string) => {
    const itemText = newItems[classification]?.trim() || '';
    if (itemText) {
      setConfig((prev) => ({
        ...prev,
        [classification]: [...(prev[classification] || []), itemText],
      }));
      // Clear the input for this specific classification
      setNewItems((prev) => ({
        ...prev,
        [classification]: '',
      }));
    }
  };

  const handleRemoveItem = (classification: string, index: number) => {
    setConfig((prev) => ({
      ...prev,
      [classification]: prev[classification].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ modelId, config });
      // Show success modal
      setShowSuccessModal(true);
      // Call parent callback if provided
      onSave?.();
    } catch (error: any) {
      console.error('Failed to save recommendations:', error);
      // Extract error message from API response
      const errorMessage = 
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save recommendations. Please try again.';
      // Show error toast
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: errorMessage,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-2">
          Configure Recommendations
        </h3>
        <p className="text-text-secondary text-sm">
          Set action items for each classification. These will be shown to users when the model
          predicts that classification.
        </p>
      </div>

      {CLASSIFICATIONS.map((classification) => (
        <Card key={classification} padding="md">
          <div className="space-y-3">
            <h4 className="text-md font-medium text-text-primary capitalize">
              {classification}
            </h4>

            {/* Existing Items */}
            <div className="space-y-2">
              {(config[classification] || []).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-bg-secondary rounded"
                >
                  <span className="text-text-secondary text-sm">{item}</span>
                  <button
                    onClick={() => handleRemoveItem(classification, index)}
                    className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-text-tertiary" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Item */}
            <div className="flex gap-2">
              <Input
                value={newItems[classification] || ''}
                onChange={(e) => {
                  setNewItems((prev) => ({
                    ...prev,
                    [classification]: e.target.value,
                  }));
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddItem(classification);
                  }
                }}
                placeholder="Add action item..."
                className="flex-1"
              />
              <Button
                onClick={() => handleAddItem(classification)}
                disabled={!newItems[classification]?.trim()}
                size="sm"
                variant="secondary"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          isLoading={updateMutation.isPending}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Recommendations
        </Button>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title=""
        description=""
        size="sm"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-status-success flex items-center justify-center mb-4 shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Recommendations Saved!
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            Your action items have been successfully saved and will be shown to users when the model predicts each classification.
          </p>
          <Button
            onClick={() => setShowSuccessModal(false)}
            className="w-full"
          >
            Got it
          </Button>
        </div>
      </Modal>
    </div>
  );
};

