import { ShieldCheck, Flame, LockKeyhole, ArrowRight, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import UserSetup from '../components/auth/UserSetup';
import Header from '../components/ui/Header';

export default function LandingPage() {
  const { isAuthenticated, userId, displayName } = useUser();

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

        {/* Primary Call to Action: Identity Setup Box (Rendered immediately for fast onboarding!) */}
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
    </div>
  );
}
