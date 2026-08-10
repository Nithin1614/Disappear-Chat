import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Copy, Check, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateRoomCode } from '../../lib/userIdGenerator';
import { generateEncryptionKey } from '../../lib/crypto';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';

const PRESETS = [
  { label: '1m',  value: 1   },
  { label: '5m',  value: 5   },
  { label: '15m', value: 15  },
  { label: '30m', value: 30  },
  { label: '1h',  value: 60  },
  { label: '6h',  value: 360 },
  { label: '24h', value: 1440},
];

function fmtDuration(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function CreateRoom() {
  const [duration, setDuration] = useState(30);
  const [mode, setMode] = useState('private');
  const [maxMembers, setMaxMembers] = useState(2);
  const [created, setCreated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { userId } = useUser();
  const { addToast } = useToast();

  const handleCreate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const roomCode = generateRoomCode();
      const key = await generateEncryptionKey();
      const { data, error } = await supabase.from('rooms').insert({
        room_code: roomCode, created_by: userId,
        duration_minutes: duration, max_members: mode === 'private' ? 2 : maxMembers,
        is_active: true, timer_started: false,
      }).select().single();
      if (error) throw error;
      await supabase.from('room_members').insert({ room_id: data.id, user_id: userId, is_online: true });
      const url = `${window.location.origin}/room/${roomCode}#key=${key}`;
      setCreated({ roomCode, url });
      addToast('Room created! Share the link.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to create room', 'error');
    } finally { setLoading(false); }
  };

  const copyLink = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(created.url);
    setCopied(true); addToast('Link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  /* ---- CREATED VIEW ---- */
  if (created) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Check size={22} color="var(--success)" />
        </div>
        <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)' }}>Room Ready</p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Share the link — the key is embedded in it</p>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Room Code</p>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '32px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.12em' }}>{created.roomCode}</span>
      </div>

      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-dim)', wordBreak: 'break-all', lineHeight: 1.6 }}>
        {created.url}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={copyLink}>
          {copied ? <><Check size={14} />Copied!</> : <><Copy size={14} />Copy Link</>}
        </button>
        <button className="btn-primary" style={{ flex: 1 }} onClick={() => { window.location.href = created.url; }}>
          Enter Room
        </button>
      </div>

      <button onClick={() => setCreated(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
        Create another room
      </button>
    </div>
  );

  /* ---- CREATE VIEW ---- */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Room type */}
      <div>
        <label className="label">Room type</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { val: 'private', title: 'Private', sub: '2 people only' },
            { val: 'group',   title: 'Group',   sub: 'Up to 10 people' },
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => { setMode(opt.val); setMaxMembers(opt.val === 'private' ? 2 : 5); }}
              style={{
                padding: '14px 12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                background: mode === opt.val ? 'var(--accent-dim)' : 'var(--surface-2)',
                border: `1px solid ${mode === opt.val ? 'var(--accent-border)' : 'var(--border)'}`,
                transition: 'all 0.15s ease',
              }}
            >
              <p style={{ fontSize: '14px', fontWeight: 600, color: mode === opt.val ? 'var(--accent)' : 'var(--text)', marginBottom: '2px' }}>{opt.title}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{opt.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Group member count */}
      {mode === 'group' && (
        <div>
          <label className="label">Max members: <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>{maxMembers}</span></label>
          <input type="range" min={3} max={10} value={maxMembers} onChange={e => setMaxMembers(Number(e.target.value))} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>3</span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>10</span>
          </div>
        </div>
      )}

      {/* Duration */}
      <div>
        <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={12} /> Duration: <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>{fmtDuration(duration)}</span>
        </label>

        {/* Preset chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setDuration(p.value)}
              style={{
                padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                background: duration === p.value ? 'var(--accent)' : 'var(--surface-2)',
                color: duration === p.value ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${duration === p.value ? 'var(--accent)' : 'var(--border)'}`,
                transition: 'all 0.15s ease',
              }}
            >{p.label}</button>
          ))}
        </div>

        <input type="range" min={1} max={1440} value={duration} onChange={e => setDuration(Number(e.target.value))} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>1 min</span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>24 hours</span>
        </div>
      </div>

      <button className="btn-primary" onClick={handleCreate} disabled={loading}>
        {loading
          ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>Creating...</>
          : <><Plus size={15} /> Create Room</>}
      </button>
    </div>
  );
}
