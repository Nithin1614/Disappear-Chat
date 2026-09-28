import { useState } from 'react';
import { 
  ShieldCheck, Flame, LockKeyhole, ArrowRight, Sparkles, Shield, FileText, Info, X, 
  HelpCircle, Clock, KeyRound, UserPlus, Link2, EyeOff, Copy, Maximize2
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import UserSetup from '../components/auth/UserSetup';
import Header from '../components/ui/Header';

export default function LandingPage() {
  const { isAuthenticated, userId, displayName } = useUser();
  const [activeModal, setActiveModal] = useState(null); // 'how-it-works' | 'security' | 'faq' | 'privacy' | 'terms' | null
  const [openFaq, setOpenFaq] = useState(null);

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const faqs = [
    {
      q: "How does end-to-end encryption work on VanishChat?",
      a: "All text and files are encrypted client-side in your browser using the Web Crypto API (AES-256-GCM + PBKDF2). Servers only receive encrypted ciphertext and random IVs. Plaintext never touches our servers."
    },
    {
      q: "Are room messages and files permanently deleted?",
      a: "Yes. When a room timer expires or the room is closed, all messages, images, and files dissolve permanently from database memory using particle disintegration. Nothing is archived or logged."
    },
    {
      q: "Do I need to sign up or provide an email?",
      a: "No. VanishChat requires zero accounts, zero emails, and zero phone numbers. Your temporary 6-character ID is generated locally and auto-wipes after 24 hours."
    },
    {
      q: "Is VanishChat 100% free with no restrictions?",
      a: "Yes! VanishChat is 100% completely free 24/7 for everyone with no subscription fees, no ads, and no credit card required."
    },
    {
      q: "How do one-time view Secret Links work?",
      a: "Secret links self-destruct immediately after being viewed once. The decryption key lives exclusively in the URL #hash fragment, which browsers never transmit to servers."
    },
    {
      q: "What happens if I accidentally close or leave a room?",
      a: "If you accidentally exit an active room, a single-use 12-second Re-Entry Card automatically appears on your Dashboard so you can instantly rejoin before the room closes."
    }
  ];

  const chipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '100px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
  };

  const footerLinkStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.15s ease',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>

      {/* Ambient background glow */}
      <div style={{
        position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
        width: 'min(90vw, 650px)', height: '320px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(6,182,212,0.06) 55%, rgba(0,0,0,0) 80%)',
        pointerEvents: 'none', zIndex: 0, filter: 'blur(70px)', opacity: 0.95
      }} />

      <Header />

      {/* Main Focus Area: Centered, Zero-Scroll on PC */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(20px, 3.5vh, 40px) 16px',
        maxWidth: '580px',
        margin: '0 auto',
        width: '100%',
        zIndex: 1,
        textAlign: 'center'
      }}>

        {/* Hero Headline Block */}
        <div style={{ marginBottom: '20px', width: '100%' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--surface-2)', border: '1px solid var(--accent-border)',
            borderRadius: '100px', padding: '4px 14px', marginBottom: '12px',
            boxShadow: '0 0 16px rgba(139,92,246,0.18)',
          }}>
            <Sparkles size={12} color="var(--accent)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.02em' }}>
              AES-256-GCM E2E Encrypted · Zero Logs
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '8px'
          }}>
            Private Messaging. <br />
            <span style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 45%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.3))'
            }}>
              Zero History.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(13px, 1.6vw, 15px)', color: 'var(--text-muted)',
            maxWidth: '420px', margin: '0 auto', lineHeight: 1.45
          }}>
            Self-destructing rooms & secret links. Nothing stays.
          </p>

          {/* Quick Dashboard link if already authenticated */}
          {isAuthenticated && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px', marginTop: '12px',
              background: 'var(--surface-2)', border: '1px solid var(--accent-border)',
              padding: '6px 14px', borderRadius: '10px', boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                Active as <strong style={{ color: 'var(--accent)' }}>{displayName || userId}</strong>
              </span>
              <button
                className="btn-primary"
                onClick={handleGoToDashboard}
                style={{ width: 'auto', padding: '4px 12px', fontSize: '11px' }}
              >
                Go to Dashboard <ArrowRight size={11} />
              </button>
            </div>
          )}
        </div>

        {/* The Hero Tool: Identity Setup Box */}
        <div style={{ width: '100%', maxWidth: '380px', marginBottom: '20px' }}>
          <UserSetup />
        </div>

        {/* Interactive Feature Chips (Directly below identity card) */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: '440px'
        }}>
          <button 
            onClick={() => setActiveModal('security')} 
            style={chipStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <LockKeyhole size={13} color="var(--accent)" />
            <span>E2E Encrypted</span>
          </button>

          <button 
            onClick={() => setActiveModal('how-it-works')} 
            style={chipStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Flame size={13} color="var(--danger)" />
            <span>Self-Destruct</span>
          </button>

          <button 
            onClick={() => setActiveModal('privacy')} 
            style={chipStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Clock size={13} color="var(--cyan)" />
            <span>24h Auto-Wipe</span>
          </button>
        </div>

      </main>

      {/* Ultra-Clean Single-Line Footer */}
      <footer style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '14px 20px',
        width: '100%',
        zIndex: 1,
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '960px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Left: Brand + 100% Free badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 22, height: 22, borderRadius: '6px',
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Shield size={12} color="var(--accent)" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              VanishChat
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              · 100% Free 24/7
            </span>
          </div>

          {/* Right: Quick modal trigger links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setActiveModal('how-it-works')} 
              style={footerLinkStyle}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} 
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              How It Works
            </button>
            <button 
              onClick={() => setActiveModal('security')} 
              style={footerLinkStyle}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} 
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Security
            </button>
            <button 
              onClick={() => setActiveModal('faq')} 
              style={footerLinkStyle}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} 
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              FAQ
            </button>
            <button 
              onClick={() => setActiveModal('privacy')} 
              style={footerLinkStyle}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} 
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => setActiveModal('terms')} 
              style={footerLinkStyle}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} 
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Terms
            </button>
          </div>
        </div>
      </footer>

      {/* On-Demand Frosted Glass Info Modals */}
      {activeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px',
            maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            maxHeight: '85vh', overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {activeModal === 'how-it-works' && <Flame size={18} color="var(--danger)" />}
                {activeModal === 'security' && <LockKeyhole size={18} color="var(--accent)" />}
                {activeModal === 'faq' && <HelpCircle size={18} color="var(--cyan)" />}
                {activeModal === 'privacy' && <ShieldCheck size={18} color="var(--cyan)" />}
                {activeModal === 'terms' && <FileText size={18} color="var(--accent)" />}
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  {activeModal === 'how-it-works' && 'How VanishChat Works'}
                  {activeModal === 'security' && 'Security Architecture'}
                  {activeModal === 'faq' && 'Frequently Asked Questions'}
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

            {/* Modal Body: How It Works */}
            {activeModal === 'how-it-works' && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>01. Create Identity</strong>
                  Enter any username. The app instantly generates a local 24-hour anonymous key. No signup, email, or password required.
                </div>
                <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <strong style={{ color: 'var(--cyan)', display: 'block', marginBottom: '4px' }}>02. Share Secret Room or Link</strong>
                  Create a room with a custom timer (1 min to 24 hrs) and invite your partner via room code or QR code. Or send a single-view Secret Link.
                </div>
                <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <strong style={{ color: 'var(--danger)', display: 'block', marginBottom: '4px' }}>03. Permanent Disintegration</strong>
                  All messages and files are encrypted client-side. When the countdown hits zero, everything disintegrates into dust particles.
                </div>
              </div>
            )}

            {/* Modal Body: Security */}
            {activeModal === 'security' && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p><strong style={{ color: 'var(--text)' }}>AES-256-GCM Encryption:</strong> Every message is encrypted in your browser before transmission using keys derived via PBKDF2. Our servers only see ciphertext.</p>
                <p><strong style={{ color: 'var(--text)' }}>Forward Secrecy:</strong> Ephemeral session keys rotate every 5 minutes to prevent past messages from ever being decrypted.</p>
                <p><strong style={{ color: 'var(--text)' }}>Dead Man Switch:</strong> Rooms with 7 minutes of total inactivity auto-destroy silently.</p>
                <p><strong style={{ color: 'var(--text)' }}>Screenshot Guard & Clipboard Clear:</strong> Warning overlay on screenshot attempts and copied text is auto-cleared from clipboard after 10 seconds.</p>
                <p><strong style={{ color: 'var(--text)' }}>Access Lock:</strong> A frosted glass blur overlay conceals active chats if left idle for 60 seconds.</p>
              </div>
            )}

            {/* Modal Body: FAQ */}
            {activeModal === 'faq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx} style={{ background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        style={{
                          width: '100%', padding: '12px 14px', background: 'none', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: 'pointer', textAlign: 'left', gap: '10px'
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 600, color: isOpen ? 'var(--accent)' : 'var(--text)' }}>
                          {faq.q}
                        </span>
                        <ChevronDown size={15} color="var(--text-muted)" style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease', flexShrink: 0
                        }} />
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 14px 12px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Modal Body: Privacy */}
            {activeModal === 'privacy' && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p><strong style={{ color: 'var(--text)' }}>Zero Logs & Zero Tracking:</strong> We do not log IP addresses, personal data, or message metadata.</p>
                <p><strong style={{ color: 'var(--text)' }}>End-to-End Encryption:</strong> Encryption and decryption occur exclusively inside your browser. Encryption keys never leave your device.</p>
                <p><strong style={{ color: 'var(--text)' }}>Automatic Destruction:</strong> All rooms, messages, and temporary files dissolve automatically upon timer expiration or 24 hours of inactivity.</p>
                <p><strong style={{ color: 'var(--text)' }}>Zero Account Storage:</strong> Temporary user IDs auto-wipe every 24 hours. No persistent user profile exists.</p>
              </div>
            )}

            {/* Modal Body: Terms */}
            {activeModal === 'terms' && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p><strong style={{ color: 'var(--text)' }}>100% Free Forever:</strong> VanishChat is provided completely free of charge 24/7 for lawful, private communication.</p>
                <p><strong style={{ color: 'var(--text)' }}>Acceptable Use:</strong> Users are prohibited from utilizing VanishChat for illegal activities, harassment, or malicious distribution.</p>
                <p><strong style={{ color: 'var(--text)' }}>Mathematical No-Recovery Guarantee:</strong> Once a room or secret link is destroyed, data recovery is mathematically impossible.</p>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={() => setActiveModal(null)}
              style={{ marginTop: '18px', width: '100%', padding: '9px', fontSize: '13px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
