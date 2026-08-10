import { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../../context/ToastContext';

export default function QRCodeModal({ url, roomCode, onClose }) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); addToast('Link copied!', 'success'); setTimeout(() => setCopied(false), 2000); }
    catch { addToast('Failed to copy', 'error'); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'VanishChat Room', text: `Join my VanishChat room: ${roomCode}`, url }); }
      catch { /* user cancelled */ }
    } else { handleCopy(); }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.82)' }}
      onClick={onClose}
    >
      <div
        className="animate-scale-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '28px', width: '100%', maxWidth: '340px', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          style={{
            position: 'absolute', top: '12px', right: '12px',
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s'
          }}
          title="Close"
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '17px', color: 'var(--text)', marginBottom: '4px' }}>Share Room</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Scan the QR code or share the link</p>
          </div>

          {/* QR Code */}
          <div style={{ background: '#fff', padding: '16px', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <QRCodeSVG value={url} size={180} level="M" bgColor="#ffffff" fgColor="#000000" />
          </div>

          {/* Room code */}
          <div>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Room Code</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '28px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.15em' }}>{roomCode}</p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={handleCopy}>
              {copied ? <><Check size={14} />Copied!</> : <><Copy size={14} />Copy</>}
            </button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleShare}>
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
