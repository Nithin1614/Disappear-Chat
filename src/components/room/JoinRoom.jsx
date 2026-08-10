import { useState } from 'react';
import { ArrowRight, Link as LinkIcon, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { isValidRoomCode } from '../../lib/userIdGenerator';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';

export default function JoinRoom() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { userId } = useUser();
  const { addToast } = useToast();

  // Join by full invite link (preserves the #key= hash)
  const handlePasteLink = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const match = text.match(/\/room\/([a-zA-Z0-9]{6})(#.*)?/);
      if (match) {
        // Use window.location.href so the hash (#key=...) is preserved
        window.location.href = `/room/${match[1]}${match[2] || ''}`;
      } else {
        addToast('No valid VanishChat link found in clipboard', 'warning');
      }
    } catch {
      addToast('Cannot read clipboard — please paste the full link manually', 'warning');
    }
  };

  // Join by code only — registers membership but user still needs the full link to decrypt
  const handleJoinByCode = async () => {
    if (loading) return;
    const c = code.trim().toLowerCase();
    if (!isValidRoomCode(c)) { addToast('Invalid code — must be 6 alphanumeric characters', 'error'); return; }
    setLoading(true);
    try {
      const { data: room, error } = await supabase.from('rooms').select('*').eq('room_code', c).eq('is_active', true).single();
      if (error || !room) { addToast('Room not found or expired', 'error'); setLoading(false); return; }
      if (room.expires_at && new Date(room.expires_at) < new Date()) { addToast('Room has expired', 'error'); setLoading(false); return; }
      const { count } = await supabase.from('room_members').select('*', { count: 'exact', head: true }).eq('room_id', room.id);
      if (count >= room.max_members) { addToast('Room is full', 'error'); setLoading(false); return; }
      await supabase.from('room_members').upsert({ room_id: room.id, user_id: userId, is_online: true }, { onConflict: 'room_id,user_id' });
      addToast('Room found! Ask the creator for the full invite link to read messages.', 'info');
      // Navigate using window.location so hash is NOT artificially added
      // The chat page will show a friendly "no key" screen
      window.location.href = `/room/${c}`;
    } catch (err) {
      addToast(err.message || 'Failed to join', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Info banner */}
      <div style={{ display: 'flex', gap: '10px', padding: '12px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: '10px' }}>
        <Info size={15} color="var(--accent)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text)' }}>Best way to join:</strong> Use the full invite link from the room creator — it contains the encryption key so you can read messages.
        </p>
      </div>

      {/* Paste full link */}
      <div>
        <label className="label">Join with invite link</label>
        <button className="btn-primary" onClick={handlePasteLink} style={{ gap: '8px' }}>
          <LinkIcon size={15} /> Paste Invite Link from Clipboard
        </button>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
          Pastes the full link (with encryption key) from your clipboard
        </p>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>or join by code</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      {/* Code input */}
      <div>
        <label className="label">Room code only</label>
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
          ⚠️ Without the full link you won't be able to read encrypted messages
        </p>
      </div>

      <button className="btn-ghost" onClick={handleJoinByCode} disabled={loading || code.length < 6}>
        {loading
          ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>Joining...</>
          : <>Join by Code <ArrowRight size={15} /></>}
      </button>
    </div>
  );
}
