import { useState } from 'react';
import { ArrowRight, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { isValidRoomCode } from '../../lib/userIdGenerator';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';

export default function JoinRoom() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { userId } = useUser();
  const { addToast } = useToast();

  const handleJoinByCode = async () => {
    if (loading) return;
    const c = code.trim().toLowerCase();
    if (!isValidRoomCode(c)) { addToast('Invalid code — 6 alphanumeric characters required', 'error'); return; }
    setLoading(true);
    try {
      const { data: room, error } = await supabase.from('rooms').select('*').eq('room_code', c).eq('is_active', true).single();
      if (error || !room) { addToast('Room not found or expired', 'error'); setLoading(false); return; }
      if (room.expires_at && new Date(room.expires_at) < new Date()) { addToast('This room has expired', 'error'); setLoading(false); return; }
      const { count } = await supabase.from('room_members').select('*', { count: 'exact', head: true }).eq('room_id', room.id);
      if (count >= room.max_members) { addToast('Room is full', 'error'); setLoading(false); return; }
      await supabase.from('room_members').upsert({ room_id: room.id, user_id: userId, is_online: true }, { onConflict: 'room_id,user_id' });
      addToast('Joined room successfully!', 'success');
      window.location.href = `/room/${c}`;
    } catch (err) {
      addToast(err.message || 'Failed to join room', 'error');
    } finally { setLoading(false); }
  };

  const handlePasteLink = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const match = text.match(/\/room\/([a-zA-Z0-9]{6})(#.*)?/);
      if (match) {
        window.location.href = `/room/${match[1]}${match[2] || ''}`;
      } else {
        addToast('No valid room link found in clipboard', 'warning');
      }
    } catch {
      addToast('Cannot read clipboard — enter room code manually below', 'warning');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Primary: Room Code Input */}
      <div>
        <label className="label">Enter 6-Char Room Code</label>
        <input
          className="input-field font-mono"
          style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '0.2em', fontWeight: 700 }}
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
          placeholder="a1b2c3"
          maxLength={6}
          onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
        />
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
          Enter the code provided by the room creator
        </p>
      </div>

      <button className="btn-primary" onClick={handleJoinByCode} disabled={loading || code.length < 6}>
        {loading
          ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>Joining Room...</>
          : <>Join Room <ArrowRight size={15} /></>}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>or</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      {/* Secondary: Paste full link */}
      <button className="btn-ghost" onClick={handlePasteLink} style={{ gap: '8px' }}>
        <LinkIcon size={15} /> Paste Invite Link from Clipboard
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', color: 'var(--accent)', fontSize: '12px', opacity: 0.85 }}>
        <ShieldCheck size={14} /> End-to-End Encrypted via Web Crypto API
      </div>
    </div>
  );
}
