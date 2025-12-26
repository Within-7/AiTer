import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackComponent?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  name?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const boundaryName = this.props.name || 'ErrorBoundary'
    console.error(`[${boundaryName}] Caught error:`, error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent
      }

      // Default error UI
      const boundaryName = this.props.name || 'Component'
      const error = this.state.error
      const errorInfo = this.state.errorInfo

      return (
        <div
          style={{
            padding: '20px',
            margin: '20px',
            border: '2px solid #ff4444',
            borderRadius: '8px',
            backgroundColor: '#fff5f5',
            color: '#cc0000',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
            {boundaryName} Error
          </h2>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
            Something went wrong in this component. You can try to recover or reload the app.
          </p>

          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#fff',
                border: '1px solid #ffcccc',
                borderRadius: '4px',
                fontFamily: 'Monaco, Consolas, monospace',
                fontSize: '12px'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '8px', color: '#cc0000' }}>
                {error.name}: {error.message}
              </div>
              {error.stack && (
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#666'
                  }}
                >
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          {errorInfo && errorInfo.componentStack && (
            <details style={{ marginBottom: '16px' }}>
              <summary
                style={{
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#666',
                  marginBottom: '8px'
                }}
              >
                Component Stack
              </summary>
              <pre
                style={{
                  margin: 0,
                  padding: '12px',
                  backgroundColor: '#fff',
                  border: '1px solid #ffcccc',
                  borderRadius: '4px',
                  fontFamily: 'Monaco, Consolas, monospace',
                  fontSize: '11px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#666'
                }}
              >
                {errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#45a049'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#4CAF50'
              }}
            >
              Try to Recover
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#0b7dda'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#2196F3'
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
