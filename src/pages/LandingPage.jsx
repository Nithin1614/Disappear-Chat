import { Shield, Lock, Ghost, ArrowRight, Sparkles, Zap, ShieldCheck, Flame, Eye, LockKeyhole } from 'lucide-react';
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
      overflowX: 'hidden', position: 'relative'
    }}>

      {/* Ambient background glow */}
      <div style={{
        position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
        width: '800px', height: '450px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(6,182,212,0.08) 50%, rgba(0,0,0,0) 75%)',
        pointerEvents: 'none', zIndex: 0, filter: 'blur(60px)', opacity: 0.9
      }} />

      <Header />

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '48px 24px 80px', maxWidth: '1080px', margin: '0 auto', width: '100%', zIndex: 1
      }}>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '56px', maxWidth: '760px' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--surface-2)', border: '1px solid var(--accent-border)',
            borderRadius: '100px', padding: '6px 18px', marginBottom: '24px',
            boxShadow: '0 0 24px rgba(139,92,246,0.25)',
          }}>
            <Sparkles size={14} color="var(--accent)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.02em' }}>
              Zero Trace · Web Crypto E2E Encrypted · 24h Auto Clean
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(40px, 6.5vw, 68px)', fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.035em', lineHeight: 1.08, marginBottom: '22px'
          }}>
            Encrypted Messaging <br />
            <span style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 40%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(139,92,246,0.3))'
            }}>
              That Vanishes Forever.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2.2vw, 18px)', color: 'var(--text-muted)',
            maxWidth: '580px', margin: '0 auto 32px', lineHeight: 1.6
          }}>
            Private rooms with countdown timers, one-time burn messages, and self-destruct links. When time runs out, data disintegrates across all devices.
          </p>

          {/* Quick Dashboard link if authenticated */}
          {isAuthenticated && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '14px',
              background: 'var(--surface-2)', border: '1px solid var(--accent-border)',
              padding: '12px 24px', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
            }}>
              <span style={{ fontSize: '14px', color: 'var(--text)' }}>
                Welcome back, <strong style={{ color: 'var(--accent)' }}>{displayName || userId}</strong>
              </span>
              <button
                className="btn-primary"
                onClick={handleGoToDashboard}
                style={{ width: 'auto', padding: '8px 18px', fontSize: '13px' }}
              >
                Open Dashboard <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          width: '100%', maxWidth: '940px', marginBottom: '64px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px'
        }}>

          {/* Step 1 */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px 24px',
            boxShadow: '0 16px 32px rgba(0,0,0,0.4)', transition: 'border-color 0.2s, transform 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 46, height: 46, borderRadius: '12px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <LockKeyhole size={22} color="var(--accent)" />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Security</span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '6px 0 8px' }}>AES-256-GCM E2E</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              Messages and files are encrypted client-side in your browser using Web Crypto API. Server never sees plaintext.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--accent-border)', borderRadius: '20px', padding: '28px 24px',
            boxShadow: '0 20px 40px rgba(139,92,246,0.15)', transition: 'transform 0.2s',
            transform: 'translateY(-4px)'
          }}>
            <div style={{ width: 46, height: 46, borderRadius: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Flame size={22} color="var(--danger)" />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ephemerality</span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '6px 0 8px' }}>Burn & Disintegrate</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              One-time burn messages, self-destruct secret links, and room timer snaps disintegrate data into particles.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px 24px',
            boxShadow: '0 16px 32px rgba(0,0,0,0.4)', transition: 'border-color 0.2s, transform 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 46, height: 46, borderRadius: '12px', background: 'var(--cyan-dim)', border: '1px solid rgba(6,182,212,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <ShieldCheck size={22} color="var(--cyan)" />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Privacy</span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '6px 0 8px' }}>24h Identity Auto-Clean</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              All temporary user identities and room traces are wiped every 24 hours. Zero tracking, zero logs.
            </p>
          </div>

        </div>

        {/* Identity Setup Form (Create Identity & Login with ID at bottom) */}
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <UserSetup />
        </div>

      </main>
    </div>
  );
}
