import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// Track error counts to prevent redirect loops
const ERROR_COUNT_KEY = 'errorBoundary_errorCount';
const ERROR_TIME_KEY = 'errorBoundary_lastError';
const MAX_ERRORS_BEFORE_BLOCKING = 3;
const ERROR_RESET_INTERVAL_MS = 30000; // Reset error count after 30 seconds

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isLoopDetected: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isLoopDetected: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Check for redirect loops
    const isLoopDetected = this.checkForLoop();

    // Update state with error info
    this.setState({
      error,
      errorInfo,
      isLoopDetected,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private checkForLoop(): boolean {
    try {
      const lastErrorTime = sessionStorage.getItem(ERROR_TIME_KEY);
      const errorCount = parseInt(sessionStorage.getItem(ERROR_COUNT_KEY) || '0', 10);
      const now = Date.now();

      // Reset count if enough time has passed
      if (lastErrorTime && now - parseInt(lastErrorTime, 10) > ERROR_RESET_INTERVAL_MS) {
        sessionStorage.setItem(ERROR_COUNT_KEY, '1');
        sessionStorage.setItem(ERROR_TIME_KEY, now.toString());
        return false;
      }

      // Increment error count
      const newCount = errorCount + 1;
      sessionStorage.setItem(ERROR_COUNT_KEY, newCount.toString());
      sessionStorage.setItem(ERROR_TIME_KEY, now.toString());

      return newCount >= MAX_ERRORS_BEFORE_BLOCKING;
    } catch {
      // sessionStorage might not be available
      return false;
    }
  }

  private clearLoopTracking(): void {
    try {
      sessionStorage.removeItem(ERROR_COUNT_KEY);
      sessionStorage.removeItem(ERROR_TIME_KEY);
    } catch {
      // Ignore
    }
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    // Clear error state before navigating to prevent loops
    this.clearLoopTracking();
    // Use replace instead of href to avoid back button issues
    window.location.replace('/');
  };

  private handleRetry = (): void => {
    this.clearLoopTracking();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isLoopDetected: false,
    });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
          <div
            className="max-w-lg w-full bg-[var(--color-surface)] rounded-lg p-8 text-center"
            style={{ boxShadow: 'var(--shadow-2)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(239, 111, 83, 0.1)' }}
              >
                <AlertTriangle size={32} style={{ color: 'var(--color-error)' }} />
              </div>
            </div>

            <h1
              className="text-xl font-bold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Something went wrong
            </h1>

            <p
              className="mb-6"
              style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}
            >
              {this.state.isLoopDetected
                ? 'Multiple errors detected. This may indicate a persistent issue. Please try clearing your browser data or contact support.'
                : 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.'}
            </p>

            {/* Error details (collapsed by default) */}
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary
                  className="cursor-pointer mb-2"
                  style={{ color: 'var(--color-primary)', fontSize: '14px' }}
                >
                  Show error details
                </summary>
                <div
                  className="p-4 rounded overflow-auto max-h-48"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: 'var(--color-error)',
                  }}
                >
                  <p className="font-bold mb-2">{this.state.error.name}: {this.state.error.message}</p>
                  {this.state.errorInfo?.componentStack && (
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 border rounded transition-colors hover:bg-[var(--color-background)]"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                <RefreshCw size={16} />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2 border rounded transition-colors hover:bg-[var(--color-background)]"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                <Home size={16} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
