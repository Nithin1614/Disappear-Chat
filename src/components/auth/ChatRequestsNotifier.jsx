import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Check, X, Bell, BellOff, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useNotificationSound } from '../../hooks/useNotificationSound';

/**
 * Floating chat request notifications — in-app only, no OS popups.
 * Desktop: fixed bottom-right panel (max 360px).
 * Mobile: fixed bottom center, full width minus padding.
 * Sound toggle persisted in localStorage.
 */
export default function ChatRequestsNotifier({ userId }) {
  const [requests, setRequests] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const { addToast } = useToast();
  const { playSound, isMuted, toggleMute } = useNotificationSound();
  const lastCountRef = useRef(0);

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

      const fresh = data || [];

      // Play chime when new requests arrive
      if (fresh.length > lastCountRef.current) {
        playSound();
      }
      lastCountRef.current = fresh.length;

      setRequests(fresh);
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

    // 2. Instant broadcast channel (0ms latency)
    const broadcastChannel = supabase
      .channel(`user_direct_notify:${userId}`)
      .on('broadcast', { event: 'new_chat_request' }, (payload) => {
        addToast(`🔔 New chat request from ${payload.payload?.sender_name || 'a user'}!`, 'info');
        playSound();
        fetchRequests();
      })
      .subscribe();

    // 3. Fast 2.5s poll fallback
    const pollInterval = setInterval(fetchRequests, 2500);

    return () => {
      supabase.removeChannel(postgresChannel);
      supabase.removeChannel(broadcastChannel);
      clearInterval(pollInterval);
    };
  }, [userId, addToast, playSound]);

  // Outgoing requests listener — redirect sender when target accepts
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
          addToast('Chat request accepted! Entering room…', 'success');
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

      await supabase.from('room_members').upsert(
        { room_id: room.id, user_id: userId, is_online: true },
        { onConflict: 'room_id,user_id' }
      );

      await supabase.from('chat_requests').update({ status: 'accepted' }).eq('id', req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));

      addToast('Accepted! Entering chat…', 'success');
      window.location.href = `/room/${req.room_code}`;

    } catch (err) {
      addToast(err.message || 'Failed to accept request', 'error');
      setAccepting(null);
    }
  };

  const handleDecline = async (req, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setRequests(prev => prev.filter(r => r.id !== req.id));
    lastCountRef.current = Math.max(0, lastCountRef.current - 1);
    addToast('Request dismissed', 'info');
    try {
      await supabase.from('chat_requests').update({ status: 'declined' }).eq('id', req.id);
    } catch { /* background */ }
  };

  if (!requests.length) return null;

  return (
    <>
      {/* Notification panel — CSS class controls all positioning */}
      <div className="notif-panel">
        {/* Sound mute toggle — top of the panel */}
        <div className="notif-sound-row">
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute notification sounds' : 'Mute notification sounds'}
            className="notif-sound-btn"
          >
            {isMuted ? <BellOff size={13} /> : <Bell size={13} />}
            {isMuted ? 'Sound off' : 'Sound on'}
          </button>
        </div>

        {requests.map(req => (
          <div key={req.id} className="notif-card animate-slide-in-right">
            {/* Dismiss X */}
            <button
              onClick={(e) => handleDecline(req, e)}
              className="notif-close-btn"
              title="Dismiss"
            >
              <X size={15} />
            </button>

            {/* Icon + text */}
            <div className="notif-header">
              <div className="notif-icon-wrap">
                <div className="notif-icon">
                  <MessageSquare size={18} color="var(--accent)" />
                </div>
                <div className="notif-pulse-ring" />
              </div>

              <div className="notif-body">
                <div className="notif-label">
                  <Bell size={10} color="var(--accent)" />
                  <span>Incoming Chat Request</span>
                </div>
                <p className="notif-sender">{req.sender_name || req.sender_id}</p>
                <p className="notif-subtext">wants a private 5-min encrypted chat</p>
                <div className="notif-badge">
                  <Shield size={10} color="var(--accent)" />
                  <span>E2E Encrypted · Auto-deletes after 5 min</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="notif-actions">
              <button
                onClick={() => handleAccept(req)}
                disabled={accepting === req.id}
                className="notif-accept-btn"
              >
                {accepting === req.id ? (
                  <><div className="notif-spinner" /> Entering…</>
                ) : (
                  <><Check size={14} /> Accept & Enter Chat</>
                )}
              </button>
              <button
                onClick={(e) => handleDecline(req, e)}
                disabled={!!accepting}
                className="notif-decline-btn"
              >
                <X size={14} /> Decline
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        /* ===== Notification Panel Layout ===== */
        .notif-panel {
          position: fixed;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
          /* Desktop: bottom-right */
          bottom: 24px;
          right: 24px;
          width: 360px;
          max-width: calc(100vw - 48px);
        }

        /* Mobile: bottom-center, full width */
        @media (max-width: 600px) {
          .notif-panel {
            bottom: 16px;
            right: auto;
            left: 50%;
            transform: translateX(-50%);
            width: calc(100vw - 32px);
            max-width: 420px;
          }
        }

        /* ===== Card ===== */
        .notif-card {
          background: var(--surface);
          border: 1px solid var(--accent-border);
          border-radius: 16px;
          padding: 14px 14px 12px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.75), 0 0 0 1px var(--accent-border);
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: all;
          position: relative;
          box-sizing: border-box;
        }

        /* ===== Sound toggle row ===== */
        .notif-sound-row {
          pointer-events: all;
          display: flex;
          justify-content: flex-end;
        }
        .notif-sound-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          pointer-events: all;
          transition: all 0.15s;
        }
        .notif-sound-btn:hover { border-color: var(--accent-border); color: var(--accent); }

        /* ===== Close button ===== */
        .notif-close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
          transition: all 0.15s;
        }
        .notif-close-btn:hover { background: var(--surface-3); color: var(--danger); }

        /* ===== Header row (icon + text) ===== */
        .notif-header {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding-right: 26px;
        }
        .notif-icon-wrap { position: relative; flex-shrink: 0; }
        .notif-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--accent-dim);
          border: 1px solid var(--accent-border);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notif-pulse-ring {
          position: absolute;
          inset: -5px;
          border-radius: 15px;
          border: 2px solid var(--accent);
          animation: req-ring 1.8s ease-in-out infinite;
          opacity: 0.5;
        }
        .notif-body { flex: 1; min-width: 0; }
        .notif-label {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 3px;
        }
        .notif-label span {
          font-size: 10px;
          font-weight: 800;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .notif-sender {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
          margin-bottom: 2px;
          word-break: break-word;
        }
        .notif-subtext { font-size: 12px; color: var(--text-muted); line-height: 1.4; }
        .notif-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 5px;
          flex-wrap: wrap;
        }
        .notif-badge span { font-size: 10px; color: var(--accent); font-weight: 600; }

        /* ===== Action buttons ===== */
        .notif-actions { display: flex; gap: 8px; }
        .notif-accept-btn {
          flex: 1;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s;
        }
        .notif-accept-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .notif-decline-btn {
          background: var(--surface-2);
          color: var(--text-muted);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .notif-decline-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ===== Spinner ===== */
        .notif-spinner {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }

        /* ===== Keyframes ===== */
        @keyframes req-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%       { transform: scale(1.12); opacity: 0.15; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
