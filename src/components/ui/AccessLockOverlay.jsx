import { Lock } from 'lucide-react';

/**
 * AccessLockOverlay — frosted glass blur overlay shown when the chat is locked
 * due to tab switch or inactivity. User clicks/taps to unlock.
 */
export default function AccessLockOverlay({ onUnlock }) {
  return (
    <div
      onClick={onUnlock}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        cursor: 'pointer',
        backdropFilter: 'blur(18px) saturate(0.4)',
        WebkitBackdropFilter: 'blur(18px) saturate(0.4)',
        background: 'rgba(10, 8, 20, 0.55)',
        borderRadius: '0',
        userSelect: 'none',
      }}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '18px',
        padding: '32px 40px',
        boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
        maxWidth: '320px', textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '14px',
          background: 'rgba(139,92,246,0.15)',
          border: '1px solid rgba(139,92,246,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 24px rgba(139,92,246,0.25)',
        }}>
          <Lock size={24} color="#a78bfa" />
        </div>
        <div>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#f3f4f6', marginBottom: '6px' }}>
            Content Hidden
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>
            Chat was locked for privacy.
            <br />Tap anywhere to reveal.
          </p>
        </div>
        <div style={{
          background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '8px', padding: '6px 16px', fontSize: '12px', fontWeight: 600,
          color: '#a78bfa', letterSpacing: '0.02em',
        }}>
          Click to Unlock
        </div>
      </div>
    </div>
  );
}
