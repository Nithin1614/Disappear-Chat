import { useState } from 'react';
import { Clock, X, Check, Vote } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

const EXTEND_OPTIONS = [
  { label: '+5 Min', value: 5 },
  { label: '+15 Min', value: 15 },
  { label: '+30 Min', value: 30 },
  { label: '+1 Hour', value: 60 },
];

export default function ExtendTimeVote({ roomId, userId, memberCount, onClose }) {
  const [selectedMinutes, setSelectedMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleStartVote = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Clear any stale votes for this room first
      await supabase.from('extend_votes').delete().eq('room_id', roomId);

      // Insert requester's initial vote
      const { error } = await supabase.from('extend_votes').insert({
        room_id: roomId,
        user_id: userId,
        minutes_to_add: selectedMinutes,
      });

      if (error) throw error;

      addToast(`Vote initiated for +${selectedMinutes} mins!`, 'info');
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to start vote', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 85, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.75)' }}>
      <div className="animate-scale-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '340px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex' }}><X size={16} /></button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={20} color="var(--warning)" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>Extend Room Time</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Choose time to add to countdown</p>
            </div>
          </div>

          {/* Preset time options */}
          <div>
            <label className="label">Select Extension Amount</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {EXTEND_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedMinutes(opt.value)}
                  style={{
                    padding: '12px 10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
                    background: selectedMinutes === opt.value ? 'var(--accent-dim)' : 'var(--surface-2)',
                    border: `1px solid ${selectedMinutes === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                    color: selectedMinutes === opt.value ? 'var(--accent)' : 'var(--text)',
                    fontWeight: 600, fontSize: '14px', transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            💡 A notification banner will appear at the top of everyone's chat. Time will be added once approved.
          </div>

          <button
            className="btn-primary"
            onClick={handleStartVote}
            disabled={loading}
          >
            {loading ? 'Initiating...' : <><Vote size={15} /> Request +{selectedMinutes} Min Extension</>}
          </button>
        </div>
      </div>
    </div>
  );
}
