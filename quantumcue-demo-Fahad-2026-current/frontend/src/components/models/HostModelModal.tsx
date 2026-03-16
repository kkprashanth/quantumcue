/**
 * Host Model Confirmation Modal
 * Confirms user wants to host a model and enable API access
 */

import { Modal, ModalActions } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Server, Zap } from 'lucide-react';

interface HostModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  modelName?: string;
  isLoading?: boolean;
}

export const HostModelModal = ({
  isOpen,
  onClose,
  onConfirm,
  modelName,
  isLoading = false,
}: HostModelModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Host Model on QuantumCue"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-quantum-500/20 flex items-center justify-center">
            <Server className="w-6 h-6 text-quantum-500" />
          </div>
          <div className="flex-1">
            <p className="text-text-primary mb-2">
              Would you like to host this model on QuantumCue and enable API access?
            </p>
            {modelName && (
              <p className="text-text-secondary text-sm mb-3">
                Model: <span className="font-medium text-text-primary">{modelName}</span>
              </p>
            )}
            <div className="bg-grey-50 dark:bg-surface-elevated rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-quantum-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-text-primary text-sm font-medium">API Access Enabled</p>
                  <p className="text-text-secondary text-xs">
                    Your model will be accessible via REST API with authentication credentials
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="quantum" onClick={onConfirm} isLoading={isLoading}>
          Host Model
        </Button>
      </ModalActions>
    </Modal>
  );
};
