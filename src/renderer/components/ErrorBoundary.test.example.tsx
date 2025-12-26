/**
 * Example usage of ErrorBoundary
 *
 * This file demonstrates how to use the ErrorBoundary component
 * in different scenarios.
 */

import { ErrorBoundary } from './ErrorBoundary'

// Example 1: Basic usage with default error UI
function Example1() {
  return (
    <ErrorBoundary name="MyComponent">
      <MyComponent />
    </ErrorBoundary>
  )
}

// Example 2: With custom error handler
function Example2() {
  const handleError = (error: Error, errorInfo: any) => {
    // Send error to logging service
    console.error('Logging error to service:', error, errorInfo)
  }

  return (
    <ErrorBoundary name="MyComponent" onError={handleError}>
      <MyComponent />
    </ErrorBoundary>
  )
}

// Example 3: With custom fallback UI
function Example3() {
  const customFallback = (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>Oops! Something went wrong.</h3>
      <p>Please try refreshing the page.</p>
    </div>
  )

  return (
    <ErrorBoundary name="MyComponent" fallbackComponent={customFallback}>
      <MyComponent />
    </ErrorBoundary>
  )
}

// Example 4: Nested error boundaries for granular error handling
function Example4() {
  return (
    <ErrorBoundary name="App">
      <div>
        <ErrorBoundary name="Header">
          <Header />
        </ErrorBoundary>

        <div style={{ display: 'flex' }}>
          <ErrorBoundary name="Sidebar">
            <Sidebar />
          </ErrorBoundary>

          <ErrorBoundary name="MainContent">
            <MainContent />
          </ErrorBoundary>
        </div>

        <ErrorBoundary name="Footer">
          <Footer />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  )
}

// Mock components
function MyComponent() { return <div>My Component</div> }
function Header() { return <div>Header</div> }
function Sidebar() { return <div>Sidebar</div> }
function MainContent() { return <div>Main Content</div> }
function Footer() { return <div>Footer</div> }

// Export examples
export { Example1, Example2, Example3, Example4 }
