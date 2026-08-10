import { AlertTriangle } from 'lucide-react';

/**
 * MultiTabBlockScreen — full-screen blocking UI shown when the same user
 * tries to open this chat room in a second browser tab.
 */
export default function MultiTabBlockScreen({ roomCode }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '20px', padding: '24px', textAlign: 'center',
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: '14px',
        background: 'rgba(245,158,11,0.12)',
        border: '1px solid rgba(245,158,11,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 28px rgba(245,158,11,0.2)',
      }}>
        <AlertTriangle size={28} color="#f59e0b" />
      </div>

      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
          Session Already Active
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '360px', lineHeight: 1.6 }}>
          Room <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)', fontWeight: 600 }}>
            {roomCode}
          </span> is already open in another tab.
          <br />Close this tab, or switch to the active tab to continue.
        </p>
      </div>

      <div style={{
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: '10px', padding: '12px 20px',
        fontSize: '13px', color: 'rgba(245,158,11,0.85)',
        maxWidth: '340px', lineHeight: 1.5,
      }}>
        🔒 Multi-tab sessions are blocked to prevent message state conflicts and protect your privacy.
      </div>

      <button
        onClick={() => window.close()}
        style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '10px 24px',
          fontSize: '14px', fontWeight: 600,
          color: 'var(--text-muted)', cursor: 'pointer',
        }}
      >
        Close This Tab
      </button>
    </div>
  );
}
