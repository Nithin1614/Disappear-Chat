import { useState, useEffect, useRef } from 'react';
import { Copy, User, Plus, LogIn, Search, Flame, MessageSquare, X } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import Header from '../components/ui/Header';
import CreateRoom from '../components/room/CreateRoom';
import JoinRoom from '../components/room/JoinRoom';
import UserSearch from '../components/auth/UserSearch';
import CreateSecretLink from '../components/auth/CreateSecretLink';

const Section = ({ title, icon: Icon, children }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: 30, height: 30, borderRadius: '8px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} color="var(--accent)" />
      </div>
      <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{title}</h2>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
);

export default function Dashboard() {
  const { userId, displayName, isAuthenticated } = useUser();
  const { addToast } = useToast();
  const [rejoinRoomCode, setRejoinRoomCode] = useState(null);
  const [reentryProgress, setReentryProgress] = useState(100); // 100% down to 0% over 12s
  const [reentrySeconds, setReentrySeconds] = useState(12);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) window.location.href = '/';
  }, [isAuthenticated]);

  const consumeReentry = (code) => {
    sessionStorage.removeItem('vanishchat_last_active_room');
    if (code && userId) {
      sessionStorage.setItem(`vanishchat_reentry_consumed_${userId}_${code}`, 'true');
    }
    setRejoinRoomCode(null);
  };

  // Check if user accidentally exited an active chat room (with instant mobile pageshow/focus/visibility listeners)
  useEffect(() => {
    if (!userId) return;

    const checkRejoin = async () => {
      const lastRoom = sessionStorage.getItem('vanishchat_last_active_room');
      if (!lastRoom) return;

      const consumedKey = `vanishchat_reentry_consumed_${userId}_${lastRoom}`;
      const isConsumed = sessionStorage.getItem(consumedKey) === 'true';
      if (isConsumed) return;

      const { data, error } = await supabase
        .from('rooms')
        .select('room_code, is_active, expires_at')
        .eq('room_code', lastRoom)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        sessionStorage.removeItem('vanishchat_last_active_room');
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        sessionStorage.removeItem('vanishchat_last_active_room');
        return;
      }

      setRejoinRoomCode(data.room_code);
    };

    checkRejoin();

    // Instant triggers for mobile browser back gestures, bfcache restoration, and tab visibility
    const handleMobileReturn = () => checkRejoin();
    window.addEventListener('pageshow', handleMobileReturn);
    window.addEventListener('focus', handleMobileReturn);
    document.addEventListener('visibilitychange', handleMobileReturn);

    return () => {
      window.removeEventListener('pageshow', handleMobileReturn);
      window.removeEventListener('focus', handleMobileReturn);
      document.removeEventListener('visibilitychange', handleMobileReturn);
    };
  }, [userId]);

  // 12-second expiration timer with progress bar
  useEffect(() => {
    if (!rejoinRoomCode) return;

    const startTime = Date.now();
    const DURATION_MS = 12000; // 12 seconds

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, DURATION_MS - elapsed);
      const progress = (remaining / DURATION_MS) * 100;
      const secs = Math.ceil(remaining / 1000);

      setReentryProgress(progress);
      setReentrySeconds(secs);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        consumeReentry(rejoinRoomCode);
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [rejoinRoomCode, userId]);

  if (!isAuthenticated) return null;

  const copyUserId = async () => {
    await navigator.clipboard.writeText(userId);
    addToast('User ID copied!', 'success');
  };

  const handleRejoin = () => {
    const code = rejoinRoomCode;
    consumeReentry(code);
    window.location.href = `/room/${code}`;
  };

  const dismissRejoin = () => {
    consumeReentry(rejoinRoomCode);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Accidental Exit Re-Entry Card (12s Expiration + Progress Bar) */}
        {rejoinRoomCode && (
          <div style={{
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 'var(--radius)',
                  background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <MessageSquare size={18} color="#fff" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                    Accidentally exited chat? Re-enter active session in Room <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>{rejoinRoomCode}</span>
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    One-time re-entry prompt · Self-destructs in <strong style={{ color: 'var(--accent)' }}>{reentrySeconds}s</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={handleRejoin}
                  className="btn-primary"
                  style={{ width: 'auto', padding: '8px 18px', fontSize: '13px' }}
                >
                  Enter Chat Again
                </button>
                <button
                  onClick={dismissRejoin}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '6px', display: 'flex' }}
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Smooth 12-Second Progress Bar */}
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${reentryProgress}%`,
                background: 'var(--accent)',
                borderRadius: '2px',
                transition: 'width 0.1s linear',
              }} />
            </div>
          </div>
        )}

        {/* Proton Identity Vault Header Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius)',
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '18px', color: 'var(--accent)', flexShrink: 0
            }}>
              {(displayName || userId || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                  {displayName || userId}
                </span>
                <span className="proton-badge">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                  Zero-Access Active
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                  ID: {userId}
                </span>
                <button
                  onClick={copyUserId}
                  title="Copy ID"
                  style={{
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '2px 8px', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 500
                  }}
                >
                  <Copy size={11} /> Copy ID
                </button>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>· Expires in 24h</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: 'var(--radius-pill)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              fontSize: '12px', color: 'var(--text-muted)'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
              Live Relay Connected
            </span>
          </div>
        </div>

        {/* Room actions grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <Section title="Create Ephemeral Room" icon={Plus}><CreateRoom /></Section>
          <Section title="Join by Room Code" icon={LogIn}><JoinRoom /></Section>
        </div>

        {/* Find users */}
        <Section title="Direct Contact Directory" icon={Search}>
          <UserSearch />
        </Section>

        {/* Self-destruct link */}
        <Section title="One-Time Self-Destruct Secret Link" icon={Flame}>
          <CreateSecretLink />
        </Section>

      </main>
    </div>
  );
}
