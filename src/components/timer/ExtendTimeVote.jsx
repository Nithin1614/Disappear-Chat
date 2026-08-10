import { useState, useEffect } from 'react';
import { Clock, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function ExtendTimeVote({ roomId, userId, memberCount, onClose }) {
  const [votes, setVotes] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!roomId) return;
    const fetch = async () => {
      const { data } = await supabase.from('extend_votes').select('user_id').eq('room_id', roomId);
      if (data) { setVotes(data.map(v => v.user_id)); setHasVoted(data.some(v => v.user_id === userId)); }
    };
    fetch();
    const ch = supabase.channel(`evotes:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'extend_votes', filter: `room_id=eq.${roomId}` }, fetch)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [roomId, userId]);

  useEffect(() => {
    if (votes.length > 0 && votes.length >= memberCount) extendRoom();
  }, [votes, memberCount]);

  const castVote = async () => {
    if (hasVoted || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('extend_votes').insert({ room_id: roomId, user_id: userId });
      if (error) throw error;
      setHasVoted(true);
      addToast('Vote cast! Waiting for others…', 'info');
    } catch (err) { addToast(err.message || 'Vote failed', 'error'); }
    finally { setLoading(false); }
  };

  const extendRoom = async () => {
    try {
      const { data: room } = await supabase.from('rooms').select('expires_at, duration_minutes').eq('id', roomId).single();
      if (!room) return;
      const newExpiry = new Date(new Date(room.expires_at).getTime() + room.duration_minutes * 60000);
      await supabase.from('rooms').update({ expires_at: newExpiry.toISOString() }).eq('id', roomId);
      await supabase.from('extend_votes').delete().eq('room_id', roomId);
      addToast('⏰ Time extended! Everyone agreed.', 'success');
      onClose();
    } catch (err) { addToast(err.message || 'Failed to extend', 'error'); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 85, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.7)' }}>
      <div className="animate-scale-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '320px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex' }}><X size={16} /></button>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <Clock size={20} color="var(--warning)" />
          </div>

          <div>
            <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)', marginBottom: '6px' }}>Extend Room Time?</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>All members must agree to extend. Once everyone votes, time is doubled.</p>
          </div>

          {/* Vote dots */}
          <div>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '8px' }}>
              {Array.from({ length: memberCount }, (_, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < votes.length ? 'var(--success)' : 'var(--surface-3)', border: '1px solid var(--border)', transition: 'background 0.2s' }} />
              ))}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{votes.length} of {memberCount} voted</p>
          </div>

          {!hasVoted ? (
            <button
              className="btn-primary"
              onClick={castVote}
              disabled={loading}
              style={{ background: 'var(--warning)', border: 'none' }}
            >
              {loading
                ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>Voting...</>
                : <><Check size={15} /> Vote to Extend</>}
            </button>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 500 }}>✓ You voted — waiting for others…</p>
          )}
        </div>
      </div>
    </div>
  );
}
