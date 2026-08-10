import { Shield, Lock, Timer, Ghost, ArrowRight, Zap, EyeOff, KeyRound } from 'lucide-react';
import { useUser } from '../context/UserContext';
import UserSetup from '../components/auth/UserSetup';
import Header from '../components/ui/Header';

const FEATURES = [
  {
    icon: Lock,
    title: 'AES-256 E2E Encryption',
    desc: 'Browser-native Web Crypto encryption. Messages & files are encrypted before touching the server.'
  },
  {
    icon: Timer,
    title: 'Ephemeral Self-Destruct',
    desc: 'Set custom timers from 1 min to 24 hours. Rooms auto-purge completely when time expires.'
  },
  {
    icon: Ghost,
    title: 'Thanos Snap Dissolution',
    desc: 'Cinematic particle disintegration animation when time runs out. Zero trace left behind.'
  },
  {
    icon: KeyRound,
    title: 'Zero Permanent Storage',
    desc: 'No passwords, no email registration. Anonymous user identities generated instantly.'
  }
];

export default function LandingPage() {
  const { isAuthenticated, userId } = useUser();

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflowX: 'hidden', position: 'relative' }}>

      {/* Ambient background glow */}
      <div style={{
        position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '350px', background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none', zIndex: 0, filter: 'blur(40px)', opacity: 0.8
      }} />

      <Header />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px 80px', maxWidth: '1080px', margin: '0 auto', width: '100%', zIndex: 1 }}>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '56px', maxWidth: '720px' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--surface-2)', border: '1px solid var(--accent-border)',
            borderRadius: '100px', padding: '6px 16px', marginBottom: '24px',
            boxShadow: '0 0 20px rgba(59,130,246,0.15)',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.02em' }}>
              Zero Trace Encrypted Messaging
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px'
          }}>
            Private chats that <br />
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              vanish forever.
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            End-to-end encrypted ephemeral messaging. When the timer hits zero, messages undergo a particle dissolution effect and vanish permanently.
          </p>

          {/* Authenticated quick navigation banner */}
          {isAuthenticated && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'var(--surface-2)', border: '1px solid var(--accent-border)', padding: '12px 20px', borderRadius: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text)' }}>
                Logged in as <strong style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>{userId}</strong>
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

        {/* Live Interactive Preview Card */}
        <div style={{
          width: '100%', maxWidth: '680px', marginBottom: '64px',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px',
          padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace', marginLeft: '6px' }}>room/v7x9k2</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '4px 10px', borderRadius: '100px' }}>
              <Timer size={12} color="var(--success)" />
              <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--success)', fontWeight: 700 }}>00:00:24</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ alignSelf: 'flex-start', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '14px 14px 14px 4px', maxWidth: '80%' }}>
              <p style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, marginBottom: '2px' }}>Alice</p>
              <p style={{ fontSize: '13px', color: 'var(--text)' }}>Is this chat end-to-end encrypted?</p>
            </div>

            <div style={{ alignSelf: 'flex-end', background: 'var(--accent)', padding: '10px 14px', borderRadius: '14px 14px 4px 14px', maxWidth: '80%' }}>
              <p style={{ fontSize: '13px', color: '#fff' }}>Yes! Key lives only in URL. Server receives zero plaintext 🔒</p>
            </div>

            <div style={{ alignSelf: 'flex-start', background: 'rgba(239,68,68,0.08)', border: '1px dashed rgba(239,68,68,0.3)', padding: '10px 14px', borderRadius: '14px 14px 14px 4px', maxWidth: '80%' }}>
              <p style={{ fontSize: '12px', color: 'var(--danger)', fontStyle: 'italic' }}>⚡ Room self-destructing in 24 seconds...</p>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px', width: '100%', maxWidth: '900px', marginBottom: '64px'
        }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '24px', transition: 'transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '10px',
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
              }}>
                <f.icon size={18} color="var(--accent)" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Identity Setup Form */}
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
