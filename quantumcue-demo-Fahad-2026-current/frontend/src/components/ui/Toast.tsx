import * as React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-status-success" />,
    error: <AlertCircle className="w-5 h-5 text-status-error" />,
    warning: <AlertTriangle className="w-5 h-5 text-status-warning" />,
    info: <Info className="w-5 h-5 text-accent-primary" />,
  };

  const backgrounds = {
    success: 'bg-status-success/10 border-status-success/20',
    error: 'bg-status-error/10 border-status-error/20',
    warning: 'bg-status-warning/10 border-status-warning/20',
    info: 'bg-accent-primary/10 border-accent-primary/20',
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        bg-background-secondary border-border-primary
        animate-in slide-in-from-right-5 fade-in duration-200
      `}
    >
      <div className={`p-1 rounded ${backgrounds[toast.type]}`}>
        {icons[toast.type]}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-text-primary">{toast.title}</h4>
        {toast.message && (
          <p className="text-sm text-text-tertiary mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
