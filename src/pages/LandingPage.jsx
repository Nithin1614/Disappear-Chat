import { useState } from 'react';
import { ShieldCheck, Flame, LockKeyhole, ArrowRight, Sparkles, Shield, FileText, Info, X } from 'lucide-react';
import { useUser } from '../context/UserContext';
import UserSetup from '../components/auth/UserSetup';
import Header from '../components/ui/Header';

export default function LandingPage() {
  const { isAuthenticated, userId, displayName } = useUser();
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | 'about' | null

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column',
      overflowX: 'hidden', position: 'relative', scrollBehavior: 'smooth'
    }}>

      {/* Ambient background glow */}
      <div style={{
        position: 'absolute', top: '-140px', left: '50%', transform: 'translateX(-50%)',
        width: 'min(90vw, 700px)', height: '400px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, rgba(6,182,212,0.08) 55%, rgba(0,0,0,0) 80%)',
        pointerEvents: 'none', zIndex: 0, filter: 'blur(70px)', opacity: 0.95
      }} />

      <Header />

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '24px 16px 60px', maxWidth: '1040px', margin: '0 auto', width: '100%', zIndex: 1
      }}>

        {/* Hero Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px', maxWidth: '680px', width: '100%' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--surface-2)', border: '1px solid var(--accent-border)',
            borderRadius: '100px', padding: '5px 14px', marginBottom: '16px',
            boxShadow: '0 0 20px rgba(139,92,246,0.2)',
          }}>
            <Sparkles size={13} color="var(--accent)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.02em' }}>
              AES-256-GCM E2E Encrypted · Zero Logs
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(34px, 5.8vw, 60px)', fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: '14px'
          }}>
            Private Messaging. <br />
            <span style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 45%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 25px rgba(139,92,246,0.35))'
            }}>
              Zero History.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(14px, 1.8vw, 16px)', color: 'var(--text-muted)',
            maxWidth: '520px', margin: '0 auto', lineHeight: 1.55
          }}>
            Self-destructing rooms & secret links.
          </p>

          {/* Quick Dashboard link if already authenticated */}
          {isAuthenticated && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '12px', marginTop: '20px',
              background: 'var(--surface-2)', border: '1px solid var(--accent-border)',
              padding: '10px 18px', borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
              flexWrap: 'wrap', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>
                Welcome back, <strong style={{ color: 'var(--accent)' }}>{displayName || userId}</strong>
              </span>
              <button
                className="btn-primary"
                onClick={handleGoToDashboard}
                style={{ width: 'auto', padding: '7px 16px', fontSize: '12px' }}
              >
                Go to Dashboard <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Primary Call to Action: Identity Setup Box */}
        <div style={{ width: '100%', maxWidth: '420px', marginBottom: '48px' }}>
          <UserSetup />
        </div>

        {/* Feature Highlights Grid — Clean, responsive 3 cards */}
        <div style={{
          width: '100%', maxWidth: '920px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px'
        }}>

          {/* Card 1 */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px 20px',
            boxShadow: '0 10px 24px rgba(0,0,0,0.3)', transition: 'border-color 0.2s, transform 0.2s',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LockKeyhole size={18} color="var(--accent)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>End-to-End Encrypted</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              All text & files are encrypted in your browser before sending. No plaintext touches the server.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: '22px 20px',
            boxShadow: '0 12px 28px rgba(139,92,246,0.15)', transition: 'transform 0.2s',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={18} color="var(--danger)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>Self-Destruct & Burn</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              One-time view burn messages & secret links dissolve into particles upon expiration.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px 20px',
            boxShadow: '0 10px 24px rgba(0,0,0,0.3)', transition: 'border-color 0.2s, transform 0.2s',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--cyan-dim)', border: '1px solid rgba(6,182,212,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} color="var(--cyan)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>24h Automatic Clean</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              All data is deleted immediately as soon as a room is closed or expires. Temporary identities auto-wipe every 24 hours.
            </p>
          </div>

          {/* Bottom Card: 100% Free 24/7 Animated Banner */}
          <div style={{
            gridColumn: '1 / -1',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(139,92,246,0.14) 100%)',
            border: '2px solid rgba(16,185,129,0.45)',
            borderRadius: '18px',
            padding: '24px 28px',
            boxShadow: '0 12px 32px rgba(16,185,129,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            textAlign: 'center',
            marginTop: '12px',
            animation: 'freeBannerPulse 3s ease-in-out infinite'
          }}>
            <Sparkles size={24} color="var(--success)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 'clamp(16px, 2.2vw, 20px)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
              <span style={{
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
                fontSize: 'clamp(17px, 2.4vw, 22px)'
              }}>
                ✨ 100% Completely Free — 24/7 Available for Everyone.
              </span>{' '}
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                No credit card, no sign-up, no restrictions.
              </span>
            </p>
            <style>{`
              @keyframes freeBannerPulse {
                0%, 100% { transform: scale(1); boxShadow: 0 12px 32px rgba(16,185,129,0.2); borderColor: rgba(16,185,129,0.45); }
                50% { transform: scale(1.015); boxShadow: 0 16px 40px rgba(16,185,129,0.35); borderColor: rgba(16,185,129,0.7); }
              }
            `}</style>
          </div>

        </div>

      </main>

      {/* Footer Section */}
      <footer style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '28px 24px',
        width: '100%',
        zIndex: 1,
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1040px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          {/* Brand Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '6px',
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Shield size={14} color="var(--accent)" />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                VanishChat
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Private Messaging. Zero History. E2E Encrypted.
            </p>
          </div>

          {/* Nav Links: Terms, Privacy, About */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button
              onClick={() => setActiveModal('about')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              About
            </button>
            <button
              onClick={() => setActiveModal('privacy')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveModal('terms')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      {/* Info Modals */}
      {activeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px',
            maxWidth: '540px', width: '100%', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            maxHeight: '85vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {activeModal === 'about' && <Info size={20} color="var(--accent)" />}
                {activeModal === 'privacy' && <ShieldCheck size={20} color="var(--cyan)" />}
                {activeModal === 'terms' && <FileText size={20} color="var(--success)" />}
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  {activeModal === 'about' && 'About VanishChat'}
                  {activeModal === 'privacy' && 'Privacy Policy'}
                  {activeModal === 'terms' && 'Terms of Service'}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>

            {activeModal === 'about' && (
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p><strong style={{ color: 'var(--text)' }}>VanishChat</strong> is a zero-knowledge, self-destructing private messaging platform designed for maximum confidentiality.</p>
                <p>Every conversation is end-to-end encrypted client-side using Web Crypto API (AES-256-GCM + PBKDF2). No plaintext, key materials, or conversation history are ever written to server disk.</p>
                <p>VanishChat is 100% completely free and available 24/7 for everyone with no sign-ups, no user tracking, and no credit card required.</p>
              </div>
            )}

            {activeModal === 'privacy' && (
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p><strong style={{ color: 'var(--text)' }}>Zero Logs & Zero Tracking:</strong> We do not log IP addresses, personal data, or message metadata.</p>
                <p><strong style={{ color: 'var(--text)' }}>End-to-End Encryption:</strong> Encryption and decryption occur exclusively inside your browser. Encryption keys never leave your device.</p>
                <p><strong style={{ color: 'var(--text)' }}>Automatic Destruction:</strong> All rooms, messages, and temporary files dissolve automatically upon timer expiration or 24 hours of inactivity.</p>
              </div>
            )}

            {activeModal === 'terms' && (
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p><strong style={{ color: 'var(--text)' }}>Free Usage:</strong> VanishChat is offered 100% free of charge for lawful, private communication.</p>
                <p><strong style={{ color: 'var(--text)' }}>Acceptable Use:</strong> Users are prohibited from utilizing VanishChat for illegal activities, harassment, or malicious distribution.</p>
                <p><strong style={{ color: 'var(--text)' }}>No History Guarantee:</strong> Once a room or secret link is destroyed, data recovery is mathematically impossible.</p>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={() => setActiveModal(null)}
              style={{ marginTop: '24px', width: '100%', padding: '10px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
