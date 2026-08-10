import { useState, useEffect } from 'react';
import { MessageSquare, Check, X, Bell, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

/**
 * Floating chat request notifications & direct chat synchronization listener.
 * Mobile-aligned layout + instant single-use session lifecycle.
 */
export default function ChatRequestsNotifier({ userId }) {
  const [requests, setRequests] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const { addToast } = useToast();

  // Incoming requests listener (target_id = userId)
  useEffect(() => {
    if (!userId) return;
    setAccepting(null);

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

    // 1. Postgres changes listener
    const postgresChannel = supabase
      .channel(`chat_reqs_pg:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_requests',
        filter: `target_id=eq.${userId}`,
      }, fetchRequests)
      .subscribe();

    // 2. Instant Realtime Broadcast channel (0ms latency trigger)
    const broadcastChannel = supabase
      .channel(`user_direct_notify:${userId}`)
      .on('broadcast', { event: 'new_chat_request' }, (payload) => {
        addToast(`🔔 New chat request from ${payload.payload?.sender_name || 'a user'}!`, 'info');
        fetchRequests();
      })
      .subscribe();

    // 3. Fast 2.5s poll fallback (backup safety net)
    const pollInterval = setInterval(fetchRequests, 2500);

    return () => {
      supabase.removeChannel(postgresChannel);
      supabase.removeChannel(broadcastChannel);
      clearInterval(pollInterval);
    };
  }, [userId, addToast]);

  // Outgoing requests listener (sender_id = userId) — redirects sender as soon as target accepts!
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`chat_reqs_out:${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_requests',
        filter: `sender_id=eq.${userId}`,
      }, (payload) => {
        if (payload.new && payload.new.status === 'accepted') {
          const roomCode = payload.new.room_code;
          addToast('Chat request accepted! Entering room with partner…', 'success');
          // Instantly mark completed in DB so it is cleaned up and never prompts again on exit/return!
          supabase.from('chat_requests').update({ status: 'completed' }).eq('id', payload.new.id).then(() => {});
          setTimeout(() => {
            if (!window.location.pathname.includes(`/room/${roomCode}`)) {
              window.location.href = `/room/${roomCode}`;
            }
          }, 400);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, addToast]);

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

      // Mark request as accepted in DB (triggers sender's listener)
      await supabase
        .from('chat_requests')
        .update({ status: 'accepted' })
        .eq('id', req.id);

      // Remove from local notification list immediately
      setRequests(prev => prev.filter(r => r.id !== req.id));

      addToast('Accepted! Entering chat…', 'success');
      window.location.href = `/room/${req.room_code}`;

    } catch (err) {
      addToast(err.message || 'Failed to accept request', 'error');
      setAccepting(null);
    }
  };

  const handleDecline = async (req, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setRequests(prev => prev.filter(r => r.id !== req.id));
    addToast('Request dismissed', 'info');

    try {
      await supabase
        .from('chat_requests')
        .update({ status: 'declined' })
        .eq('id', req.id);
    } catch {
      // background handle
    }
  };

  if (!requests.length) return null;

  return (
    <>
      <div
        className="chat-request-toast-container"
        style={{
          position: 'fixed',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {requests.map(req => (
          <div
            key={req.id}
            className="animate-slide-in-right"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--accent-border)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.75), 0 0 0 1px var(--accent-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              pointerEvents: 'all',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            {/* Top Close X button */}
            <button
              onClick={(e) => handleDecline(req, e)}
              style={{
                position: 'absolute', top: '10px', right: '10px',
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', zIndex: 5,
              }}
              title="Close notification"
            >
              <X size={16} />
            </button>

            {/* Icon + text */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingRight: '28px' }}>
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
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, marginBottom: '3px', wordBreak: 'break-word' }}>
                  {req.sender_name || req.sender_id}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  wants a private 5-min encrypted chat
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
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
                onClick={(e) => handleDecline(req, e)}
                disabled={!!accepting}
                title="Decline request"
                style={{
                  background: 'var(--surface-2)', color: 'var(--text-muted)',
                  border: '1px solid var(--border)', borderRadius: '10px',
                  padding: '11px 14px', fontSize: '13px', cursor: accepting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600,
                  opacity: accepting ? 0.5 : 1, flexShrink: 0,
                }}
              >
                <X size={15} /> Decline
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .chat-request-toast-container {
          bottom: 20px;
          right: 20px;
          width: 360px;
          max-width: calc(100vw - 32px);
        }
        @media (max-width: 640px) {
          .chat-request-toast-container {
            right: 50% !important;
            transform: translateX(50%) !important;
            bottom: 16px !important;
            width: calc(100vw - 24px) !important;
            max-width: 400px !important;
          }
        }
        @keyframes req-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%       { transform: scale(1.12); opacity: 0.15; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
