import { Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { userId, clearUser, isAuthenticated } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => { clearUser(); navigate('/'); };

  return (
    <header style={{
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <button
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'none', border: 'none' }}
        >
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text)', letterSpacing: '-0.01em' }}>
            VanishChat
          </span>
        </button>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAuthenticated && (
            <>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--accent)',
              }}>
                {userId}
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                style={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '8px', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <LogOut size={16} />
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
