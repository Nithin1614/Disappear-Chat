import { useState, useEffect, useRef } from 'react';
import { Search, User, MessageSquarePlus, Check, X, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { generateRoomCode } from '../../lib/userIdGenerator';

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [requestingId, setRequestingId] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const debounceRef = useRef(null);

  const { userId, displayName } = useUser();
  const { addToast } = useToast();

  // Reset states on mount (e.g., when returning back to Dashboard from a chat room)
  useEffect(() => {
    setRequestingId(null);
    setActiveRequest(null);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) { setResults([]); setSearched(false); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearched(true);
      const { data } = await supabase
        .from('users')
        .select('user_id, display_name')
        .or(`user_id.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
        .neq('user_id', userId || '')
        .limit(8);
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
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Create 5-minute room
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .insert({
          room_code: roomCode,
          created_by: userId,
          duration_minutes: 5,
          max_members: 2,
          is_active: true,
          timer_started: true,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (roomErr) throw roomErr;

      // Add sender as member
      await supabase.from('room_members').upsert(
        { room_id: room.id, user_id: userId, is_online: true, display_name: displayName || userId },
        { onConflict: 'room_id,user_id' }
      );

      const joinUrl = `/room/${roomCode}`;

      const { data: reqData, error: reqErr } = await supabase.from('chat_requests').insert({
        sender_id: userId,
        sender_name: displayName || userId,
        target_id: targetUser.user_id,
        room_code: roomCode,
        join_url: joinUrl,
        status: 'pending',
      }).select().single();

      if (reqErr) throw reqErr;

      setActiveRequest({
        id: reqData.id,
        targetName: targetUser.display_name || targetUser.user_id,
        roomCode,
        joinUrl,
      });

      addToast(`Chat request sent to ${targetUser.display_name || targetUser.user_id}!`, 'success');

    } catch (err) {
      addToast(err.message || 'Failed to send chat request', 'error');
    } finally {
      // Always reset requestingId so button is never stuck in loading state!
      setRequestingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Active waiting banner */}
      {activeRequest && (
        <div style={{
          background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
          borderRadius: '12px', padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                Waiting for <span style={{ color: 'var(--accent)' }}>{activeRequest.targetName}</span> to accept…
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Both of you will enter the 5-min encrypted chat as soon as they click Accept.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => window.location.href = activeRequest.joinUrl}
              className="btn-primary"
              style={{ width: 'auto', padding: '7px 14px', fontSize: '12px' }}
            >
              Enter Room Now
            </button>
            <button
              onClick={() => setActiveRequest(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex', padding: '4px' }}
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{
          position: 'absolute', left: '12px', top: '50%',
          transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none'
        }} />
        <input
          className="input-field"
          style={{ paddingLeft: '36px' }}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or User ID…"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setSearched(false); }}
            style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)',
              display: 'flex', padding: '2px',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Searching spinner */}
      {searching && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', gap: '8px', alignItems: 'center' }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            border: '2px solid var(--surface-3)', borderTop: '2px solid var(--accent)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Searching…</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* No results */}
      {!searching && searched && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No users found for "{query}"</p>
        </div>
      )}

      {/* Results list */}
      {!searching && results.map(u => {
        const isRequestingThis = requestingId === u.user_id;

        return (
          <div
            key={u.user_id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              padding: '12px 14px', borderRadius: '12px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontSize: '15px', fontWeight: 700, color: '#fff',
              }}>
                {(u.display_name || u.user_id).charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.display_name || u.user_id}
                </p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                  ID: {u.user_id}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleRequestChat(u)}
              disabled={!!requestingId}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none', borderRadius: '8px',
                padding: '8px 14px', fontSize: '12px', fontWeight: 700,
                cursor: requestingId ? 'not-allowed' : 'pointer',
                opacity: requestingId ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              {isRequestingThis ? (
                <>
                  <div style={{
                    width: 13, height: 13, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Sending Request…
                </>
              ) : (
                <><MessageSquarePlus size={14} /> Direct Chat (5m)</>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
