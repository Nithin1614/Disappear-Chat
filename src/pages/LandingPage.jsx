import { useState } from 'react';
import { 
  ShieldCheck, Flame, LockKeyhole, ArrowRight, Sparkles, Shield, FileText, Info, X, ChevronDown,
  UserPlus, Link2, KeyRound, EyeOff, Clock, Copy, Maximize2, Briefcase, Key, Image, Users
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import UserSetup from '../components/auth/UserSetup';
import Header from '../components/ui/Header';

export default function LandingPage() {
  const { isAuthenticated, userId, displayName } = useUser();
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | 'about' | null
  const [openFaq, setOpenFaq] = useState(null);

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const scrollToSetup = () => {
    const el = document.getElementById('user-setup-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else window.location.href = '/dashboard';
  };

  const faqs = [
    {
      q: "How does end-to-end encryption work on VanishChat?",
      a: "All messages, text, and files are encrypted client-side in your browser using the Web Crypto API (AES-256-GCM + PBKDF2). Servers only receive encrypted ciphertext and random IVs. Plaintext never touches our servers."
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

        {/* Hero Section Header (EXACT SAME UI - UNTOUCHED) */}
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

        {/* Primary Call to Action: Identity Setup Box (EXACT SAME UI - UNTOUCHED) */}
        <div id="user-setup-section" style={{ width: '100%', maxWidth: '420px', marginBottom: '64px' }}>
          <UserSetup />
        </div>

        {/* SECTION 1: HOW IT WORKS (Three Steps, Three Minutes - Image 1 Reference) */}
        <div style={{ width: '100%', maxWidth: '920px', marginBottom: '72px', textAlign: 'center' }}>
          <div style={{
            fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase',
            letterSpacing: '0.15em', marginBottom: '12px'
          }}>
            HOW IT WORKS
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.03em', marginBottom: '40px'
          }}>
            Three steps. Zero history.
          </h2>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px', position: 'relative'
          }}>

            {/* Step 1 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px',
              padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: '0 12px 30px rgba(0,0,0,0.35)', position: 'relative'
            }}>
              <div style={{
                position: 'absolute', top: '16px', right: '16px', width: '28px', height: '28px',
                borderRadius: '50%', background: '#10b981', color: '#000', fontSize: '12px',
                fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                01
              </div>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <UserPlus size={24} color="#10b981" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Create Identity</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Enter your username to generate a 24-hour anonymous key. Zero signup or email required.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px',
              padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: '0 12px 30px rgba(0,0,0,0.35)', position: 'relative'
            }}>
              <div style={{
                position: 'absolute', top: '16px', right: '16px', width: '28px', height: '28px',
                borderRadius: '50%', background: '#10b981', color: '#000', fontSize: '12px',
                fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                02
              </div>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(139,92,246,0.12)',
                border: '1px solid rgba(139,92,246,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Link2 size={24} color="#a855f7" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Share Secret Room</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Invite your chat partner via QR code or zero-knowledge secret link.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px',
              padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: '0 12px 30px rgba(0,0,0,0.35)', position: 'relative'
            }}>
              <div style={{
                position: 'absolute', top: '16px', right: '16px', width: '28px', height: '28px',
                borderRadius: '50%', background: '#10b981', color: '#000', fontSize: '12px',
                fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                03
              </div>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Flame size={24} color="var(--danger)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Auto-Disintegrate</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Every message and file is encrypted client-side and vanishes into particles on expiry.
              </p>
            </div>

          </div>
        </div>

        {/* SECTION 2: FEATURES (Everything you need. Nothing you don't - Image 3 Reference) */}
        <div style={{ width: '100%', maxWidth: '920px', marginBottom: '72px', textAlign: 'center' }}>
          <div style={{
            fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase',
            letterSpacing: '0.15em', marginBottom: '12px'
          }}>
            FEATURES
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.03em', marginBottom: '40px'
          }}>
            Everything you need. Nothing you don't.
          </h2>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '20px', textAlign: 'left'
          }}>
            {/* Feature 1 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.3)'
            }}>
              <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <KeyRound size={20} color="#10b981" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>AES-256-GCM Encryption</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Client-side PBKDF2 room key derivation via Web Crypto API. No plaintext touches the server.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.3)'
            }}>
              <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <ShieldCheck size={20} color="#a855f7" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Forward Secrecy</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Per-session ephemeral key rotation every 5 minutes prevents decryption of past messages.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.3)'
            }}>
              <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Clock size={20} color="var(--danger)" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Dead Man Switch</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                7-minute total room inactivity detector auto-destroys inactive rooms silently.
              </p>
            </div>

            {/* Feature 4 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.3)'
            }}>
              <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <EyeOff size={20} color="var(--cyan)" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Screenshot Guard</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Visual warning overlay alerts users on screenshot attempts inside active chat rooms.
              </p>
            </div>

            {/* Feature 5 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.3)'
            }}>
              <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Copy size={20} color="#eab308" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Clipboard Auto-Clear</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Automatically wipes copied chat text from device clipboard after 10 seconds.
              </p>
            </div>

            {/* Feature 6 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.3)'
            }}>
              <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Maximize2 size={20} color="var(--accent)" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Access Lock Overlay</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Frosted glass blur lock screen hides active chat contents after 60s of inactivity.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: USE CASES (Built for every team - Image 2 Reference) */}
        <div style={{ width: '100%', maxWidth: '920px', marginBottom: '72px', textAlign: 'center' }}>
          <div style={{
            fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase',
            letterSpacing: '0.15em', marginBottom: '12px'
          }}>
            USE CASES
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.03em', marginBottom: '12px'
          }}>
            Built for total privacy
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto 40px', lineHeight: 1.5 }}>
            Whether you're sharing sensitive keys or having quick off-the-record chats.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px', textAlign: 'left'
          }}>
            {/* Card 1 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.3)'
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Briefcase size={18} color="#10b981" />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Confidential Business</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Off-the-record team discussions, credential sharing, and private negotiations.
              </p>
            </div>

            {/* Card 2 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.3)'
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Key size={18} color="#a855f7" />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Personal Secret Links</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Self-destructing one-time secret links for passwords, links, and private notes.
              </p>
            </div>

            {/* Card 3 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.3)'
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Image size={18} color="var(--cyan)" />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Ephemeral Media</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Send encrypted images and documents that dissolve after reading.
              </p>
            </div>

            {/* Card 4 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.3)'
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Users size={18} color="#eab308" />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Temporary Collaborations</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Freelancers and project teams needing quick zero-paper-trail communication.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 4: CALLOUT BANNER (The private messaging your chats deserve - Image 5 Reference) */}
        <div style={{
          width: '100%', maxWidth: '840px', marginBottom: '80px', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(139,92,246,0.15) 100%)',
          border: '2px solid rgba(16,185,129,0.45)', borderRadius: '24px', padding: '48px 32px',
          boxShadow: '0 16px 40px rgba(16,185,129,0.2)', position: 'relative', overflow: 'hidden'
        }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px'
          }}>
            The private messaging your <br />
            <span style={{
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #a855f7 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              conversations deserve.
            </span>
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 28px', lineHeight: 1.5 }}>
            100% Completely Free — 24/7 Available for Everyone. No credit card, no sign-up, no restrictions.
          </p>

          <button
            className="btn-primary"
            onClick={scrollToSetup}
            style={{
              padding: '14px 32px', fontSize: '15px', borderRadius: '100px',
              background: '#10b981', color: '#000', fontWeight: 800, border: 'none',
              boxShadow: '0 6px 20px rgba(16,185,129,0.4)', transition: 'transform 0.15s', cursor: 'pointer'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Start Chatting — Free <ArrowRight size={16} />
          </button>
        </div>

        {/* SECTION 5: FREQUENTLY ASKED QUESTIONS (Accordion - Image 4 Reference) */}
        <div style={{ width: '100%', maxWidth: '780px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase',
            letterSpacing: '0.15em', textAlign: 'center', marginBottom: '8px'
          }}>
            FAQ
          </div>
          <h2 style={{
            fontSize: '28px', fontWeight: 800, color: 'var(--text)',
            textAlign: 'center', marginBottom: '8px', letterSpacing: '-0.02em'
          }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '32px' }}>
            Everything you need to know about VanishChat.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%', padding: '20px 8px', background: 'none', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', textAlign: 'left', gap: '16px'
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 600, color: isOpen ? 'var(--accent)' : 'var(--text)', transition: 'color 0.2s' }}>
                      {faq.q}
                    </span>
                    <ChevronDown size={18} color="var(--text-muted)" style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease', flexShrink: 0
                    }} />
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 8px 20px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* Multi-Column Sleek Footer (Exact Reference Match to Image 2 Footer) */}
      <footer style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '60px 24px 32px',
        width: '100%',
        zIndex: 1,
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '1040px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '36px',
          paddingBottom: '40px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          {/* Column 1: Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Shield size={18} color="var(--accent)" />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                VanishChat
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Zero-knowledge encrypted private messaging. No logs, no history, 100% self-destructing.
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Product</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <button onClick={() => setActiveModal('about')} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '14px', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}>About VanishChat</button>
              </li>
              <li>
                <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '14px', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}>Go to Dashboard</button>
              </li>
              <li>
                <button onClick={() => setActiveModal('about')} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '14px', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}>End-to-End Encryption</button>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <button onClick={() => setActiveModal('privacy')} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '14px', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}>Privacy Policy</button>
              </li>
              <li>
                <button onClick={() => setActiveModal('terms')} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '14px', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}>Terms of Service</button>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & Security */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Support</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              100% Free 24/7 Available for everyone. No credit card, no sign-up.
            </p>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div style={{ maxWidth: '1040px', margin: '24px auto 0', textAlign: 'center', fontSize: '12px', color: 'var(--text-dim)' }}>
          © 2026 VanishChat. All rights reserved.
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
