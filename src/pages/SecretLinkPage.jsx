import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Flame, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useThanosSnap } from '../hooks/useThanosSnap';

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
  const [state, setState] = useState('loading'); // loading | ready | reading | read | snapping | destroyed | error
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [linkData, setLinkData] = useState(null);
  const cardRef = useRef(null);
  const { triggerSnap } = useThanosSnap();

  useEffect(() => {
    if (!token) { setState('error'); return; }

    // If already revealed or viewed in this browser, never show again
    if (sessionStorage.getItem('viewed_' + token) || localStorage.getItem('viewed_' + token)) {
      setState('destroyed');
      return;
    }

    async function fetchLink() {
      const { data, error } = await supabase
        .from('secret_links')
        .select('*')
        .eq('token', token)
        .eq('is_read', false)
        .single();

      if (error || !data) { setState('destroyed'); return; }

      // Check TTL
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        await supabase.from('secret_links').delete().eq('token', token);
        setState('destroyed'); return;
      }

      setLinkData(data);
      setState('ready');
    }

    fetchLink();
  }, [token]);

  function calculateSelfDestructSeconds(text) {
    if (!text || !text.trim()) return 5;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    if (words <= 1) return 5;
    if (words === 2) return 6;
    if (words === 3) return 7;
    if (words <= 10) return 3 + words;
    return 5 + words;
  }

  const handleReveal = async () => {
    if (!linkData) return;
    setState('reading');

    // Mark as viewed in browser storage immediately so refresh can NEVER reload it
    try {
      sessionStorage.setItem('viewed_' + token, 'true');
      localStorage.setItem('viewed_' + token, 'true');
    } catch {}

    // Delete from DB immediately on reveal so no other request or tab can read it
    supabase.from('secret_links').delete().eq('token', token).then(() => {});

    try {
      const key = await deriveKeyFromToken(token);
      const decrypted = await decryptContent(linkData.encrypted_content, linkData.iv, key);
      setMessage(decrypted);

      const initialSeconds = calculateSelfDestructSeconds(decrypted);
      setCountdown(initialSeconds);

      setState('read');
      let c = initialSeconds;
      const interval = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 1) {
          clearInterval(interval);
          setState('snapping');
          if (cardRef.current) {
            triggerSnap(cardRef.current, () => {
              setState('destroyed');
            });
          } else {
            setState('destroyed');
          }
        }
      }, 1000);
    } catch {
      setState('destroyed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
      fontFamily: 'inherit', color: 'var(--text)', position: 'relative'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius)',
            background: 'var(--danger-dim)', border: '1px solid rgba(255,71,71,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <Flame size={24} color="var(--danger)" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '6px', color: 'var(--text)' }}>
            Self-Destruct Message
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            This message will be permanently dissolved into dust after you read it.
          </p>
        </div>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
          padding: '28px', textAlign: 'center', position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.35)'
        }}>

          {state === 'loading' && (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Verifying link cryptographic token…</div>
          )}

          {state === 'ready' && (
            <>
              <div style={{ marginBottom: '24px' }}>
                <Lock size={32} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  You have received an encrypted one-time note. Once revealed, the particle disintegration engine destroys it permanently.
                </p>
              </div>
              <button
                onClick={handleReveal}
                style={{
                  background: 'var(--danger)', color: '#FFFFFF', border: 'none', borderRadius: 'var(--radius-pill)',
                  padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 14px rgba(255,71,71,0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Flame size={16} /> Reveal & Destroy Message
              </button>
            </>
          )}

          {state === 'reading' && (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Decrypting payload…</div>
          )}

          {(state === 'read' || state === 'snapping') && (
            <div style={{ position: 'relative' }}>
              <div
                ref={cardRef}
                style={{
                  background: 'var(--danger-dim)', border: '1px solid rgba(255,71,71,0.35)',
                  borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px', textAlign: 'left'
                }}
              >
                <p style={{ fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text)', wordBreak: 'break-word' }}>
                  {message}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--danger)' }}>
                <Flame size={16} />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>
                  {state === 'snapping' ? 'Disintegrating…' : `Self-destructing in ${countdown} second${countdown !== 1 ? 's' : ''}…`}
                </span>
              </div>
            </div>
          )}

          {(state === 'destroyed' || state === 'expired') && (
            <>
              <Flame size={40} color="var(--danger)" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px', color: 'var(--text)' }}>Message Deleted</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                This one-time message was viewed and permanently deleted.
              </p>
              <a href="/" style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                ← Return to VanishChat
              </a>
            </>
          )}

          {state === 'error' && (
            <>
              <AlertTriangle size={36} color="var(--danger)" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>Invalid Link</p>
              <a href="/" style={{ color: 'var(--accent)', fontSize: '13px', textDecoration: 'none' }}>← Return to VanishChat</a>
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
