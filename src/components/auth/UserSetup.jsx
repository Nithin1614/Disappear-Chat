import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowRight } from 'lucide-react';
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
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data: existing } = await supabase.from('users').select('user_id').eq('user_id', generatedId).single();
      if (existing) { setGeneratedId(generateUserId()); addToast('ID taken, regenerated', 'warning'); setLoading(false); return; }
      const { error } = await supabase.from('users').insert({ user_id: generatedId, display_name: displayName.trim() || null });
      if (error) throw error;
      setUser(generatedId, displayName.trim());
      addToast('Identity created!', 'success');
      navigate('/dashboard');
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
      if (error || !data) { addToast('User not found. Check your ID or create a new one.', 'error'); setLoading(false); return; }
      await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('user_id', id);
      setUser(data.user_id, data.display_name || '');
      addToast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message || 'Login failed', 'error');
    } finally { setLoading(false); }
  };

  /* ---- shared styles ---- */
  const tabBase = {
    flex: 1, padding: '10px 0', fontSize: '14px', fontWeight: 500,
    cursor: 'pointer', border: 'none', borderRadius: '8px', transition: 'all 0.15s ease',
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', }}>

        {/* Tab */}
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'var(--surface-2)', borderRadius: '10px', marginBottom: '28px' }}>
          <button
            onClick={() => setMode('create')}
            style={{ ...tabBase, background: mode === 'create' ? 'var(--accent)' : 'transparent', color: mode === 'create' ? '#fff' : 'var(--text-muted)' }}
          >New Identity</button>
          <button
            onClick={() => setMode('login')}
            style={{ ...tabBase, background: mode === 'login' ? 'var(--accent)' : 'transparent', color: mode === 'login' ? '#fff' : 'var(--text-muted)' }}
          >Have an ID</button>
        </div>

        {mode === 'create' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* ID Display */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Your unique ID</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '36px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.12em' }}>
                  {generatedId}
                </span>
                <button
                  onClick={() => setGeneratedId(generateUserId())}
                  title="Generate new ID"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px' }}>Save this — you'll need it to log back in</p>
            </div>

            {/* Display name */}
            <div>
              <label className="label">Display name <span style={{ opacity: 0.4 }}>(optional)</span></label>
              <input
                className="input-field"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="What should others call you?"
                maxLength={30}
              />
            </div>

            <button className="btn-primary" onClick={handleCreate} disabled={loading}>
              {loading
                ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>Creating...</>
                : <>Create Identity <ArrowRight size={15} /></>}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="label">Your User ID</label>
              <input
                className="input-field font-mono"
                style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '0.15em' }}
                type="text"
                value={loginId}
                onChange={e => setLoginId(e.target.value.toLowerCase())}
                placeholder="abc123"
                maxLength={6}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>3 lowercase letters + 3 digits</p>
            </div>

            <button className="btn-primary" onClick={handleLogin} disabled={loading || loginId.length < 6}>
              {loading
                ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Checking...</>
                : <>Access Account <ArrowRight size={15} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
