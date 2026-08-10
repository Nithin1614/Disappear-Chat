import { useState, useEffect, useRef } from 'react';
import { Search, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true); setSearched(true);
      const { data } = await supabase.from('users').select('user_id, display_name').ilike('user_id', `%${query.toLowerCase()}%`).limit(5);
      setResults(data || []);
      setSearching(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
        <input
          className="input-field font-mono"
          style={{ paddingLeft: '36px' }}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type a user ID..."
          maxLength={6}
        />
      </div>

      {searching && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--surface-3)', borderTop: '2px solid var(--accent)', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {!searching && searched && results.length === 0 && (
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>No users found</p>
      )}

      {!searching && results.map(u => (
        <div key={u.user_id} style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 12px', borderRadius: '8px',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={14} color="#fff" />
          </div>
          <div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{u.user_id}</p>
            {u.display_name && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.display_name}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
