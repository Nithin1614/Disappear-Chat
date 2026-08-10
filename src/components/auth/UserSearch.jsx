import { useState, useEffect } from 'react';
import { Search, MessageSquarePlus, Clock, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { generateRoomCode } from '../../lib/userIdGenerator';

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [resultUser, setResultUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [requestingId, setRequestingId] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);

  const { userId, displayName } = useUser();
  const { addToast } = useToast();

  // Reset states on mount
  useEffect(() => {
    setRequestingId(null);
    setActiveRequest(null);
    setResultUser(null);
    setSearched(false);
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearching(true);
    setSearched(true);
    setResultUser(null);

    try {
      // Exact match search only (display_name or user_id)
      const { data, error } = await supabase
        .from('users')
        .select('user_id, display_name')
        .or(`display_name.ilike.${trimmed},user_id.eq.${trimmed}`)
        .neq('user_id', userId || '')
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setResultUser(data[0]);
      } else {
        setResultUser(null);
      }
    } catch (err) {
      addToast(err.message || 'Search failed', 'error');
    } finally {
      setSearching(false);
    }
  };

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

      // Broadcast instant 0ms notification to target user
      const notifyChannel = supabase.channel(`user_direct_notify:${targetUser.user_id}`);
      notifyChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          notifyChannel.send({
            type: 'broadcast',
            event: 'new_chat_request',
            payload: { sender_name: displayName || userId, roomCode },
          });
        }
      });

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
      setRequestingId(null);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResultUser(null);
    setSearched(false);
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
              onClick={() => {
                const url = activeRequest.joinUrl;
                setActiveRequest(null);
                window.location.href = url;
              }}
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

      {/* Search input form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none'
          }} />
          <input
            className="input-field"
            style={{ paddingLeft: '36px', paddingRight: query ? '36px' : '14px' }}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) clearSearch();
            }}
            placeholder="Enter exact Username or User ID…"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
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

        <button
          type="submit"
          disabled={searching || !query.trim()}
          style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: '10px', padding: '0 18px', fontSize: '13px', fontWeight: 700,
            cursor: (searching || !query.trim()) ? 'not-allowed' : 'pointer',
            opacity: (searching || !query.trim()) ? 0.5 : 1,
            flexShrink: 0, height: '42px', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          {searching ? 'Searching…' : 'Find User'}
        </button>
      </form>

      {/* Searching indicator */}
      {searching && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', gap: '8px', alignItems: 'center' }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            border: '2px solid var(--surface-3)', borderTop: '2px solid var(--accent)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Checking user existence…</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* No exact match result */}
      {!searching && searched && !resultUser && (
        <div style={{ textAlign: 'center', padding: '16px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>No user matches exact name or ID "{query}"</p>
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>Please double check spelling and enter the exact Username or User ID.</p>
        </div>
      )}

      {/* Single exact result user card */}
      {!searching && resultUser && (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            padding: '14px 16px', borderRadius: '12px',
            background: 'var(--surface-2)', border: '1px solid var(--accent-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontSize: '16px', fontWeight: 700, color: '#fff',
            }}>
              {(resultUser.display_name || resultUser.user_id).charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {resultUser.display_name || resultUser.user_id}
              </p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                ID: {resultUser.user_id}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleRequestChat(resultUser)}
            disabled={!!requestingId}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none', borderRadius: '10px',
              padding: '10px 16px', fontSize: '13px', fontWeight: 700,
              cursor: requestingId ? 'not-allowed' : 'pointer',
              opacity: requestingId ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
          >
            {requestingId === resultUser.user_id ? (
              <>
                <div style={{
                  width: 13, height: 13, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Sending Request…
              </>
            ) : (
              <><MessageSquarePlus size={15} /> Direct Chat (5m)</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
