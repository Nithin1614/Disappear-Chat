import { useState, useEffect } from 'react';
import { Clock, Check, X, ThumbsUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function ExtendVoteBanner({ roomId, userId, memberCount, onClose }) {
  const [votes, setVotes] = useState([]);
  const [minutesToAdd, setMinutesToAdd] = useState(15);
  const [requesterId, setRequesterId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!roomId) return;

    const fetchVotes = async () => {
      const { data } = await supabase
        .from('extend_votes')
        .select('user_id, minutes_to_add, voted_at')
        .eq('room_id', roomId)
        .order('voted_at', { ascending: true });

      if (data && data.length > 0) {
        setVotes(data.map(v => v.user_id));
        setMinutesToAdd(data[0].minutes_to_add || 15);
        setRequesterId(data[0].user_id);
        setHasVoted(data.some(v => v.user_id === userId));
      } else {
        setVotes([]);
        setRequesterId(null);
        setHasVoted(false);
      }
    };

    fetchVotes();

    const channel = supabase.channel(`evotes_banner:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'extend_votes', filter: `room_id=eq.${roomId}` }, fetchVotes)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, userId]);

  // When all members vote YES -> Extend room automatically!
  useEffect(() => {
    if (votes.length > 0 && memberCount > 0 && votes.length >= memberCount) {
      handleApplyExtension();
    }
  }, [votes, memberCount]);

  const handleApplyExtension = async () => {
    try {
      const { data: room } = await supabase.from('rooms').select('expires_at, duration_minutes').eq('id', roomId).single();
      if (!room) return;

      const currentExpiry = new Date(room.expires_at).getTime();
      const now = Date.now();
      // Base time is either current expiry or now (if expired)
      const baseTime = Math.max(currentExpiry, now);
      const newExpiry = new Date(baseTime + minutesToAdd * 60000);

      await supabase.from('rooms').update({
        expires_at: newExpiry.toISOString(),
        duration_minutes: room.duration_minutes + minutesToAdd
      }).eq('id', roomId);

      await supabase.from('extend_votes').delete().eq('room_id', roomId);

      addToast(`🎉 Room timer extended by +${minutesToAdd} minutes!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to extend time', 'error');
    }
  };

  const handleApprove = async () => {
    if (hasVoted || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('extend_votes').insert({
        room_id: roomId,
        user_id: userId,
        minutes_to_add: minutesToAdd
      });
      if (error) throw error;
      setHasVoted(true);
      addToast('Vote approved!', 'success');
    } catch (err) {
      addToast(err.message || 'Approval failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await supabase.from('extend_votes').delete().eq('room_id', roomId);
      addToast('Extension request declined', 'info');
    } catch (err) {
      addToast(err.message || 'Rejection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!votes.length) return null;

  const isRequester = requesterId === userId;

  return (
    <div style={{
      background: 'rgba(245,158,11,0.12)',
      borderBottom: '1px solid rgba(245,158,11,0.3)',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      zIndex: 30,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '6px',
          background: 'rgba(245,158,11,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Clock size={15} color="var(--warning)" />
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
            Extension Vote: <span style={{ color: 'var(--warning)' }}>+{minutesToAdd} Minutes</span>
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Requested by <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>{requesterId}</span> · Voted: {votes.length}/{memberCount} members
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!hasVoted ? (
          <>
            <button
              onClick={handleApprove}
              disabled={loading}
              style={{
                background: 'var(--success)', color: '#fff', border: 'none',
                borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <ThumbsUp size={13} /> Approve (+{minutesToAdd}m)
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              style={{
                background: 'var(--surface-3)', color: 'var(--text-muted)', border: '1px solid var(--border)',
                borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <X size={13} /> Reject
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={14} /> You Approved
            </span>
            <button
              onClick={handleReject}
              title="Cancel vote"
              style={{
                background: 'none', border: 'none', color: 'var(--text-dim)',
                fontSize: '11px', cursor: 'pointer', textDecoration: 'underline'
              }}
            >
              {isRequester ? 'Cancel Request' : 'Retract'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
