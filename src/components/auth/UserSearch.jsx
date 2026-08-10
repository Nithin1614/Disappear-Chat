import { useState, useEffect, useRef } from 'react';
import { Search, User, MessageSquarePlus, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { generateRoomCode } from '../../lib/userIdGenerator';
import { generateEncryptionKey } from '../../lib/crypto';

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [requestingId, setRequestingId] = useState(null);
  const [requestedMap, setRequestedMap] = useState({});
  const debounceRef = useRef(null);

  const { userId, displayName } = useUser();
  const { addToast } = useToast();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true); setSearched(true);
      const { data } = await supabase
        .from('users')
        .select('user_id, display_name')
        .ilike('user_id', `%${query.toLowerCase()}%`)
        .neq('user_id', userId || '')
        .limit(5);
      setResults(data || []);
      setSearching(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, userId]);

  const handleRequestChat = async (targetUser) => {
    if (requestingId) return;
    setRequestingId(targetUser.user_id);

    try {
      const roomCode = generateRoomCode();
      const key = await generateEncryptionKey(roomCode);

      // Create private room
      const { data: room, error: roomErr } = await supabase.from('rooms').insert({
        room_code: roomCode,
        created_by: userId,
        duration_minutes: 30,
        max_members: 2,
        is_active: true,
        timer_started: false,
      }).select().single();

      if (roomErr) throw roomErr;

      // Create chat request notification row
      const { error: reqErr } = await supabase.from('chat_requests').insert({
        sender_id: userId,
        sender_name: displayName || userId,
        target_id: targetUser.user_id,
        room_code: roomCode,
        status: 'pending',
      });

      if (reqErr) throw reqErr;

      setRequestedMap(prev => ({ ...prev, [targetUser.user_id]: true }));
      addToast(`Chat request sent to ${targetUser.display_name || targetUser.user_id}!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to send chat request', 'error');
    } finally {
      setRequestingId(null);
    }
  };

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
          placeholder="Search by User ID..."
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

      {!searching && results.map(u => {
        const isRequested = requestedMap[u.user_id];
        return (
          <div key={u.user_id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            padding: '10px 14px', borderRadius: '10px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={16} color="#08090d" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {u.display_name || u.user_id}
                </p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>ID: {u.user_id}</p>
              </div>
            </div>

            <button
              onClick={() => handleRequestChat(u)}
              disabled={isRequested || requestingId === u.user_id}
              style={{
                background: isRequested ? 'var(--surface-3)' : 'var(--accent)',
                color: isRequested ? 'var(--success)' : '#08090d',
                border: 'none', borderRadius: '8px', padding: '6px 12px',
                fontSize: '12px', fontWeight: 700, cursor: isRequested ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
              }}
            >
              {isRequested ? (
                <><Check size={13} /> Sent</>
              ) : requestingId === u.user_id ? (
                'Sending...'
              ) : (
                <><MessageSquarePlus size={14} /> Direct Chat</>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
