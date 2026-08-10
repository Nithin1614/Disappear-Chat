import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, User, Plus, LogIn, Search } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/ui/Header';
import CreateRoom from '../components/room/CreateRoom';
import JoinRoom from '../components/room/JoinRoom';
import UserSearch from '../components/auth/UserSearch';

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
  const navigate = useNavigate();

  useEffect(() => { if (!isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);
  if (!isAuthenticated) return null;

  const copyUserId = async () => {
    await navigator.clipboard.writeText(userId);
    addToast('User ID copied!', 'success');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* User Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={22} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.05em' }}>{userId}</span>
              <button onClick={copyUserId} title="Copy ID" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex', padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-muted)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
                <Copy size={15} />
              </button>
            </div>
            {displayName
              ? <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{displayName}</p>
              : <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>No display name set</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Online</span>
          </div>
        </div>

        {/* Room actions grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <Section title="Create a Room" icon={Plus}>
            <CreateRoom />
          </Section>
          <Section title="Join a Room" icon={LogIn}>
            <JoinRoom />
          </Section>
        </div>

        {/* Find users */}
        <Section title="Find Users" icon={Search}>
          <div style={{ maxWidth: '420px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Search by user ID to find someone's account.
            </p>
            <UserSearch />
          </div>
        </Section>

      </main>
    </div>
  );
}
