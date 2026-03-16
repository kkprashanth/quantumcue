/**
 * Dataset Validation Errors Component
 */

import { AlertTriangle, XCircle, Info } from 'lucide-react';
import { Card } from '../ui/Card';

interface ValidationErrors {
  errors?: string[];
  warnings?: string[];
  valid_directories?: string[];
  invalid_directories?: string[];
  missing_subdirectories?: Record<string, string[]>;
}

interface DatasetValidationErrorsProps {
  errors: ValidationErrors | null;
  onDismiss?: () => void;
}

export const DatasetValidationErrors = ({
  errors,
  onDismiss,
}: DatasetValidationErrorsProps) => {
  if (!errors || (!errors.errors?.length && !errors.warnings?.length)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Errors */}
      {errors.errors && errors.errors.length > 0 && (
        <Card padding="md" className="border-status-error/20 bg-status-error/10">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-status-error mb-2">Validation Errors</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                {errors.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Warnings */}
      {errors.warnings && errors.warnings.length > 0 && (
        <Card padding="md" className="border-status-warning/20 bg-status-warning/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-status-warning mb-2">Warnings</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                {errors.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Valid/Invalid Directories */}
      {(errors.valid_directories?.length || errors.invalid_directories?.length) && (
        <Card padding="md">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-text-tertiary" />
              <h4 className="text-sm font-medium text-text-primary">Directory Analysis</h4>
            </div>
            
            {errors.valid_directories && errors.valid_directories.length > 0 && (
              <div>
                <p className="text-xs text-text-tertiary mb-1">
                  Valid Directories ({errors.valid_directories.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {errors.valid_directories.slice(0, 10).map((dir, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-status-success/20 text-status-success rounded text-xs"
                    >
                      {dir}
                    </span>
                  ))}
                  {errors.valid_directories.length > 10 && (
                    <span className="px-2 py-1 text-text-tertiary text-xs">
                      +{errors.valid_directories.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {errors.invalid_directories && errors.invalid_directories.length > 0 && (
              <div>
                <p className="text-xs text-text-tertiary mb-1">
                  Invalid Directories ({errors.invalid_directories.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {errors.invalid_directories.slice(0, 10).map((dir, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-status-error/20 text-status-error rounded text-xs"
                    >
                      {dir}
                    </span>
                  ))}
                  {errors.invalid_directories.length > 10 && (
                    <span className="px-2 py-1 text-text-tertiary text-xs">
                      +{errors.invalid_directories.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

