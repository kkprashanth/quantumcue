import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  isTitleBordered?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  isTitleBordered = true,
}: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Handle click outside
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        overlayRef.current === event.target ||
        (overlayRef.current?.contains(event.target as Node) &&
          !contentRef.current?.contains(event.target as Node))
      ) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown, handleClickOutside]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        ref={contentRef}
        className={`
          relative w-full ${sizeClasses[size]}
          bg-white dark:bg-surface border-2 border-black dark:border-border rounded-xl
          shadow-xl animate-in zoom-in-95 duration-200
          flex flex-col max-h-[90vh]
        `}
      >
        {(title || showCloseButton) && (
          <div className={`flex items-start justify-between px-6 py-2 mb-4 ${isTitleBordered ? 'border-b border-gray-600' : ''} flex-shrink-0`}>
            {title && (
              <div>
                <h2 id="modal-title" className="text-2xl mt-4 font-semibold text-grey-900 dark:text-text-primary">
                  {title}
                </h2>
                {description && (
                  <p id="modal-description" className="mt-1 text-xs text-grey-500 dark:text-text-tertiary">
                    {description}
                  </p>
                )}
              </div>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 text-grey-500 dark:text-text-tertiary hover:text-grey-900 dark:hover:text-text-primary hover:bg-grey-100 dark:hover:bg-surface-elevated rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`overflow-y-auto ${!title && !showCloseButton ? 'px-4' : 'px-6'}`}>{children}</div>
      </div>
    </div>,
    document.body
  );
};

interface ModalActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalActions = ({ children, className = '' }: ModalActionsProps) => (
  <div className={`flex items-center justify-end gap-3 mt-6 pt-6 pb-5 border-t border-grey-200 dark:border-border ${className}`}>
    {children}
  </div>
);

export default Modal;
