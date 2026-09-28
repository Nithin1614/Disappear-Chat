import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Image as ImageIcon, File, Flame } from 'lucide-react';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, SUPPORTED_IMAGE_TYPES } from '../../lib/constants';

export default function MessageInput({ onSendMessage, onSendFile, onTyping, onFocus, disabled }) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [burnMode, setBurnMode] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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
      try { await onSendFile(selectedFile, burnMode); setSelectedFile(null); if (burnMode) setBurnMode(false); } catch { /* handled */ }
      setSending(false);
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await onSendMessage(trimmed, burnMode);
      setText('');
      if (burnMode) setBurnMode(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch { /* handled */ }
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
    <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '10px 14px' }}>

      {/* Burn mode banner */}
      {burnMode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
          padding: '6px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: '8px'
        }}>
          <Flame size={13} color="var(--danger)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--danger)', flex: 1 }}>
            Burn After Read — recipient sees this once, then it self-destructs
          </span>
          <button onClick={() => setBurnMode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px' }}>
          <div style={{ width: 30, height: 30, borderRadius: '6px', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach file"
          style={{ flexShrink: 0, width: 38, height: 38, borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer', color: 'var(--text-muted)', transition: 'color 0.15s', opacity: disabled ? 0.4 : 1 }}
        >
          <Paperclip size={17} />
        </button>
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />

        {/* Burn toggle */}
        <button
          onClick={() => setBurnMode(v => !v)}
          disabled={disabled}
          title={burnMode ? 'Disable Burn After Read' : 'Enable Burn After Read'}
          style={{
            flexShrink: 0, width: 38, height: 38, borderRadius: '10px',
            background: burnMode ? 'rgba(239,68,68,0.18)' : 'var(--surface-2)',
            border: burnMode ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer', color: burnMode ? 'var(--danger)' : 'var(--text-muted)',
            transition: 'all 0.15s', opacity: disabled ? 0.4 : 1
          }}
        >
          <Flame size={17} />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); if (onTyping) onTyping(); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={selectedFile ? 'Add a caption...' : burnMode ? '🔥 Burn after read message...' : 'Type a message...'}
          disabled={disabled}
          rows={1}
          style={{
            flex: 1, resize: 'none', maxHeight: '100px', overflowY: 'auto',
            background: burnMode ? 'rgba(239,68,68,0.07)' : 'var(--surface-2)',
            border: burnMode ? '1px solid rgba(239,68,68,0.35)' : '1px solid var(--border)',
            borderRadius: '10px',
            color: 'var(--text)', padding: '10px 14px', fontSize: '16px', fontFamily: 'inherit', lineHeight: '1.4',
            outline: 'none', transition: 'border-color 0.15s', opacity: disabled ? 0.4 : 1,
            touchAction: 'manipulation'
          }}
          onFocus={e => {
            e.target.style.borderColor = burnMode ? 'rgba(239,68,68,0.6)' : 'var(--accent)';
            if (onFocus) onFocus();
          }}
          onBlur={e => e.target.style.borderColor = burnMode ? 'rgba(239,68,68,0.35)' : 'var(--border)'}
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={sending || disabled || (!text.trim() && !selectedFile)}
          style={{
            flexShrink: 0, width: 38, height: 38, borderRadius: '10px',
            background: burnMode ? 'var(--danger)' : 'var(--accent)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: (sending || disabled || (!text.trim() && !selectedFile)) ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s, transform 0.1s',
            opacity: (sending || disabled || (!text.trim() && !selectedFile)) ? 0.35 : 1,
          }}
        >
          {sending
            ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite' }} />
            : <Send size={16} color="#fff" />}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
