import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VanishChat ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#08090d',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '14px',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
          }}>
            <AlertTriangle size={28} color="#ef4444" />
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Something went wrong</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '400px', lineHeight: 1.6, marginBottom: '24px' }}>
            {this.state.error?.message || 'An unexpected error occurred while loading the application.'}
          </p>

          <button
            onClick={this.handleReload}
            style={{
              background: '#3b82f6', color: '#ffffff', border: 'none',
              borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <RefreshCw size={16} /> Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
