import React from 'react';
import AppLogo from '../components/AppLogo';

export default function LandingPage({ onSelect }) {
  return (
    <div className="page-enter mesh-bg" style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 44, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: 16 }}>
          <AppLogo size={64} showLabel={false} />
        </div>
        <h1 className="brand-font" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Golden Hour Operations
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 440, lineHeight: 1.5, margin: '0 auto' }}>
          Real-time patient routing and critical care capacity coordination when every second counts.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 10, maxWidth: 640, width: '100%' }}>
        <button
          onClick={() => onSelect('dispatcher')}
          className="glass-panel hover-lift"
          style={{
            flex: '1 1 280px',
            borderRadius: 'var(--radius)',
            padding: '28px 24px',
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.85)'
          }}
        >
          <div style={{
            width: 44, height: 44,
            background: 'var(--primary-light)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16
          }}>
            <span style={{ fontSize: 22 }}>🚑</span>
          </div>
          <h2 className="brand-font" style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
            Ambulance Dispatcher
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
            Report emergency incidents and get traffic-aware, ML-ranked hospital recommendations.
          </p>
          <div style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>
            Launch Dispatch Console →
          </div>
        </button>

        <button
          onClick={() => onSelect('hospital')}
          className="glass-panel hover-lift"
          style={{
            flex: '1 1 280px',
            borderRadius: 'var(--radius)',
            padding: '28px 24px',
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.85)'
          }}
        >
          <div style={{
            width: 44, height: 44,
            background: 'var(--green-light)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16
          }}>
            <span style={{ fontSize: 22 }}>🏥</span>
          </div>
          <h2 className="brand-font" style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
            Hospital Staff
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
            Update live bed telemetry and process incoming patient queue with atomic reservation locking.
          </p>
          <div style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
            Launch Hospital Console →
          </div>
        </button>
      </div>
    </div>
  );
}
