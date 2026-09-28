import { Shield, LogOut, Lock } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { userId, displayName, clearUser, isAuthenticated } = useUser();

  const handleLogout = () => {
    clearUser();
    window.location.href = '/';
  };

  const handleLogoClick = () => {
    window.location.href = isAuthenticated ? '/dashboard' : '/';
  };

  return (
    <header style={{
      background: 'rgba(19, 19, 26, 0.82)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      transition: 'background 0.2s ease',
    }}>
      <div style={{
        maxWidth: '1060px',
        margin: '0 auto',
        padding: '0 20px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Brand / Logo */}
        <button
          onClick={handleLogoClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
            outline: 'none'
          }}
        >
          {/* Proton-style Ribbon Shield Glyph */}
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(109, 74, 255, 0.35)',
            flexShrink: 0
          }}>
            <Shield size={17} color="#FFFFFF" strokeWidth={2.3} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontWeight: 800,
              fontSize: '17px',
              color: 'var(--text)',
              letterSpacing: '-0.025em'
            }}>
              VanishChat
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '2px 7px',
              borderRadius: '9999px',
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)'
            }}>
              E2EE
            </span>
          </div>
        </button>

        {/* Center / Security Indicator (Desktop) */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '9999px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }} className="sm:flex">
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--success)',
            display: 'inline-block',
            boxShadow: '0 0 6px var(--success)'
          }} />
          <span style={{ fontWeight: 500 }}>Zero-Access Relay</span>
          <span style={{ color: 'var(--text-dim)' }}>·</span>
          <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>AES-256</span>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                padding: '4px 12px 4px 6px',
                borderRadius: '9999px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {(displayName || userId || 'U')[0].toUpperCase()}
                </div>
                <span>{displayName || userId}</span>
              </div>

              <button
                onClick={handleLogout}
                title="Sign out of temporary identity"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '7px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(255, 71, 71, 0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div
              className="desktop-flex"
              style={{
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)'
              }}
            >
              <Lock size={11} color="var(--success)" />
              <span>100% Free · 24/7</span>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
