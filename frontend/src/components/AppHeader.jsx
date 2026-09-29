import React from 'react';
import AppLogo from './AppLogo';

export default function AppHeader({
  currentPage,
  onNavigate,
  sseConnected,
  pendingRequestsCount = 0
}) {
  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderRadius: 0,
      padding: '12px 24px',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        {/* Brand */}
        <div onClick={() => onNavigate('landing')}>
          <AppLogo size={36} />
        </div>

        {/* View Switcher Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <nav style={{
            display: 'flex',
            background: '#F1F5F9',
            padding: 3,
            borderRadius: 10,
            gap: 2
          }}>
            <button
              onClick={() => onNavigate('landing')}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                background: currentPage === 'landing' ? '#FFFFFF' : 'transparent',
                color: currentPage === 'landing' ? '#2563EB' : 'var(--text-muted)',
                boxShadow: currentPage === 'landing' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🏠</span>
              <span>Overview</span>
            </button>

            <button
              onClick={() => onNavigate('dispatcher')}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                background: currentPage === 'dispatcher' ? '#FFFFFF' : 'transparent',
                color: currentPage === 'dispatcher' ? '#2563EB' : 'var(--text-muted)',
                boxShadow: currentPage === 'dispatcher' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🚑</span>
              <span>Dispatcher</span>
            </button>

            <button
              onClick={() => onNavigate('hospital')}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                background: currentPage === 'hospital' ? '#FFFFFF' : 'transparent',
                color: currentPage === 'hospital' ? '#059669' : 'var(--text-muted)',
                boxShadow: currentPage === 'hospital' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🏥</span>
              <span>Hospital Console</span>
              {pendingRequestsCount > 0 && (
                <span style={{
                  background: '#EF4444',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 99,
                  marginLeft: 2
                }}>
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Real-Time Sync Indicator */}
          <div style={{
            fontSize: 11,
            color: sseConnected ? '#059669' : '#D97706',
            background: sseConnected ? '#ECFDF5' : '#FFFBEB',
            border: `1px solid ${sseConnected ? '#A7F3D0' : '#FDE68A'}`,
            padding: '4px 10px',
            borderRadius: 99,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: sseConnected ? '#059669' : '#D97706',
              boxShadow: sseConnected ? '0 0 6px #059669' : 'none'
            }} />
            <span>{sseConnected ? 'Live' : 'Syncing'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
