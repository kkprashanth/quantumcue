/**
 * Error boundary component for catching React errors.
 */

import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-status-error/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-status-error" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Something went wrong
            </h2>
            <p className="text-text-tertiary mb-6">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-text-secondary cursor-pointer hover:text-text-primary">
                  Error details
                </summary>
                <pre className="mt-2 p-4 bg-background-tertiary rounded-lg text-sm text-status-error overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <Button onClick={this.handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
