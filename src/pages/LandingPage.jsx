import { Shield, Lock, Timer, Ghost, ArrowRight, KeyRound, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { useUser } from '../context/UserContext';
import UserSetup from '../components/auth/UserSetup';
import Header from '../components/ui/Header';

export default function LandingPage() {
  const { isAuthenticated, userId, displayName } = useUser();

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflowX: 'hidden', position: 'relative' }}>

      {/* Ambient background glow */}
      <div style={{
        position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none', zIndex: 0, filter: 'blur(50px)', opacity: 0.85
      }} />

      <Header />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 80px', maxWidth: '1080px', margin: '0 auto', width: '100%', zIndex: 1 }}>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '720px' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--surface-2)', border: '1px solid var(--accent-border)',
            borderRadius: '100px', padding: '6px 18px', marginBottom: '20px',
            boxShadow: '0 0 24px rgba(59,130,246,0.18)',
          }}>
            <Sparkles size={14} color="var(--accent)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.02em' }}>
              Zero Trace · Web Crypto E2E Encrypted
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(38px, 6vw, 64px)', fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px'
          }}>
            Encrypted Messaging <br />
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              That Vanishes on Expiry.
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Set a timer from 1 minute to 24 hours. When time expires, all messages & shared files disintegrate permanently across all devices.
          </p>

          {/* Quick Dashboard link if already authenticated */}
          {isAuthenticated && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'var(--surface-2)', border: '1px solid var(--accent-border)', padding: '12px 20px', borderRadius: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text)' }}>
                Welcome back, <strong style={{ color: 'var(--accent)' }}>{displayName || userId}</strong>
              </span>
              <button
                className="btn-primary"
                onClick={handleGoToDashboard}
                style={{ width: 'auto', padding: '8px 16px', fontSize: '13px' }}
              >
                Go to Dashboard <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* 3D Visual How-It-Works Showcase */}
        <div style={{
          width: '100%', maxWidth: '840px', marginBottom: '64px', perspective: '1000px',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px',
            transformStyle: 'preserve-3d', transition: 'transform 0.5s ease',
          }}>

            {/* Step 1 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px',
              boxShadow: '0 15px 30px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Zap size={20} color="var(--accent)" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Step 01</span>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: '4px 0 8px' }}>Create Ephemeral Room</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Generate a 6-character room code instantly. No password or email needed.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--accent-border)', borderRadius: '18px', padding: '24px',
              boxShadow: '0 20px 40px rgba(59,130,246,0.15)', position: 'relative', overflow: 'hidden',
              transform: 'translateZ(15px)'
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <ShieldCheck size={20} color="var(--success)" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Step 02</span>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: '4px 0 8px' }}>Web Crypto AES-256 E2E</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Messages & file attachments are encrypted client-side in your browser before transmission.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px',
              boxShadow: '0 15px 30px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Ghost size={20} color="var(--danger)" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Step 03</span>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: '4px 0 8px' }}>Particle Disintegration</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                When the timer expires, a Thanos snap particle animation dissolves all room data permanently.
              </p>
            </div>

          </div>
        </div>

        {/* Identity Setup Form (Create Identity & Login with ID at bottom) */}
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <UserSetup />
        </div>

      </main>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
