import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Share2, AlertTriangle, ArrowLeft, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { useEncryption } from '../hooks/useEncryption';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';
import { usePresence } from '../hooks/usePresence';
import { useCountdown } from '../hooks/useCountdown';
import { useNotificationSound } from '../hooks/useNotificationSound';
import { useFileUpload } from '../hooks/useFileUpload';
import { useThanosSnap } from '../hooks/useThanosSnap';
import { SUPPORTED_IMAGE_TYPES, TIMER_WARNING_SECONDS } from '../lib/constants';
import Header from '../components/ui/Header';
import MessageBubble from '../components/chat/MessageBubble';
import MessageInput from '../components/chat/MessageInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import DragDropZone from '../components/chat/DragDropZone';
import MemberList from '../components/chat/MemberList';
import CountdownBadge from '../components/timer/CountdownBadge';
import ExtendTimeVote from '../components/timer/ExtendTimeVote';
import QRCodeModal from '../components/room/QRCodeModal';
import ThanosSnap from '../components/effects/ThanosSnap';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function ChatPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { userId, displayName, isAuthenticated } = useUser();
  const { addToast } = useToast();

  // Room state
  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState(null);

  // UI state
  const [showQR, setShowQR] = useState(false);
  const [showExtendVote, setShowExtendVote] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState({});
  const [decryptedImages, setDecryptedImages] = useState({});
  const [snapTriggered, setSnapTriggered] = useState(false);
  const [warningShown, setWarningShown] = useState(false);

  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  // --- All hooks (features preserved) ---
  const { encrypt, decrypt, encryptFile: encryptFileHook, keyLoaded, error: keyError } = useEncryption();
  const { messages, sendMessage, loading: messagesLoading } = useRealtimeMessages(room?.id);
  const { onlineMembers, typingUsers, trackTyping } = usePresence(room?.id, userId, displayName);
  const countdown = useCountdown(room?.expires_at, room?.duration_minutes);
  const { playSound, isTabFocused } = useNotificationSound();
  const { downloadFile } = useFileUpload(room?.id);
  const { triggerSnap } = useThanosSnap();

  // Redirect if unauthenticated
  useEffect(() => { if (!isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  // Fetch room
  useEffect(() => {
    if (!roomCode) return;
    let pollInterval;

    async function fetchRoom() {
      setRoomLoading(true);
      const { data, error } = await supabase
        .from('rooms').select('*').eq('room_code', roomCode).eq('is_active', true).single();
      if (error || !data) { setRoomError('Room not found or has expired.'); setRoomLoading(false); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setRoomError('This room has expired.'); setRoomLoading(false); return; }
      setRoom(data);
      setRoomLoading(false);
      if (userId) {
        await supabase.from('room_members').upsert(
          { room_id: data.id, user_id: userId, is_online: true },
          { onConflict: 'room_id,user_id' }
        );
      }
    }

    fetchRoom();
    pollInterval = setInterval(async () => {
      const { data } = await supabase.from('rooms').select('*').eq('room_code', roomCode).single();
      if (data) setRoom(data);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [roomCode, userId]);

  // Decrypt messages as they arrive
  useEffect(() => {
    if (!keyLoaded || !messages.length) return;
    (async () => {
      const updated = { ...decryptedMessages };
      for (const msg of messages) {
        if (updated[msg.id]) continue;
        try {
          if (msg.encrypted_content && msg.iv) updated[msg.id] = await decrypt(msg.encrypted_content, msg.iv);
        } catch { updated[msg.id] = '[Decryption failed]'; }
      }
      setDecryptedMessages(updated);
    })();
  }, [messages, keyLoaded, decrypt]);

  // Sound for new messages from others
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const latest = messages[messages.length - 1];
      if (latest && latest.sender_id !== userId && !isTabFocused) playSound();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, isTabFocused, userId, playSound]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, decryptedMessages]);

  // Mark messages as read
  useEffect(() => {
    if (!room?.id || !userId || !messages.length) return;
    const unread = messages.filter(m => m.sender_id !== userId && !m.is_read);
    if (!unread.length) return;
    const t = setTimeout(async () => {
      await supabase.from('messages').update({ is_read: true }).in('id', unread.map(m => m.id));
    }, 1500);
    return () => clearTimeout(t);
  }, [messages, room?.id, userId]);

  // Timer warning toast
  useEffect(() => {
    if (countdown.timerStarted && countdown.totalSeconds <= TIMER_WARNING_SECONDS && countdown.totalSeconds > 0 && !warningShown) {
      setWarningShown(true);
      addToast('⚠️ Less than 1 minute remaining!', 'warning');
    }
  }, [countdown, warningShown, addToast]);

  // Thanos snap on expiry — triggers canvas particle disintegration then overlay
  useEffect(() => {
    if (countdown.isExpired && countdown.timerStarted && !snapTriggered) {
      setSnapTriggered(true);
      if (chatContainerRef.current) {
        triggerSnap(chatContainerRef.current, () => {});
      }
    }
  }, [countdown.isExpired, countdown.timerStarted, snapTriggered, triggerSnap]);

  // Send text
  const handleSendMessage = useCallback(async (text) => {
    if (!keyLoaded || !room?.id) return;
    const { ciphertext, iv } = await encrypt(text);
    await sendMessage({ encryptedContent: ciphertext, iv, type: 'text', senderId: userId });
  }, [keyLoaded, room?.id, encrypt, sendMessage, userId]);

  // Send file (encrypted)
  const handleSendFile = useCallback(async (file) => {
    if (!keyLoaded || !room?.id) return;
    try {
      const isImg = SUPPORTED_IMAGE_TYPES.includes(file.type);
      const buf = await file.arrayBuffer();
      const { encryptedData, iv: fileIv } = await encryptFileHook(buf);
      const fileId = crypto.randomUUID();
      const filePath = `${room.id}/${fileId}.enc`;
      const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
      const { error: upErr } = await supabase.storage.from('room-files').upload(filePath, blob, { contentType: 'application/octet-stream' });
      if (upErr) throw upErr;
      const caption = isImg ? '📷 Image' : `📎 ${file.name}`;
      const { ciphertext, iv } = await encrypt(caption);
      await sendMessage({ encryptedContent: ciphertext, iv, type: isImg ? 'image' : 'file', senderId: userId, fileUrl: filePath, fileName: file.name, fileSize: file.size });
      addToast('File sent!', 'success');
    } catch (err) { addToast(err.message || 'Failed to send file', 'error'); throw err; }
  }, [keyLoaded, room?.id, encryptFileHook, encrypt, sendMessage, userId, addToast]);

  // Download file
  const handleDownloadFile = useCallback(async (message) => {
    try {
      addToast('Downloading & decrypting…', 'info');
      await downloadFile(message.file_url, message.iv, null, message.file_name);
    } catch (err) { addToast(err.message || 'Download failed', 'error'); }
  }, [downloadFile, addToast]);

  // Drag-drop
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleSendFile(f); };
  const handleTyping = useCallback(() => trackTyping(true), [trackTyping]);

  const roomUrl = `${window.location.origin}/room/${roomCode}${window.location.hash}`;

  // ── Loading state ──
  if (roomLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner size="lg" text="Connecting to room…" />
    </div>
  );

  // ── Error state ──
  if (roomError) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '24px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertTriangle size={26} color="var(--warning)" />
      </div>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{roomError}</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>The room may have expired or the link is invalid.</p>
      </div>
      <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={15} /> Back to Dashboard
      </button>
    </div>
  );

  // ── No encryption key ──
  if (!keyLoaded) {
    const handlePasteLink = async () => {
      try {
        const text = await navigator.clipboard.readText();
        const match = text.match(/\/room\/([a-zA-Z0-9]{6})(#.*)?/);
        if (match && match[2] && match[2].includes('key=')) {
          window.location.href = `/room/${match[1]}${match[2]}`;
        } else {
          addToast('No encryption key found in clipboard link', 'warning');
        }
      } catch {
        addToast('Cannot read clipboard — paste the full link in the address bar', 'warning');
      }
    };

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '12px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={26} color="var(--accent)" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Encryption key needed</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.6 }}>
              This room uses end-to-end encryption. The decryption key is embedded in the full invite link — it's never stored on the server.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '320px' }}>
            <button className="btn-primary" onClick={handlePasteLink}>
              Paste Full Invite Link
            </button>
            <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={15} /> Back to Dashboard
            </button>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '340px', lineHeight: 1.5 }}>
            Ask the room creator to share the invite link. It looks like:<br />
            <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-dim)' }}>
              vanishchat.app/room/abc123#key=...
            </code>
          </p>
        </div>
      </div>
    );
  }

  // ── Main Chat UI ──
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <Header />

      {/* Countdown badge (floating) — Thanos snap triggers when expired */}
      <CountdownBadge countdown={countdown} onExtendClick={() => setShowExtendVote(true)} />

      {/* Chat container */}
      <div
        ref={chatContainerRef}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '860px', width: '100%', margin: '0 auto', position: 'relative', overflow: 'hidden' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Chat header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate('/dashboard')} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <ArrowLeft size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={16} color="var(--accent)" />
              </div>
              <div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.08em' }}>{roomCode}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {onlineMembers.length} online · End-to-end encrypted
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            <button
              onClick={() => setShowQR(true)}
              title="Share room link"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <Share2 size={14} /> Invite
            </button>
            <MemberList members={onlineMembers} isOpen={showMembers} onToggle={() => setShowMembers(v => !v)} />
          </div>
        </div>

        {/* Drag-drop overlay */}
        <DragDropZone isDragging={isDragging} />

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '16px', paddingBottom: '8px' }}>
          {messagesLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <LoadingSpinner text="Loading messages…" />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px', textAlign: 'center', padding: '24px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={22} color="var(--text-dim)" />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>No messages yet</p>
                <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Send the first message to start the countdown timer</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '100px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
                <Lock size={12} color="var(--accent)" />
                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500 }}>All messages are end-to-end encrypted</span>
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isSender={msg.sender_id === userId}
                decryptedContent={decryptedMessages[msg.id]}
                decryptedImageUrl={decryptedImages[msg.id]}
                onDownloadFile={handleDownloadFile}
              />
            ))
          )}

          <TypingIndicator typingUsers={typingUsers} />
          <div ref={messagesEndRef} style={{ height: '8px' }} />
        </div>

        {/* Input bar */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
          onTyping={handleTyping}
          disabled={countdown.isExpired}
        />
      </div>

      {/* Modals */}
      {showQR && <QRCodeModal url={roomUrl} roomCode={roomCode} onClose={() => setShowQR(false)} />}

      {showExtendVote && room && (
        <ExtendTimeVote
          roomId={room.id}
          userId={userId}
          memberCount={onlineMembers.length || 1}
          onClose={() => setShowExtendVote(false)}
        />
      )}

      {/* Thanos snap overlay — shown after canvas disintegration animation completes */}
      <ThanosSnap isExpired={snapTriggered} onRedirect={() => navigate('/dashboard')} />
    </div>
  );
}
