import { useState } from 'react';
import { 
  ShieldCheck, Flame, LockKeyhole, ArrowRight, Sparkles, Shield, FileText, X, 
  HelpCircle, Clock, KeyRound, Link2, EyeOff, Check, ChevronDown, 
  Cpu, Zap, CheckCircle2
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
      a: "All text, images, and attachments are encrypted client-side in your browser using the native Web Crypto API (AES-256-GCM + PBKDF2). Servers only receive opaque ciphertext and random initialization vectors (IVs). Plaintext never touches our servers."
    },
    {
      q: "Are room messages and files permanently deleted?",
      a: "Yes. When a room timer expires or the room is closed, all messages, images, and files dissolve permanently from database memory using physics particle disintegration. Nothing is archived, backed up, or logged."
    },
    {
      q: "Do I need to sign up or provide an email or phone number?",
      a: "No. VanishChat requires zero accounts, zero emails, and zero phone numbers. Your temporary 6-character cryptographic ID is generated locally in your browser and automatically wipes after 24 hours."
    },
    {
      q: "Is VanishChat 100% free with no hidden paywalls?",
      a: "Yes. VanishChat is 100% completely free 24/7 for everyone with no subscription fees, no advertisements, and no payment method required."
    },
    {
      q: "How do one-time view Secret Links work?",
      a: "Secret links self-destruct immediately after being viewed once. The decryption key lives exclusively in the URL hash fragment (#key=), which web browsers never transmit to the server in HTTP requests."
    },
    {
      q: "What happens if I accidentally close or leave a room?",
      a: "If you accidentally close your browser tab or navigate away, a single-use 12-second Re-Entry Card automatically appears on your Dashboard so you can instantly resume without losing your session."
    }
  ];

  const chipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--surface-2)',
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
      color: 'var(--text)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>

      {/* Top Announcement Bar — DESKTOP ONLY */}
      <div className="desktop-only" style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        zIndex: 10
      }}>
        <span style={{
          background: 'var(--accent)',
          color: '#FFFFFF',
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.04em'
        }}>
          ZERO-ACCESS
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          Client-side AES-256-GCM encryption · Keys never leave your device
        </span>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          color: 'var(--success)',
          fontWeight: 600,
          background: 'var(--success-dim)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid rgba(0, 196, 140, 0.25)'
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
          100% Free
        </span>
      </div>

      <Header />

      {/* ========================================================================= */}
      {/* MOBILE-ONLY: SUPER MINIMAL & CLEAN HERO (Zero Cramp, Perfectly Spaced)     */}
      {/* ========================================================================= */}
      <main className="mobile-only" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(20px, 4vh, 36px) 16px',
        maxWidth: '440px',
        margin: '0 auto',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Pill Tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: '100px',
          padding: '4px 12px',
          marginBottom: '14px'
        }}>
          <Sparkles size={12} color="var(--accent)" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.01em' }}>
            AES-256-GCM · Zero Logs
          </span>
        </div>

        {/* Clean Headline */}
        <h1 style={{
          fontSize: 'clamp(28px, 7.5vw, 36px)',
          fontWeight: 800,
          color: 'var(--text)',
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          marginBottom: '8px'
        }}>
          Private by default.<br />
          <span style={{ color: 'var(--accent)' }}>Unbreakable</span> by design.
        </h1>

        <p style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          maxWidth: '320px',
          margin: '0 auto 18px',
          lineHeight: 1.45
        }}>
          Self-destructing rooms & secret links. Nothing stays.
        </p>

        {/* Quick Dashboard link if already authenticated */}
        {isAuthenticated && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            background: 'var(--surface-2)',
            border: '1px solid var(--accent-border)',
            padding: '5px 12px',
            borderRadius: '100px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text)' }}>
              Active as <strong style={{ color: 'var(--accent)' }}>{displayName || userId}</strong>
            </span>
            <button
              className="btn-primary"
              onClick={handleGoToDashboard}
              style={{ width: 'auto', padding: '4px 10px', fontSize: '11px' }}
            >
              Enter Dashboard →
            </button>
          </div>
        )}

        {/* Direct Single Identity Card (No double wrapping) */}
        <div style={{ width: '100%', marginBottom: '18px' }}>
          <UserSetup />
        </div>

        {/* Minimal Feature Chips for Mobile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          width: '100%'
        }}>
          <button 
            onClick={() => setActiveModal('security')} 
            style={chipStyle}
          >
            <LockKeyhole size={12} color="var(--accent)" />
            <span>E2E Encrypted</span>
          </button>

          <button 
            onClick={() => setActiveModal('how-it-works')} 
            style={chipStyle}
          >
            <Flame size={12} color="var(--danger)" />
            <span>Self-Destruct</span>
          </button>

          <button 
            onClick={() => setActiveModal('privacy')} 
            style={chipStyle}
          >
            <Clock size={12} color="var(--cyan)" />
            <span>24h Auto-Wipe</span>
          </button>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* DESKTOP-ONLY: FULL SWISS EDITORIAL HERO & METRICS                         */}
      {/* ========================================================================= */}
      <section className="desktop-only" style={{
        padding: 'clamp(48px, 6vh, 72px) 24px clamp(32px, 4vh, 48px)',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '56px',
          alignItems: 'center'
        }}>
          {/* Left Column: Editorial Headline & Value Prop */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
              padding: '5px 14px',
              marginBottom: '20px'
            }}>
              <ShieldCheck size={14} color="var(--accent)" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.01em' }}>
                Zero-Access Cryptographic Architecture
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(40px, 4.5vw, 56px)',
              fontWeight: 800,
              color: 'var(--text)',
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
              marginBottom: '20px'
            }}>
              Private by default.<br />
              <span style={{ color: 'var(--accent)' }}>Unbreakable</span> by design.
            </h1>

            <p style={{
              fontSize: '16px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: '520px',
              marginBottom: '32px'
            }}>
              The end-to-end encrypted ephemeral workspace. Host self-destructing rooms, dispatch burn-on-read secret links, and leave zero digital footprint.
            </p>

            {/* Quick Metrics Badges */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              maxWidth: '480px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border)'
            }}>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>256-Bit</p>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>AES-GCM Encryption</p>
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>0 Bytes</p>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>Server Logs Kept</p>
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>100% Free</p>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>No Card or Account</p>
              </div>
            </div>
          </div>

          {/* Right Column: Identity Vault Setup */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <UserSetup />

            {/* If Authenticated: Direct CTA */}
            {isAuthenticated && (
              <div style={{
                marginTop: '16px',
                width: '100%',
                maxWidth: '400px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Session Active</p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{displayName || userId}</p>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleGoToDashboard}
                  style={{ width: 'auto', padding: '7px 16px', fontSize: '12px' }}
                >
                  Enter Dashboard <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DESKTOP-ONLY: SECTION 2 - HOW ZERO-ACCESS CRYPTOGRAPHY WORKS               */}
      {/* ========================================================================= */}
      <section className="desktop-only" style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '64px 24px'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--surface-2)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border)',
            marginBottom: '14px'
          }}>
            <Cpu size={12} color="var(--accent)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Security Architecture
            </span>
          </div>

          <h2 style={{
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            marginBottom: '12px',
            color: 'var(--text)'
          }}>
            How Zero-Access Messaging Works
          </h2>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-muted)',
            maxWidth: '560px',
            margin: '0 auto 48px',
            lineHeight: 1.55
          }}>
            Your browser encrypts data before sending. No plaintext ever touches our infrastructure or transit pipelines.
          </p>

          {/* 3 Step Diagram Flow */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            textAlign: 'left'
          }}>
            {/* Step 1 */}
            <div style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 24px'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
                marginBottom: '16px'
              }}>
                <LockKeyhole size={18} color="var(--accent)" />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Stage 01
              </p>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Client-Side Encryption
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Messages and attachments are encrypted directly in your browser using the native Web Crypto API (AES-256-GCM + PBKDF2) before leaving your network.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 24px'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'rgba(0, 196, 140, 0.12)',
                border: '1px solid rgba(0, 196, 140, 0.25)',
                marginBottom: '16px'
              }}>
                <Zap size={18} color="var(--success)" />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Stage 02
              </p>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Zero-Knowledge Transit
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Our relay nodes and database only handle opaque ciphertext and random IVs. Decryption keys live in the URL hash (<code style={{ color: 'var(--text)' }}>#key=</code>), which browsers never send to servers.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 24px'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'rgba(255, 71, 71, 0.12)',
                border: '1px solid rgba(255, 71, 71, 0.25)',
                marginBottom: '16px'
              }}>
                <Flame size={18} color="var(--danger)" />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Stage 03
              </p>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Particle Disintegration
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                When countdown timers expire or a secret link is viewed, a physics-based particle shredder erases the message. Records are completely expunged with zero backups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DESKTOP-ONLY: SECTION 3 - PROTON BENTO GRID (Feature Highlights)          */}
      {/* ========================================================================= */}
      <section className="desktop-only" style={{
        padding: '64px 24px',
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--surface-2)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border)',
            marginBottom: '14px'
          }}>
            <Shield size={12} color="var(--accent)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Security Suite
            </span>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text)', marginBottom: '12px' }}>
            Built for High-Stakes Privacy
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto' }}>
            Every component is engineered around Swiss-inspired zero-trust principles.
          </p>
        </div>

        {/* Bento Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px'
        }}>
          {/* Bento 1: Secret Links */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: 36, height: 36, borderRadius: '8px',
                background: 'rgba(0, 196, 140, 0.12)', border: '1px solid rgba(0, 196, 140, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
              }}>
                <Link2 size={18} color="var(--success)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                One-Time Secret Links
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Transmit sensitive credentials or private notes. The link automatically dissolves from memory after a single view, with key in the URL hash.
              </p>
            </div>
            <div style={{
              marginTop: '20px',
              padding: '10px 14px',
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-dim)' }}>
                https://disappear-chat.vercel.app/secret/#key=...
              </span>
            </div>
          </div>

          {/* Bento 2: Thanos Disintegration */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: 36, height: 36, borderRadius: '8px',
                background: 'rgba(255, 71, 71, 0.12)', border: '1px solid rgba(255, 71, 71, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
              }}>
                <Flame size={18} color="var(--danger)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Thanos Particle Disintegration
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Experience physical pixel dispersion. When a message self-destructs, an authentic 32-canvas particle engine dissolves the text before permanent deletion.
              </p>
            </div>
            <div style={{
              marginTop: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--danger)'
            }}>
              <Flame size={13} /> Mathematical irreversible erasure
            </div>
          </div>

          {/* Bento 3: Forward Secrecy & Timers */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: 36, height: 36, borderRadius: '8px',
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
              }}>
                <Clock size={18} color="var(--accent)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Forward Secrecy & Timers
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Session keys rotate dynamically every 5 minutes. If a room stays silent for 7 minutes, the Dead Man Switch triggers automatic annihilation.
              </p>
            </div>
            <div style={{
              marginTop: '20px',
              display: 'flex',
              gap: '8px'
            }}>
              {['5m', '15m', '1h', '24h'].map(t => (
                <span key={t} style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text)'
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Bento 4: Anti-Surveillance */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: 36, height: 36, borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
              }}>
                <EyeOff size={18} color="var(--warning)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Anti-Surveillance Shield
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Multi-tab collision detection halts duplicate viewers. Screenshot attempts flash protective blackout deterrence, and copied text purges from clipboard in 10s.
              </p>
            </div>
            <div style={{
              marginTop: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-dim)'
            }}>
              <CheckCircle2 size={13} color="var(--success)" /> Browser sandbox protection
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DESKTOP-ONLY: SECTION 4 - COMPARISON MATRIX                                */}
      {/* ========================================================================= */}
      <section className="desktop-only" style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '64px 24px'
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text)', marginBottom: '10px' }}>
              Why VanishChat Stands Apart
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
              Compare our zero-access model against legacy messaging platforms.
            </p>
          </div>

          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Feature</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--accent)' }}>VanishChat</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Signal</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Telegram</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Client-Side AES-256-GCM', vc: true, sig: true, tg: false, wa: true },
                  { feature: 'No Phone / Email Required', vc: true, sig: false, tg: false, wa: false },
                  { feature: 'Particle Disintegration (Thanos Snap)', vc: true, sig: false, tg: false, wa: false },
                  { feature: 'Burn-on-Read Secret Links', vc: true, sig: false, tg: false, wa: false },
                  { feature: 'Zero IP or Metadata Logging', vc: true, sig: true, tg: false, wa: false },
                  { feature: '100% Free Without Account', vc: true, sig: false, tg: false, wa: false },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: i === 5 ? 'none' : '1px solid var(--border-light)' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 500, color: 'var(--text)' }}>{row.feature}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--success)', fontWeight: 700 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={16} strokeWidth={3} /> Yes
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: row.sig ? 'var(--text)' : 'var(--text-dim)' }}>
                      {row.sig ? 'Yes' : 'No'}
                    </td>
                    <td style={{ padding: '14px 20px', color: row.tg ? 'var(--text)' : 'var(--text-dim)' }}>
                      {row.tg ? 'Yes' : 'No'}
                    </td>
                    <td style={{ padding: '14px 20px', color: row.wa ? 'var(--text)' : 'var(--text-dim)' }}>
                      {row.wa ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DESKTOP-ONLY: SECTION 5 - ACCORDION FAQ                                   */}
      {/* ========================================================================= */}
      <section className="desktop-only" style={{
        padding: '64px 24px',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--surface-2)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border)',
            marginBottom: '14px'
          }}>
            <HelpCircle size={12} color="var(--accent)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Frequently Asked Questions
            </span>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text)' }}>
            Got Questions? We Have Answers.
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    gap: '14px'
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 600, color: isOpen ? 'var(--accent)' : 'var(--text)' }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={16}
                    color="var(--text-muted)"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0
                    }}
                  />
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 20px 16px',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '12px'
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DESKTOP-ONLY: SECTION 6 - PROTON MULTI-COLUMN FOOTER                      */}
      {/* ========================================================================= */}
      <footer className="desktop-only" style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '48px 24px 28px',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '36px',
          marginBottom: '40px'
        }}>
          {/* Col 1: Brand & Philosophy */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '8px',
                background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Shield size={16} color="#FFFFFF" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                VanishChat
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '280px' }}>
              The zero-access ephemeral workspace. Free, unmonitored communication protected by client-side Web Crypto AES-256-GCM.
            </p>
            <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
                All Cryptographic Systems Operational
              </span>
            </div>
          </div>

          {/* Col 2: Architecture */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              Architecture
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>AES-256-GCM Client Crypto</span>
              <span style={{ color: 'var(--text-muted)' }}>PBKDF2 Key Derivation</span>
              <span style={{ color: 'var(--text-muted)' }}>5-Minute Forward Secrecy</span>
              <span style={{ color: 'var(--text-muted)' }}>Dead Man Switch (7m Idle)</span>
              <span style={{ color: 'var(--text-muted)' }}>32-Canvas Particle Engine</span>
            </div>
          </div>

          {/* Col 3: Features */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              Capabilities
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Self-Destructing Rooms</span>
              <span style={{ color: 'var(--text-muted)' }}>One-Time Secret Links</span>
              <span style={{ color: 'var(--text-muted)' }}>Encrypted File Sharing</span>
              <span style={{ color: 'var(--text-muted)' }}>Multi-Tab Protection</span>
              <span style={{ color: 'var(--text-muted)' }}>12s Accidental Exit Recovery</span>
            </div>
          </div>

          {/* Col 4: Transparency & Modals */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              Transparency
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
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
                Security Architecture
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
                Terms of Service
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright hairline */}
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--text-dim)'
        }}>
          <span>© {new Date().getFullYear()} VanishChat. Zero logs. Zero accounts. 100% Free.</span>
          <span>End-to-End Encrypted via Web Crypto API</span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MOBILE-ONLY: SUPER MINIMAL 1-LINE FOOTER                                   */}
      {/* ========================================================================= */}
      <footer className="mobile-only" style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '16px 20px',
        marginTop: 'auto',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px' }}>
          © {new Date().getFullYear()} VanishChat · 100% Free 24/7 · Zero Logs
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveModal('how-it-works')} style={footerLinkStyle}>How It Works</button>
          <button onClick={() => setActiveModal('security')} style={footerLinkStyle}>Security</button>
          <button onClick={() => setActiveModal('privacy')} style={footerLinkStyle}>Privacy</button>
          <button onClick={() => setActiveModal('terms')} style={footerLinkStyle}>Terms</button>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* PROTON INFORMATION MODALS (Interactive across both mobile & desktop)       */}
      {/* ========================================================================= */}
      {activeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px'
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
            maxWidth: '520px', width: '100%', padding: 'clamp(20px, 4.5vw, 28px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            maxHeight: '85vh', overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {activeModal === 'how-it-works' && <Flame size={18} color="var(--danger)" />}
                {activeModal === 'security' && <LockKeyhole size={18} color="var(--accent)" />}
                {activeModal === 'privacy' && <ShieldCheck size={18} color="var(--success)" />}
                {activeModal === 'terms' && <FileText size={18} color="var(--accent)" />}
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  {activeModal === 'how-it-works' && 'How VanishChat Works'}
                  {activeModal === 'security' && 'Security Architecture'}
                  {activeModal === 'privacy' && 'Privacy Guarantee'}
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
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'var(--surface-2)', padding: '12px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '2px' }}>01. Instant Anonymous Identity</strong>
                  Select a display name. Your browser derives a temporary 24-hour cryptographic key without email or password.
                </div>
                <div style={{ background: 'var(--surface-2)', padding: '12px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <strong style={{ color: 'var(--success)', display: 'block', marginBottom: '2px' }}>02. Ephemeral Room or Secret Link</strong>
                  Create a room with an automatic self-destruct countdown timer. Invite contacts via room code or secure QR code.
                </div>
                <div style={{ background: 'var(--surface-2)', padding: '12px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <strong style={{ color: 'var(--danger)', display: 'block', marginBottom: '2px' }}>03. Permanent Disintegration</strong>
                  All content is client-side encrypted. When countdown reaches zero, all messages dissolve into dust particles and vanish from storage.
                </div>
              </div>
            )}

            {/* Modal Body: Security */}
            {activeModal === 'security' && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p><strong style={{ color: 'var(--text)' }}>AES-256-GCM Encryption:</strong> Web Crypto API executes directly in your browser. Our servers only see opaque ciphertext and initialization vectors.</p>
                <p><strong style={{ color: 'var(--text)' }}>Forward Secrecy:</strong> Ephemeral session keys rotate every 5 minutes to prevent retrospective decryption.</p>
                <p><strong style={{ color: 'var(--text)' }}>Dead Man Switch:</strong> Rooms with 7 minutes of total inactivity auto-destroy silently.</p>
                <p><strong style={{ color: 'var(--text)' }}>Screenshot Guard & Clipboard Clear:</strong> Protective deterrence on screenshot triggers and copied data automatically purges from clipboard after 10 seconds.</p>
              </div>
            )}

            {/* Modal Body: Privacy */}
            {activeModal === 'privacy' && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p><strong style={{ color: 'var(--text)' }}>Zero Logs & Zero Tracking:</strong> We never log IP addresses, browser fingerprints, or metadata.</p>
                <p><strong style={{ color: 'var(--text)' }}>Zero Account Storage:</strong> Temporary user IDs auto-wipe every 24 hours. No persistent user profile is retained.</p>
                <p><strong style={{ color: 'var(--text)' }}>Mathematical Erasure:</strong> When a room or secret link expires, recovery is mathematically impossible.</p>
              </div>
            )}

            {/* Modal Body: Terms */}
            {activeModal === 'terms' && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p><strong style={{ color: 'var(--text)' }}>100% Free Forever:</strong> VanishChat is free 24/7 for lawful, private communication without subscriptions.</p>
                <p><strong style={{ color: 'var(--text)' }}>Acceptable Use:</strong> Users agree not to misuse VanishChat for illegal activity or unauthorized distribution.</p>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={() => setActiveModal(null)}
              style={{ marginTop: '18px', width: '100%', padding: '10px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
