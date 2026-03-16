/**
 * Confirmation Modal Component
 * A styled confirmation dialog to replace browser confirm() dialogs
 */

import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal, ModalActions } from './Modal';
import { Button } from './Button';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmationModalProps) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-error-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-warning-500" />;
      default:
        return null;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger' as const;
      case 'warning':
        return 'secondary' as const;
      default:
        return 'primary' as const;
    }
  };

  const icon = getIcon();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      showCloseButton={true}
      title={title}
    >
      <div className={icon ? "flex items-start gap-4" : ""}>
        {icon && (
          <div className="flex-shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div className={icon ? "flex-1 min-w-0" : ""}>
          <p className="text-grey-600 dark:text-text-secondary text-sm">
            {message}
          </p>
        </div>
      </div>

      <ModalActions>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={getConfirmButtonVariant()}
          onClick={handleConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  );
};
