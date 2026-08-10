import { useState, useEffect, useRef } from 'react';
import { Clock, Check, X, ThumbsUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function ExtendVoteBanner({ roomId, userId, memberCount, memberMap = {} }) {
  const [votes, setVotes] = useState([]);
  const [minutesToAdd, setMinutesToAdd] = useState(15);
  const [requesterId, setRequesterId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  // Prevent double-apply on concurrent re-renders
  const applyingRef = useRef(false);

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

  // Apply extension only when EXPLICITLY called — not auto-fired
  const applyExtension = async (minsToAdd) => {
    if (applyingRef.current) return;
    applyingRef.current = true;
    try {
      const { data: room } = await supabase.from('rooms').select('expires_at, duration_minutes').eq('id', roomId).single();
      if (!room) return;

      const currentExpiry = new Date(room.expires_at).getTime();
      const now = Date.now();
      const baseTime = Math.max(currentExpiry, now);
      const newExpiry = new Date(baseTime + minsToAdd * 60000);

      await supabase.from('rooms').update({
        expires_at: newExpiry.toISOString(),
        duration_minutes: room.duration_minutes + minsToAdd
      }).eq('id', roomId);

      await supabase.from('extend_votes').delete().eq('room_id', roomId);

      addToast(`🎉 Room timer extended by +${minsToAdd} minutes!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to extend time', 'error');
    } finally {
      applyingRef.current = false;
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
      addToast('Vote cast! Waiting for all members…', 'success');

      // Fetch current votes AFTER insert to check if all members have voted
      const { data: currentVotes } = await supabase
        .from('extend_votes')
        .select('user_id')
        .eq('room_id', roomId);

      const totalVotes = currentVotes?.length || 0;
      // Only apply when all members have voted — never before
      if (totalVotes >= memberCount && memberCount > 0) {
        await applyExtension(minutesToAdd);
      }
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
  const requesterName = memberMap[requesterId] || requesterId;

  return (
    <div style={{
      background: 'rgba(16,185,129,0.1)',
      borderBottom: '1px solid rgba(16,185,129,0.3)',
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
          background: 'rgba(16,185,129,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Clock size={15} color="var(--accent)" />
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
            Extension Vote: <span style={{ color: 'var(--accent)' }}>+{minutesToAdd} Minutes</span>
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Requested by <span style={{ fontWeight: 600, color: 'var(--text)' }}>{requesterName}</span> · Approved: {votes.length}/{memberCount}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!hasVoted ? (
          <>
            <button
              onClick={handleApprove}
              disabled={loading || isRequester}
              title={isRequester ? 'You requested this extension' : 'Approve extension'}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600,
                cursor: isRequester ? 'not-allowed' : 'pointer',
                opacity: isRequester ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <ThumbsUp size={13} /> {isRequester ? 'Waiting for others…' : `Approve (+${minutesToAdd}m)`}
            </button>
            {!isRequester && (
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
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={14} /> You Approved — waiting for others
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
