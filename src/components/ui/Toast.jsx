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
    <>
      <div className="system-toast-container">
        {toasts.map(t => {
          const { Icon, color } = CONFIG[t.type] || CONFIG.info;
          return (
            <div key={t.id} className="animate-slide-in-right system-toast-card">
              <Icon size={16} style={{ color, marginTop: '1px', flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: 'var(--text)', flex: 1, lineHeight: '1.4', margin: 0, wordBreak: 'break-word' }}>{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '0', flexShrink: 0 }}
                title="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        .system-toast-container {
          position: fixed;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 8px;
          pointer-events: none;
          top: 20px;
          right: 20px;
          width: 340px;
          max-width: calc(100vw - 32px);
        }

        @media (max-width: 600px) {
          .system-toast-container {
            top: 14px !important;
            right: auto !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: calc(100vw - 32px) !important;
            max-width: 400px !important;
          }
        }

        .system-toast-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-left: 3px solid var(--accent);
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          pointer-events: all;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        }
      `}</style>
    </>
  );
}
