"use client";

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  // Try to recover by clearing the error state
  handleRetry = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4 z-50">
          <div className="max-w-xl w-full bg-gradient-to-br from-gray-900 to-purple-900/40 p-6 rounded-xl border border-purple-500/30 shadow-lg backdrop-blur-sm">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900/30 rounded-full mb-4 relative animate-pulse-slow">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="absolute -inset-1 rounded-full blur-xl bg-red-600/10 animate-pulse"></div>
              </div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-300">
                Something went wrong
              </h2>
              <p className="text-gray-400 mt-2">
                We're sorry, but there was an error loading this page.
              </p>
            </div>

            <div className="bg-black/30 p-4 rounded-lg border border-red-500/20 mt-4 font-mono text-xs text-gray-400 max-h-36 overflow-auto">
              <p className="text-red-400">{this.state.error && this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3 justify-center mt-6">
              <button 
                onClick={this.handleRetry}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg shadow-md hover:shadow-purple-500/20 transition-all duration-300 flex items-center justify-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow-md hover:shadow-gray-800/20 transition-all duration-300 flex items-center justify-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-7-7v14" />
                </svg>
                Go to Home
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg shadow-md hover:shadow-blue-700/20 transition-all duration-300 flex items-center justify-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Render children if there's no error
    return this.props.children;
  }
}

export default ErrorBoundary;