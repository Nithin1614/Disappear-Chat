import { useToast } from '../../context/ToastContext';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const CONFIG = {
  success: { Icon: CheckCircle, color: 'var(--success)', bg: 'rgba(34,197,94,0.08)' },
  warning: { Icon: AlertTriangle, color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)' },
  error:   { Icon: AlertCircle,  color: 'var(--danger)',  bg: 'rgba(239,68,68,0.08)'  },
  info:    { Icon: Info,         color: 'var(--info)',    bg: 'rgba(59,130,246,0.08)' },
};

export default function Toast() {
  const { toasts, removeToast } = useToast();
  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed', top: '16px', right: '16px',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px',
      width: '340px', maxWidth: 'calc(100vw - 32px)',
    }}>
      {toasts.map(t => {
        const { Icon, color, bg } = CONFIG[t.type] || CONFIG.info;
        return (
          <div key={t.id} className="animate-slide-in-right" style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderLeft: `3px solid ${color}`,
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <Icon size={16} style={{ color, marginTop: '1px', flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: 'var(--text)', flex: 1, lineHeight: '1.4' }}>{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '0', flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
