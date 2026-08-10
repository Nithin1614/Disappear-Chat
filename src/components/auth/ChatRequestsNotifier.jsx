import { useState, useEffect } from 'react';
import { MessageSquare, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function ChatRequestsNotifier({ userId }) {
  const [requests, setRequests] = useState([]);
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

    const channel = supabase.channel(`chat_reqs:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_requests', filter: `target_id=eq.${userId}` }, fetchRequests)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const handleAccept = async (req) => {
    try {
      // Find room id by room code
      const { data: room } = await supabase.from('rooms').select('id').eq('room_code', req.room_code).single();
      if (room) {
        await supabase.from('room_members').upsert(
          { room_id: room.id, user_id: userId, is_online: true },
          { onConflict: 'room_id,user_id' }
        );
      }

      await supabase.from('chat_requests').update({ status: 'accepted' }).eq('id', req.id);
      addToast('Request accepted! Entering chat...', 'success');
      window.location.href = `/room/${req.room_code}`;
    } catch (err) {
      addToast(err.message || 'Failed to accept chat request', 'error');
    }
  };

  const handleDecline = async (req) => {
    try {
      await supabase.from('chat_requests').update({ status: 'declined' }).eq('id', req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      addToast('Chat request declined', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to decline request', 'error');
    }
  };

  if (!requests.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
      {requests.map(req => (
        <div key={req.id} style={{
          background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)',
          borderRadius: '12px', padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageSquare size={16} color="#08090d" />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                Incoming Chat Request
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--accent)' }}>{req.sender_name || req.sender_id}</strong> wants to start a private encrypted chat with you.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => handleAccept(req)}
              style={{
                background: 'var(--success)', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <Check size={14} /> Accept & Chat
            </button>
            <button
              onClick={() => handleDecline(req)}
              style={{
                background: 'var(--surface-3)', color: 'var(--text-muted)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <X size={14} /> Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
