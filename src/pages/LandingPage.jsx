import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Timer, Ghost } from 'lucide-react';
import { useUser } from '../context/UserContext';
import UserSetup from '../components/auth/UserSetup';
import Header from '../components/ui/Header';

const FEATURES = [
  { icon: Lock,   title: 'End-to-End Encrypted', desc: 'Messages encrypted in your browser. Server never sees plaintext.' },
  { icon: Timer,  title: 'Self-Destructing',      desc: 'Set a timer from 5 min to 24 hours. Room auto-deletes when time runs out.' },
  { icon: Ghost,  title: 'No Trace Left',         desc: 'Thanos-snap dissolution animation. Everything vanishes permanently.' },
];

export default function LandingPage() {
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  useEffect(() => { if (isAuthenticated) navigate('/dashboard'); }, [isAuthenticated, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', maxWidth: '960px', margin: '0 auto', width: '100%' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: '100px', padding: '6px 14px', marginBottom: '24px' }}>
            <Shield size={13} color="var(--accent)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>AES-256-GCM Encrypted</span>
          </div>

          <h1 style={{ fontSize: '56px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px' }}>
            Secure chats that<br />
            <span style={{ color: 'var(--accent)' }}>disappear.</span>
          </h1>

          <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.6 }}>
            End-to-end encrypted messaging. Set a timer. When it runs out — everything vanishes.
          </p>
        </div>

        {/* Features row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', width: '100%', maxWidth: '800px', marginBottom: '64px' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <f.icon size={16} color="var(--accent)" />
              </div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{f.title}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Auth form */}
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <UserSetup />
        </div>
      </main>
    </div>
  );
}
