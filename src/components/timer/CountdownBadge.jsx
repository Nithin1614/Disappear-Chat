import { Timer, Plus } from 'lucide-react';

export default function CountdownBadge({ countdown, onExtendClick }) {
  const { formatted, percentage, isCritical, isUrgent, timerStarted } = countdown;

  const getStyle = () => {
    if (isCritical)        return { color: 'var(--danger)',  borderColor: 'rgba(239,68,68,0.4)',  bg: 'rgba(239,68,68,0.1)' };
    if (isUrgent)          return { color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.1)' };
    if (percentage < 50)   return { color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.25)',bg: 'rgba(245,158,11,0.06)' };
    return                        { color: 'var(--success)', borderColor: 'rgba(34,197,94,0.3)',   bg: 'rgba(34,197,94,0.08)' };
  };

  const s = getStyle();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {/* Timer Pill */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '100px',
          background: s.bg, border: `1px solid ${s.borderColor}`,
          animation: isCritical ? 'pulse-timer 1s ease-in-out infinite' : 'none',
        }}
      >
        <Timer size={13} style={{ color: s.color }} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700, color: s.color, letterSpacing: '0.05em' }}>
          {timerStarted ? formatted : 'Starts on first msg'}
        </span>
      </div>

      {/* Explicit Extend Time Button */}
      <button
        onClick={onExtendClick}
        title="Request time extension"
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '5px 10px', borderRadius: '100px',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <Plus size={13} /> Extend
      </button>

      <style>{`
        @keyframes pulse-timer {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
