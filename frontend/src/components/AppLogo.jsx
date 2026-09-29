import React from 'react';
import GoldenHourIcon from './GoldenHourIcon';

export default function AppLogo({ size = 36, showLabel = true, subtitle = 'Critical Emergency Network' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.24),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 14px rgba(225, 29, 72, 0.25)',
        flexShrink: 0
      }}>
        <GoldenHourIcon size={size} />
      </div>

      {showLabel && (
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Golden Hour
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
