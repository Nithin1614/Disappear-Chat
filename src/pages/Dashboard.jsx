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

  // Check if user accidentally exited an active chat room
  useEffect(() => {
    const isConsumed = sessionStorage.getItem('vanishchat_reentry_consumed') === 'true';
    if (isConsumed) return;

    const lastRoom = sessionStorage.getItem('vanishchat_last_active_room');
    if (!lastRoom) return;

    async function checkRejoin() {
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
    }

    checkRejoin();
  }, []);

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
        sessionStorage.removeItem('vanishchat_last_active_room');
        sessionStorage.setItem('vanishchat_reentry_consumed', 'true');
        setRejoinRoomCode(null);
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [rejoinRoomCode]);

  if (!isAuthenticated) return null;

  const copyUserId = async () => {
    await navigator.clipboard.writeText(userId);
    addToast('User ID copied!', 'success');
  };

  const handleRejoin = () => {
    const code = rejoinRoomCode;
    sessionStorage.removeItem('vanishchat_last_active_room');
    sessionStorage.setItem('vanishchat_reentry_consumed', 'true');
    setRejoinRoomCode(null);
    window.location.href = `/room/${code}`;
  };

  const dismissRejoin = () => {
    sessionStorage.removeItem('vanishchat_last_active_room');
    sessionStorage.setItem('vanishchat_reentry_consumed', 'true');
    setRejoinRoomCode(null);
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
            borderRadius: '16px',
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
                  width: 40, height: 40, borderRadius: '10px',
                  background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <MessageSquare size={20} color="#fff" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                    Accidentally exited your chat? Re-enter active session in Room <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>{rejoinRoomCode}</span>
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    One-time re-entry prompt · Expires in <strong style={{ color: 'var(--accent)' }}>{reentrySeconds}s</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={handleRejoin}
                  className="btn-primary"
                  style={{ width: 'auto', padding: '9px 18px', fontSize: '13px', fontWeight: 700 }}
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
              background: 'rgba(255,255,255,0.1)',
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

        {/* User Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={22} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{displayName || userId}</span>
              <button onClick={copyUserId} title="Copy ID"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex', padding: 0 }}>
                <Copy size={15} />
              </button>
            </div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              ID: {userId} · Identity expires in 24h
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Online</span>
          </div>
        </div>

        {/* Room actions grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <Section title="Create a Room" icon={Plus}><CreateRoom /></Section>
          <Section title="Join a Room" icon={LogIn}><JoinRoom /></Section>
        </div>

        {/* Find users */}
        <Section title="Find Users & Direct Chat" icon={Search}>
          <UserSearch />
        </Section>

        {/* Self-destruct link */}
        <Section title="Self-Destruct Secret Link" icon={Flame}>
          <CreateSecretLink />
        </Section>

      </main>
    </div>
  );
}
