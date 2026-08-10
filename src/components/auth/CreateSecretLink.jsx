import { useState } from 'react';
import { Flame, Copy, Check, Link } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Derive AES key from token
async function deriveKeyFromToken(token) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(token + '-vanishsecret'), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('vanishlink-salt'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptContent(text, key) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text));
  const toBase64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  return { encryptedBase64: toBase64(encrypted), ivBase64: toBase64(iv) };
}

const TTL_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 24 * 7 },
  { label: 'Never expires', hours: null },
];

export default function CreateSecretLink() {
  const [messageText, setMessageText] = useState('');
  const [ttl, setTtl] = useState(TTL_OPTIONS[0]);
  const [creating, setCreating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!messageText.trim() || creating) return;
    setCreating(true);
    try {
      const token = crypto.randomUUID().replace(/-/g, '');
      const key = await deriveKeyFromToken(token);
      const { encryptedBase64, ivBase64 } = await encryptContent(messageText.trim(), key);

      const expiresAt = ttl.hours
        ? new Date(Date.now() + ttl.hours * 3600 * 1000).toISOString()
        : null;

      const { error } = await supabase.from('secret_links').insert({
        token,
        encrypted_content: encryptedBase64,
        iv: ivBase64,
        expires_at: expiresAt,
        is_read: false,
      });

      if (error) throw error;

      const url = `${window.location.origin}/s/${token}`;
      setGeneratedUrl(url);
      setMessageText('');
    } catch (err) {
      alert(err.message || 'Failed to create link');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const wordCount = messageText.trim() ? messageText.trim().split(/\s+/).filter(Boolean).length : 0;
  const calculatedSeconds = (() => {
    if (wordCount <= 1) return 5;
    if (wordCount === 2) return 6;
    if (wordCount === 3) return 7;
    if (wordCount <= 10) return 3 + wordCount;
    return 5 + wordCount;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Create a one-time encrypted link. The message is deleted permanently after the recipient reads it.
      </p>

      <div>
        <textarea
          value={messageText}
          onChange={e => setMessageText(e.target.value)}
          placeholder="Type your secret message…"
          rows={4}
          style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px',
            color: 'var(--text)', padding: '12px 14px', fontSize: '14px', fontFamily: 'inherit',
            resize: 'vertical', outline: 'none', width: '100%', lineHeight: 1.5
          }}
          onFocus={e => e.target.style.borderColor = 'var(--danger)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {messageText.trim() && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11px', color: 'var(--danger)', fontWeight: 600 }}>
            <Flame size={12} />
            <span>Self-destruct timer: {calculatedSeconds}s after reveal ({wordCount} word{wordCount !== 1 ? 's' : ''})</span>
          </div>
        )}
      </div>

      {/* TTL selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TTL_OPTIONS.map(opt => (
          <button
            key={opt.label}
            onClick={() => setTtl(opt)}
            style={{
              background: ttl.label === opt.label ? 'rgba(239,68,68,0.15)' : 'var(--surface-2)',
              border: ttl.label === opt.label ? '1px solid rgba(239,68,68,0.45)' : '1px solid var(--border)',
              borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', color: ttl.label === opt.label ? 'var(--danger)' : 'var(--text-muted)',
              transition: 'all 0.15s'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleCreate}
        disabled={creating || !messageText.trim()}
        style={{
          background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '10px',
          padding: '12px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          opacity: (creating || !messageText.trim()) ? 0.45 : 1
        }}
      >
        <Flame size={16} /> {creating ? 'Creating…' : 'Generate Self-Destruct Link'}
      </button>

      {/* Generated URL */}
      {generatedUrl && (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link size={14} color="var(--accent)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>Link ready — share it once!</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              readOnly
              value={generatedUrl}
              style={{
                flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: 'var(--text)',
                fontFamily: 'JetBrains Mono, monospace', outline: 'none'
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                background: 'var(--accent)', border: 'none', borderRadius: '8px',
                padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                color: '#fff', fontSize: '12px', fontWeight: 700, flexShrink: 0
              }}
            >
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            🔒 Expires: {ttl.hours ? `After ${ttl.label}` : 'Never'} · Deleted on first read
          </p>
        </div>
      )}
    </div>
  );
}
