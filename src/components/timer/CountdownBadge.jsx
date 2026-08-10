import { Timer } from 'lucide-react';

export default function CountdownBadge({ countdown, onExtendClick }) {
  const { formatted, percentage, isCritical, isUrgent, timerStarted } = countdown;

  const getStyle = () => {
    if (isCritical)        return { color: 'var(--danger)',  borderColor: 'rgba(239,68,68,0.35)',  bg: 'rgba(239,68,68,0.08)' };
    if (isUrgent)          return { color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.08)' };
    if (percentage < 50)   return { color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.2)',  bg: 'rgba(245,158,11,0.05)' };
    return                        { color: 'var(--success)', borderColor: 'rgba(34,197,94,0.3)',   bg: 'rgba(34,197,94,0.07)' };
  };

  const s = getStyle();

  return (
    <button
      onClick={onExtendClick}
      title="Click to vote for more time"
      style={{
        position: 'fixed', top: '64px', right: '16px', zIndex: 40,
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 14px', borderRadius: '100px',
        background: s.bg, border: `1px solid ${s.borderColor}`,
        cursor: 'pointer', transition: 'all 0.2s',
        animation: isCritical ? 'pulse-timer 1s ease-in-out infinite' : 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <Timer size={13} style={{ color: s.color }} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700, color: s.color, letterSpacing: '0.05em' }}>
        {timerStarted ? formatted : '-- : -- : --'}
      </span>
      <style>{`
        @keyframes pulse-timer {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
      `}</style>
    </button>
  );
}
