import { useState, useEffect } from 'react';
import { MessageSquare, Check, X, Bell, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

/**
 * Floating chat request notifications — fixed bottom-right, always on top.
 * Uses PBKDF2 room-code key derivation so no #key fragment is needed.
 */
export default function ChatRequestsNotifier({ userId }) {
  const [requests, setRequests] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const fetchRequests = async () => {
      const { data } = await supabase
        .from('chat_requests')
        .select('*')
        .eq('target_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setRequests(data || []);
    };

    fetchRequests();

    const channel = supabase
      .channel(`chat_reqs:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_requests',
        filter: `target_id=eq.${userId}`,
      }, fetchRequests)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_requests',
        filter: `target_id=eq.${userId}`,
      }, fetchRequests)
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_requests',
        filter: `target_id=eq.${userId}`,
      }, fetchRequests)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const handleAccept = async (req) => {
    if (accepting) return;
    setAccepting(req.id);

    try {
      // Verify room still exists and is active
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .select('id, is_active, expires_at')
        .eq('room_code', req.room_code)
        .single();

      if (roomErr || !room) {
        addToast('Room no longer exists or has expired.', 'error');
        // Clean up the stale request
        await supabase.from('chat_requests').update({ status: 'declined' }).eq('id', req.id);
        setRequests(prev => prev.filter(r => r.id !== req.id));
        setAccepting(null);
        return;
      }

      if (!room.is_active || (room.expires_at && new Date(room.expires_at) < new Date())) {
        addToast('This chat session has already expired.', 'warning');
        await supabase.from('chat_requests').update({ status: 'declined' }).eq('id', req.id);
        setRequests(prev => prev.filter(r => r.id !== req.id));
        setAccepting(null);
        return;
      }

      // Add recipient as room member
      await supabase.from('room_members').upsert(
        { room_id: room.id, user_id: userId, is_online: true },
        { onConflict: 'room_id,user_id' }
      );

      // Mark request as accepted
      await supabase
        .from('chat_requests')
        .update({ status: 'accepted' })
        .eq('id', req.id);

      addToast('Accepted! Entering encrypted chat…', 'success');

      // Navigate — key is derived from room_code via PBKDF2, no hash needed
      window.location.href = `/room/${req.room_code}`;

    } catch (err) {
      addToast(err.message || 'Failed to accept request', 'error');
      setAccepting(null);
    }
  };

  const handleDecline = async (req) => {
    try {
      await supabase
        .from('chat_requests')
        .update({ status: 'declined' })
        .eq('id', req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      addToast('Request declined', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to decline', 'error');
    }
  };

  if (!requests.length) return null;

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '16px',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: 'min(340px, calc(100vw - 32px))',
        pointerEvents: 'none', // container transparent to clicks
      }}>
        {requests.map(req => (
          <div
            key={req.id}
            className="animate-slide-in-right"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--accent-border)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px var(--accent-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              pointerEvents: 'all', // re-enable for the card itself
            }}
          >
            {/* Icon + text */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '11px',
                  background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageSquare size={19} color="var(--accent)" />
                </div>
                {/* Pulse ring */}
                <div style={{
                  position: 'absolute', inset: '-5px', borderRadius: '16px',
                  border: '2px solid var(--accent)',
                  animation: 'req-ring 1.8s ease-in-out infinite',
                  opacity: 0.5,
                }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                  <Bell size={11} color="var(--accent)" />
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Incoming Chat Request
                  </span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, marginBottom: '3px' }}>
                  {req.sender_name || req.sender_id}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  wants a private 5-min encrypted chat
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <Shield size={10} color="var(--accent)" />
                  <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600 }}>E2E Encrypted · Auto-deletes after 5 min</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleAccept(req)}
                disabled={accepting === req.id}
                style={{
                  flex: 1, background: 'var(--accent)', color: '#fff', border: 'none',
                  borderRadius: '10px', padding: '11px 14px', fontSize: '13px', fontWeight: 700,
                  cursor: accepting === req.id ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  opacity: accepting === req.id ? 0.7 : 1, transition: 'all 0.15s',
                }}
              >
                {accepting === req.id ? (
                  <>
                    <div style={{
                      width: 13, height: 13, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Entering…
                  </>
                ) : (
                  <><Check size={15} /> Accept & Enter Chat</>
                )}
              </button>

              <button
                onClick={() => handleDecline(req)}
                disabled={!!accepting}
                title="Decline"
                style={{
                  background: 'var(--surface-2)', color: 'var(--text-muted)',
                  border: '1px solid var(--border)', borderRadius: '10px',
                  padding: '11px 13px', fontSize: '13px', cursor: accepting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  opacity: accepting ? 0.5 : 1,
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes req-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%       { transform: scale(1.12); opacity: 0.15; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
