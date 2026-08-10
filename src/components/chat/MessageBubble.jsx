import { Check, CheckCheck, Download, File } from 'lucide-react';

export default function MessageBubble({ message, isSender, decryptedContent, decryptedImageUrl, onDownloadFile, senderName }) {
  const isImage  = message.type === 'image';
  const isFile   = message.type === 'file';
  const isSystem = message.type === 'system';

  const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtSize = b => { if (!b) return ''; if (b < 1024) return `${b}B`; if (b < 1048576) return `${(b/1024).toFixed(1)}KB`; return `${(b/1048576).toFixed(1)}MB`; };

  if (isSystem) return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-dim)', background: 'var(--surface-2)', padding: '4px 12px', borderRadius: '100px', border: '1px solid var(--border)' }}>
        {decryptedContent || '...'}
      </span>
    </div>
  );

  const displayName = senderName || message.sender_id;

  return (
    <div style={{ display: 'flex', justifyContent: isSender ? 'flex-end' : 'flex-start', marginBottom: '8px', padding: '0 16px' }}>
      <div style={{
        maxWidth: '75%',
        background: isSender ? 'var(--accent)' : 'var(--surface-2)',
        color: isSender ? '#fff' : 'var(--text)',
        border: isSender ? 'none' : '1px solid var(--border)',
        borderRadius: isSender ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        padding: '10px 14px',
        position: 'relative',
      }}>
        {/* Username for received messages */}
        {!isSender && displayName && (
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', marginBottom: '4px' }}>
            {displayName}
          </p>
        )}

        {/* Image */}
        {isImage && decryptedImageUrl && (
          <img src={decryptedImageUrl} alt="Shared" style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', display: 'block', marginBottom: '6px', cursor: 'pointer' }}
            onClick={() => window.open(decryptedImageUrl, '_blank')} />
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

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', opacity: 0.55 }}>{fmtTime(message.created_at)}</span>
          {isSender && (message.is_read
            ? <CheckCheck size={13} style={{ opacity: 0.9, color: isSender ? 'rgba(255,255,255,0.8)' : 'var(--accent)' }} />
            : <Check size={13} style={{ opacity: 0.5 }} />)}
        </div>
      </div>
    </div>
  );
}
