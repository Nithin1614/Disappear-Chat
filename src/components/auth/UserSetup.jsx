import { useState } from 'react';
import { RefreshCw, ArrowRight, UserCheck, Shield, KeyRound, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateUserId, isValidUserId } from '../../lib/userIdGenerator';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';

export default function UserSetup() {
  const [mode, setMode] = useState('create');
  const [generatedId, setGeneratedId] = useState(() => generateUserId());
  const [displayName, setDisplayName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser();
  const { addToast } = useToast();

  const handleCreate = async () => {
    if (loading) return;
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      addToast('Username is required! Please enter your name.', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data: existing } = await supabase.from('users').select('user_id').eq('user_id', generatedId).single();
      if (existing) {
        setGeneratedId(generateUserId());
        addToast('✨ New Identity Created! Click Get Started to enter.', 'warning');
        setLoading(false);
        return;
      }
      const { error } = await supabase.from('users').insert({ user_id: generatedId, display_name: trimmedName });
      if (error) throw error;
      setUser(generatedId, trimmedName);
      addToast(`Identity created! Welcome, ${trimmedName}.`, 'success');
      window.location.href = '/dashboard';
    } catch (err) {
      addToast(err.message || 'Failed to create identity', 'error');
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (loading) return;
    const id = loginId.trim().toLowerCase();
    if (!isValidUserId(id)) { addToast('Invalid format — needs 3 letters + 3 digits (e.g. abc123)', 'error'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('user_id, display_name').eq('user_id', id).single();
      if (error || !data) { addToast('User not found. Check your ID or create a new identity.', 'error'); setLoading(false); return; }
      await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('user_id', id);
      setUser(data.user_id, data.display_name || id);
      addToast(`Welcome back, ${data.display_name || id}!`, 'success');
      window.location.href = '/dashboard';
    } catch (err) {
      addToast(err.message || 'Login failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: 'clamp(16px, 4vw, 24px)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
        position: 'relative'
      }}>

        {/* Proton Segmented Switcher */}
        <div style={{
          display: 'flex',
          gap: '3px',
          padding: '3px',
          background: 'var(--surface-2)',
          borderRadius: '9999px',
          border: '1px solid var(--border)',
          marginBottom: '18px'
        }}>
          <button
            onClick={() => setMode('create')}
            style={{
              flex: 1,
              padding: '8px 4px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              borderRadius: '9999px',
              transition: 'all 0.15s ease',
              background: mode === 'create' ? 'var(--accent)' : 'transparent',
              color: mode === 'create' ? '#FFFFFF' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Shield size={13} />
            <span>Create Identity</span>
          </button>

          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '8px 4px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              borderRadius: '9999px',
              transition: 'all 0.15s ease',
              background: mode === 'login' ? 'var(--accent)' : 'transparent',
              color: mode === 'login' ? '#FFFFFF' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={13} />
            <span>Log In with ID</span>
          </button>
        </div>

        {mode === 'create' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Generated ID Container (Proton Token Display) */}
            <div style={{
              textAlign: 'center',
              background: 'var(--surface-2)',
              padding: '14px 12px',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                <KeyRound size={12} color="var(--accent)" />
                <span>Generated 24h Cipher ID</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 'clamp(22px, 6.5vw, 28px)',
                  fontWeight: 800,
                  color: 'var(--accent)',
                  letterSpacing: '0.12em'
                }}>
                  {generatedId}
                </span>

                <button
                  onClick={() => setGeneratedId(generateUserId())}
                  title="Generate new ID"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--field-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
                Keep this ID to log back in from another device
              </p>
            </div>

            {/* Username Field */}
            <div>
              <label className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Username / Alias</span>
                <span style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 600 }}>* REQUIRED</span>
              </label>
              <input
                className="input-field"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Enter your chat alias (e.g. Alex)"
                maxLength={30}
                required
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>

            {/* Submit CTA */}
            <button
              className="btn-primary"
              onClick={handleCreate}
              disabled={loading || !displayName.trim()}
              style={{ opacity: !displayName.trim() ? 0.45 : 1, padding: '12px 20px' }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff',
                    display: 'inline-block', animation: 'spin 0.8s linear infinite'
                  }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  Initializing...
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  <span>Start Private Messaging</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label className="label">Enter Your 6-Character ID</label>
              <input
                className="input-field font-mono"
                style={{
                  textAlign: 'center',
                  fontSize: '22px',
                  letterSpacing: '0.15em',
                  fontWeight: 700,
                  padding: '12px 14px'
                }}
                type="text"
                value={loginId}
                onChange={e => setLoginId(e.target.value.toLowerCase())}
                placeholder="ABC123"
                maxLength={6}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px', textAlign: 'center' }}>
                Format: 3 letters + 3 digits (e.g. ocu565)
              </p>
            </div>

            <button
              className="btn-primary"
              onClick={handleLogin}
              disabled={loading || loginId.length < 6}
              style={{ padding: '12px 20px' }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff',
                    display: 'inline-block', animation: 'spin 0.8s linear infinite'
                  }} />
                  Authenticating...
                </>
              ) : (
                <>
                  <span>Unlock Identity</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
