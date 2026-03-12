import React from 'react';
import { toast } from 'react-hot-toast';

class VersionManagerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VersionManager Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Show toast notification
    toast.error('An error occurred in the version manager. Please refresh the page.');
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="version-manager-error-state"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--slate1)',
            borderRadius: '8px',
            border: '1px solid var(--border-weak)',
            minHeight: '200px',
          }}
        >
          {/* Error Icon */}
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: '16px', opacity: 0.5 }}>
            <circle cx="24" cy="24" r="20" stroke="var(--text-tertiary)" strokeWidth="2" />
            <path d="M24 14V26" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="32" r="1.5" fill="var(--text-tertiary)" />
          </svg>

          {/* Error Message */}
          <div
            className="tj-text-sm"
            style={{
              color: 'var(--text-default)',
              fontWeight: 600,
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            Something went wrong
          </div>

          <div
            className="tj-text-xsm"
            style={{
              color: 'var(--text-secondary)',
              marginBottom: '20px',
              textAlign: 'center',
              maxWidth: '280px',
            }}
          >
            The version manager encountered an error. Please try refreshing the page.
          </div>

          {/* Action Buttons */}
          <div className="d-flex" style={{ gap: '8px' }}>
            <button
              className="btn btn-sm"
              onClick={this.handleRetry}
              style={{
                padding: '6px 16px',
                fontSize: '13px',
                border: '1px solid var(--border-weak)',
                backgroundColor: 'white',
                color: 'var(--text-default)',
                borderRadius: '6px',
                fontWeight: 500,
              }}
            >
              Try Again
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={this.handleRefresh}
              style={{
                padding: '6px 16px',
                fontSize: '13px',
                borderRadius: '6px',
                fontWeight: 500,
              }}
            >
              Refresh Page
            </button>
          </div>

          {/* Debug info (only in development) */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details
              style={{
                marginTop: '20px',
                padding: '12px',
                backgroundColor: 'var(--slate2)',
                borderRadius: '6px',
                width: '100%',
                maxWidth: '400px',
              }}
            >
              <summary
                className="tj-text-xsm"
                style={{
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Error Details (Development Only)
              </summary>
              <div
                className="tj-text-xxsm"
                style={{
                  marginTop: '8px',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo && (
                  <>
                    {'\n\n'}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default VersionManagerErrorBoundary;
