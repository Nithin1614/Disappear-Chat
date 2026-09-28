import { useState, useEffect, useRef } from 'react';
import { Check, CheckCheck, Download, File, Flame, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function MessageBubble({ message, isSender, decryptedContent, decryptedImageUrl, onDownloadFile, senderName }) {
  const isImage  = message.type === 'image';
  const isFile   = message.type === 'file';
  const isSystem = message.type === 'system';
  const isBurn   = message.burn_after_read === true;

  const [burnRevealed, setBurnRevealed] = useState(false);
  const [burnCountdown, setBurnCountdown] = useState(null);
  const [isSnapping, setIsSnapping] = useState(false);
  const [burnDone, setBurnDone] = useState(false);
  const burnTimerRef = useRef(null);

  const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtSize = b => { if (!b) return ''; if (b < 1024) return `${b}B`; if (b < 1048576) return `${(b/1024).toFixed(1)}KB`; return `${(b/1048576).toFixed(1)}MB`; };

  const handleRevealBurn = () => {
    if (burnRevealed || isSender) return;
    setBurnRevealed(true);
    setBurnCountdown(5);

    burnTimerRef.current = setInterval(() => {
      setBurnCountdown(prev => {
        if (prev <= 2 && !isSnapping) {
          setIsSnapping(true);
        }
        if (prev <= 1) {
          clearInterval(burnTimerRef.current);
          setTimeout(() => {
            setBurnDone(true);
            supabase.from('messages').delete().eq('id', message.id).then(() => {});
          }, 1200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (burnTimerRef.current) clearInterval(burnTimerRef.current); }, []);

  if (isSystem) return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-dim)', background: 'var(--surface-2)', padding: '4px 12px', borderRadius: '100px', border: '1px solid var(--border)' }}>
        {decryptedContent || '...'}
      </span>
    </div>
  );

  if (burnDone) return (
    <div style={{ display: 'flex', justifyContent: isSender ? 'flex-end' : 'flex-start', marginBottom: '8px', padding: '0 16px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Flame size={13} color="var(--danger)" /> Message Vanished
      </span>
    </div>
  );

  const displayName = senderName || message.sender_id;
  const showBurnLocked = isBurn && !isSender && !burnRevealed;

  return (
    <div style={{
      display: 'flex', justifyContent: isSender ? 'flex-end' : 'flex-start',
      marginBottom: '8px', padding: '0 16px', position: 'relative'
    }}>

      {/* Disintegrating particle overlay when Thanos snap triggers */}
      {isSnapping && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}>
          {Array.from({ length: 24 }).map((_, i) => {
            const rx = (Math.random() - 0.5) * 120;
            const ry = -(Math.random() * 80 + 20);
            const hue = Math.random() > 0.5 ? 270 : 340;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: Math.random() * 5 + 2,
                  height: Math.random() * 5 + 2,
                  borderRadius: '50%',
                  background: `hsl(${hue}, 85%, 60%)`,
                  boxShadow: `0 0 6px hsl(${hue}, 90%, 60%)`,
                  animation: `burn-particle-drift 1.2s ease-out forwards`,
                  transform: `translate(${rx}px, ${ry}px)`,
                  opacity: 0,
                }}
              />
            );
          })}
        </div>
      )}

      <div
        className={isSnapping ? 'thanos-snap-anim' : ''}
        style={{
          maxWidth: '75%',
          background: isBurn
            ? (isSender ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.14)')
            : (isSender ? 'var(--accent)' : 'var(--surface-2)'),
          color: isSender ? '#fff' : 'var(--text)',
          border: isBurn
            ? '1px solid rgba(239,68,68,0.45)'
            : (isSender ? 'none' : '1px solid var(--border)'),
          borderRadius: isSender ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding: '10px 14px',
          position: 'relative',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Burn indicator */}
        {isBurn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Flame size={12} color="var(--danger)" />
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {isSender ? 'Burn After Read' : (burnRevealed ? (isSnapping ? 'Disintegrating…' : `Self-destructs in ${burnCountdown}s`) : 'Tap to reveal')}
            </span>
          </div>
        )}

        {/* Username for received messages */}
        {!isSender && displayName && (
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', marginBottom: '4px' }}>
            {displayName}
          </p>
        )}

        {/* Burn locked state */}
        {showBurnLocked ? (
          <button
            onClick={handleRevealBurn}
            style={{
              background: 'rgba(239,68,68,0.15)', border: '1px dashed rgba(239,68,68,0.5)',
              borderRadius: '10px', padding: '14px 20px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              width: '100%', color: 'var(--danger)', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          >
            <Eye size={22} />
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Tap to reveal — message self-destructs</span>
          </button>
        ) : (
          <>
            {/* Image */}
            {isImage && decryptedImageUrl && (
              <img src={decryptedImageUrl} alt="Shared" style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', display: 'block', marginBottom: '6px', cursor: 'pointer' }}
                onClick={() => window.open(decryptedImageUrl, '_blank')} />
            )}
            {isImage && !decryptedImageUrl && (
              <div style={{ padding: '20px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                🔒 Decrypting image…
              </div>
            )}

            {/* File */}
            {isFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: isSender ? 'rgba(255,255,255,0.12)' : 'var(--surface-3)', marginBottom: '6px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '6px', background: isSender ? 'rgba(255,255,255,0.15)' : 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <File size={14} color={isSender ? '#fff' : 'var(--accent)'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: isSender ? '#fff' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{message.file_name || 'File'}</p>
                  <p style={{ fontSize: '11px', color: isSender ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>{fmtSize(message.file_size)}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); onDownloadFile && onDownloadFile(message); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSender ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', display: 'flex', padding: '4px' }}>
                  <Download size={14} />
                </button>
              </div>
            )}

            {/* Text */}
            {decryptedContent && (
              <p style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {decryptedContent}
              </p>
            )}
            {!decryptedContent && !isImage && !isFile && (
              <p style={{ fontSize: '14px', opacity: 0.4, fontStyle: 'italic' }}>Decrypting...</p>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', opacity: 0.55 }}>{fmtTime(message.created_at)}</span>
          {isSender && (message.is_read
            ? <CheckCheck size={13} style={{ opacity: 0.9, color: isSender ? 'rgba(255,255,255,0.8)' : 'var(--accent)' }} />
            : <Check size={13} style={{ opacity: 0.5 }} />)}
        </div>
      </div>

      <style>{`
        @keyframes burn-particle-drift {
          0%   { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--rx, 40px), var(--ry, -50px)) scale(0.2); }
        }
      `}</style>
    </div>
  );
}
