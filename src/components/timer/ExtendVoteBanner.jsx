import { useState, useEffect, useRef } from 'react';
import { Clock, Check, X, ThumbsUp, Hourglass } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function ExtendVoteBanner({ roomId, userId, memberCount, memberMap = {} }) {
  const [votes, setVotes] = useState([]);
  const [minutesToAdd, setMinutesToAdd] = useState(15);
  const [requesterId, setRequesterId] = useState(null);
  const [voteCreatedAt, setVoteCreatedAt] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(15000);
  const [timerProgress, setTimerProgress] = useState(100);

  const { addToast } = useToast();
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
        setVoteCreatedAt(data[0].voted_at);
        setHasVoted(data.some(v => v.user_id === userId));
      } else {
        setVotes([]);
        setRequesterId(null);
        setVoteCreatedAt(null);
        setHasVoted(false);
      }
    };

    fetchVotes();

    const channel = supabase
      .channel(`evotes_banner:${roomId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'extend_votes', filter: `room_id=eq.${roomId}`
      }, fetchVotes)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, userId]);

  const applyExtension = async (minsToAdd) => {
    if (applyingRef.current) return;
    applyingRef.current = true;
    try {
      const { data: room } = await supabase
        .from('rooms')
        .select('expires_at, duration_minutes')
        .eq('id', roomId)
        .single();
      if (!room) return;

      const baseTime = Math.max(new Date(room.expires_at).getTime(), Date.now());
      const newExpiry = new Date(baseTime + minsToAdd * 60000);

      await supabase.from('rooms').update({
        expires_at: newExpiry.toISOString(),
        duration_minutes: room.duration_minutes + minsToAdd,
      }).eq('id', roomId);

      await supabase.from('extend_votes').delete().eq('room_id', roomId);
      addToast(`🎉 Room extended by +${minsToAdd} minutes!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to extend', 'error');
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
        minutes_to_add: minutesToAdd,
      });
      if (error) throw error;
      setHasVoted(true);
      addToast('Vote cast! Waiting for others…', 'success');

      const { data: currentVotes } = await supabase
        .from('extend_votes')
        .select('user_id')
        .eq('room_id', roomId);

      if ((currentVotes?.length || 0) >= memberCount && memberCount > 0) {
        await applyExtension(minutesToAdd);
      }
    } catch (err) {
      addToast(err.message || 'Vote failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (loading) return;
    try {
      await supabase.from('extend_votes').delete().eq('room_id', roomId);
      addToast('Extension request expired/cancelled', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to cancel', 'error');
    }
  };

  // 15-second expiration timer for vote request
  useEffect(() => {
    if (!votes.length || !voteCreatedAt) return;

    const DURATION_MS = 15000; // 15 seconds
    const voteTime = new Date(voteCreatedAt).getTime();

    const interval = setInterval(() => {
      const elapsed = Date.now() - voteTime;
      const remaining = Math.max(0, DURATION_MS - elapsed);
      const progress = (remaining / DURATION_MS) * 100;

      setTimeLeftMs(remaining);
      setTimerProgress(progress);

      if (remaining <= 0) {
        clearInterval(interval);
        handleCancel();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [votes.length, voteCreatedAt]);

  if (!votes.length) return null;

  const isRequester = requesterId === userId;
  const requesterName = memberMap[requesterId] || requesterId;
  const approvedCount = votes.length;
  const secondsLeft = Math.ceil(timeLeftMs / 1000);

  return (
    <div style={{
      background: 'rgba(16,185,129,0.08)',
      borderBottom: '2px solid rgba(16,185,129,0.3)',
      padding: '10px 14px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {/* Top row: icon + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
          background: 'rgba(16,185,129,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Hourglass size={15} color="var(--accent)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
            ⏱ Extend Room Timer
            <span style={{ marginLeft: '6px', fontSize: '12px', fontWeight: 400, color: 'var(--accent)' }}>
              +{minutesToAdd} min
            </span>
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isRequester ? 'You requested this' : `Requested by ${requesterName}`} · {approvedCount}/{memberCount} approved · Expires in <strong style={{ color: 'var(--accent)' }}>{secondsLeft}s</strong>
          </p>
        </div>
      </div>

      {/* 15-second expiration progress bar */}
      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${timerProgress}%`,
          background: 'var(--accent)',
          borderRadius: 2,
          transition: 'width 0.1s linear',
        }} />
      </div>

      {/* Action buttons row */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {!hasVoted && !isRequester ? (
          <>
            <button
              onClick={handleApprove}
              disabled={loading}
              style={{
                flex: 1,
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading
                ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite' }} /> Voting…</>
                : <><ThumbsUp size={14} /> Approve (+{minutesToAdd}m)</>
              }
            </button>
            <button
              onClick={handleCancel}
              style={{
                background: 'var(--surface-3)', color: 'var(--text-muted)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '8px 12px', fontSize: '13px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              <X size={13} /> Reject
            </button>
          </>
        ) : hasVoted && !isRequester ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', flex: 1,
              padding: '8px 12px', borderRadius: '8px',
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
            }}>
              <Check size={14} color="var(--accent)" />
              <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
                Voted — waiting for others ({approvedCount}/{memberCount})
              </span>
            </div>
            <button onClick={handleCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '11px', textDecoration: 'underline' }}>
              Retract
            </button>
          </div>
        ) : isRequester ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} color="var(--text-muted)" />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Waiting for approval ({approvedCount}/{memberCount})
              </span>
            </div>
            <button
              onClick={handleCancel}
              style={{
                background: 'var(--surface-3)', color: 'var(--text-muted)', border: '1px solid var(--border)',
                borderRadius: '6px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <X size={12} /> Cancel
            </button>
          </div>
        ) : null}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
