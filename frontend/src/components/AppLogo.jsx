import React, { useState } from 'react';

export default function AppLogo({ size = 36, showLabel = true, subtitle = 'Regional Emergency Network' }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 800,
        fontSize: Math.round(size * 0.46),
        boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        {!imageError ? (
          <img
            src="/logo.png"
            alt="CareConnect"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <span>🚑</span>
        )}
      </div>

      {showLabel && (
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            CareConnect
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
