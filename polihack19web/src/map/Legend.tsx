import { useState } from 'react';

export function Legend() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          zIndex: 15,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          borderRadius: 8,
          padding: '8px 12px',
          cursor: 'pointer',
          color: '#cbd5e1',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15, 23, 42, 0.95)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(51, 65, 85, 0.8)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15, 23, 42, 0.85)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(51, 65, 85, 0.5)';
        }}
      >
        📊 Show Legend
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        padding: '18px 22px',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(51, 65, 85, 0.5)',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: 13,
        lineHeight: 1.6,
        zIndex: 15,
        maxWidth: 260,
        color: '#cbd5e1',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>
          🌧️ Rain Forecast
        </div>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 18,
            padding: 0,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Severity (0–16 scale)
        </div>
        <div
          style={{
            height: 28,
            background: 'linear-gradient(to right, #22c55e, #84cc16, #eab308, #fb923c, #ef4444, #991b1b)',
            borderRadius: 6,
            border: '1px solid rgba(51, 65, 85, 0.6)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 6, fontWeight: 500 }}>
          <span>Low (0)</span>
          <span>High (16)</span>
        </div>
      </div>

      <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', borderTop: '1px solid rgba(51, 65, 85, 0.5)', paddingTop: 10 }}>
        📱 Barometer network • 1km grid • Real-time data
      </div>
    </div>
  );
}
