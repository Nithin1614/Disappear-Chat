import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Image as ImageIcon, File } from 'lucide-react';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, SUPPORTED_IMAGE_TYPES } from '../../lib/constants';

export default function MessageInput({ onSendMessage, onSendFile, onTyping, disabled }) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [text]);

  const handleSend = async () => {
    if (sending || disabled) return;
    if (selectedFile) {
      setSending(true);
      try { await onSendFile(selectedFile); setSelectedFile(null); } catch { /* handled by parent */ }
      setSending(false);
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await onSendMessage(trimmed);
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch { /* handled by parent */ }
    setSending(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) { alert(`File too large. Max ${MAX_FILE_SIZE_MB}MB.`); return; }
    setSelectedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isImage = selectedFile && SUPPORTED_IMAGE_TYPES.includes(selectedFile.type);

  return (
    <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '12px 16px' }}>
      {/* File preview */}
      {selectedFile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '6px', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isImage ? <ImageIcon size={14} color="var(--accent)" /> : <File size={14} color="var(--accent)" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedFile.name}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        {/* Attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach file"
          style={{ flexShrink: 0, width: 38, height: 38, borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.15s', opacity: disabled ? 0.4 : 1 }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Paperclip size={16} />
        </button>
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); if (onTyping) onTyping(); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={selectedFile ? 'Add a caption...' : 'Message...'}
          disabled={disabled}
          rows={1}
          style={{
            flex: 1, resize: 'none', maxHeight: '120px', overflowY: 'auto',
            background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px',
            color: 'var(--text)', padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit', lineHeight: '1.5',
            outline: 'none', transition: 'border-color 0.15s', opacity: disabled ? 0.4 : 1,
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={sending || disabled || (!text.trim() && !selectedFile)}
          style={{
            flexShrink: 0, width: 38, height: 38, borderRadius: '10px',
            background: 'var(--accent)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 0.15s, transform 0.1s',
            opacity: (sending || disabled || (!text.trim() && !selectedFile)) ? 0.3 : 1,
          }}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--accent-hover)'; }}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {sending
            ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite' }} />
            : <Send size={15} color="#fff" />}
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </button>
      </div>

      {/* Hint */}
      {!disabled && (
        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>Enter to send · Shift+Enter for new line</p>
      )}
    </div>
  );
}
