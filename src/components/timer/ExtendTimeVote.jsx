import { useState } from 'react';
import { Clock, X, Vote } from 'lucide-react';
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
      await supabase.from('extend_votes').delete().eq('room_id', roomId);

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
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.82)' }}
      onClick={onClose}
    >
      <div
        className="animate-scale-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '28px', width: '100%', maxWidth: '360px', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          style={{
            position: 'absolute', top: '12px', right: '12px',
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s'
          }}
          title="Close"
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={20} color="var(--accent)" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '17px', color: 'var(--text)' }}>Extend Room Time</p>
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
