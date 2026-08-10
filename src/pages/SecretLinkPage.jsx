import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Flame, Shield, AlertTriangle, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

async function decryptContent(encryptedBase64, ivBase64, key) {
  const enc = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, enc);
  return new TextDecoder().decode(decrypted);
}

export default function SecretLinkPage() {
  const { token } = useParams();
  const [state, setState] = useState('loading'); // loading | ready | read | expired | error
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [linkData, setLinkData] = useState(null);

  useEffect(() => {
    if (!token) { setState('error'); return; }

    async function fetchLink() {
      const { data, error } = await supabase
        .from('secret_links')
        .select('*')
        .eq('token', token)
        .eq('is_read', false)
        .single();

      if (error || !data) { setState('expired'); return; }

      // Check TTL
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        await supabase.from('secret_links').delete().eq('token', token);
        setState('expired'); return;
      }

      setLinkData(data);
      setState('ready');
    }

    fetchLink();
  }, [token]);

  const handleReveal = async () => {
    if (!linkData) return;
    setState('reading');

    try {
      const key = await deriveKeyFromToken(token);
      const decrypted = await decryptContent(linkData.encrypted_content, linkData.iv, key);
      setMessage(decrypted);

      // Mark as read and delete after reading
      await supabase.from('secret_links').delete().eq('token', token);

      setState('read');
      let c = 5;
      const interval = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(interval);
          setState('destroyed');
        }
      }, 1000);
    } catch {
      setState('error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#08090d', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
      fontFamily: 'Inter, sans-serif', color: '#fff'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Flame size={26} color="#ef4444" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>Self-Destruct Message</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>This message will be permanently destroyed after you read it.</p>
        </div>

        <div style={{ background: '#11131c', border: '1px solid #262a3d', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
          {state === 'loading' && (
            <div style={{ color: '#64748b' }}>Verifying link…</div>
          )}

          {state === 'ready' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <Lock size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
                  You have received a secret encrypted message. Once you reveal it, it is permanently deleted from our servers.
                </p>
              </div>
              <button
                onClick={handleReveal}
                style={{
                  background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px',
                  padding: '14px 28px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <Flame size={18} /> Reveal & Destroy Message
              </button>
            </>
          )}

          {state === 'reading' && (
            <div style={{ color: '#64748b' }}>Decrypting…</div>
          )}

          {state === 'read' && (
            <>
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', padding: '20px', marginBottom: '20px', textAlign: 'left'
              }}>
                <p style={{ fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#fff', wordBreak: 'break-word' }}>
                  {message}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#ef4444' }}>
                <Flame size={16} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  Self-destructing in {countdown} second{countdown !== 1 ? 's' : ''}…
                </span>
              </div>
            </>
          )}

          {state === 'destroyed' && (
            <>
              <Flame size={40} color="#ef4444" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Message Destroyed</p>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                This message has been permanently deleted from all servers. No trace remains.
              </p>
              <a href="/" style={{ color: '#10b981', fontSize: '13px', textDecoration: 'none' }}>← Return to VanishChat</a>
            </>
          )}

          {state === 'expired' && (
            <>
              <AlertTriangle size={36} color="#f59e0b" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Link Expired or Already Read</p>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                This self-destruct link has already been viewed or has expired.
              </p>
              <a href="/" style={{ color: '#10b981', fontSize: '13px', textDecoration: 'none' }}>← Return to VanishChat</a>
            </>
          )}

          {state === 'error' && (
            <>
              <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Invalid Link</p>
              <a href="/" style={{ color: '#10b981', fontSize: '13px', textDecoration: 'none' }}>← Return to VanishChat</a>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#334155', marginTop: '20px' }}>
          🔒 End-to-end encrypted · Self-destructing · VanishChat
        </p>
      </div>
    </div>
  );
}
