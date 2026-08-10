import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Share2, AlertTriangle, ArrowLeft, Lock, Bell, BellOff, Fingerprint, Clock } from 'lucide-react';
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
import { useForwardSecrecy } from '../hooks/useForwardSecrecy';
import { useDeadManSwitch } from '../hooks/useDeadManSwitch';
import { useClipboardAutoClear } from '../hooks/useClipboardAutoClear';
import { useAccessLock } from '../hooks/useAccessLock';
import { useMultiTabProtection } from '../hooks/useMultiTabProtection';
import { SUPPORTED_IMAGE_TYPES, TIMER_WARNING_SECONDS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../lib/constants';
import Header from '../components/ui/Header';
import MessageBubble from '../components/chat/MessageBubble';
import MessageInput from '../components/chat/MessageInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import DragDropZone from '../components/chat/DragDropZone';
import MemberList from '../components/chat/MemberList';
import CountdownBadge from '../components/timer/CountdownBadge';
import ExtendTimeVote from '../components/timer/ExtendTimeVote';
import ExtendVoteBanner from '../components/timer/ExtendVoteBanner';
import QRCodeModal from '../components/room/QRCodeModal';
import ThanosSnap from '../components/effects/ThanosSnap';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ScreenshotGuard from '../components/ui/ScreenshotGuard';
import AccessLockOverlay from '../components/ui/AccessLockOverlay';
import MultiTabBlockScreen from '../components/ui/MultiTabBlockScreen';

export default function ChatPage() {
  const { roomCode } = useParams();
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
  const [showGraceBanner, setShowGraceBanner] = useState(false);
  const [partnerLeftToast, setPartnerLeftToast] = useState(false);
  // Security feature state
  const [fingerprintWarning, setFingerprintWarning] = useState(null); // { userId, displayName }
  const [dmsCountdown, setDmsCountdown] = useState(0); // Dead Man Switch final countdown

  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMessageCountRef = useRef(0);
  const prevMemberCountRef = useRef(0);

  // --- Core Hooks ---
  const { encrypt, decrypt, encryptFile: encryptFileHook, keyLoaded, cryptoKey, error: keyError } = useEncryption(roomCode);
  const { messages, sendMessage, loading: messagesLoading } = useRealtimeMessages(room?.id);
  const { playSound, isTabFocused, isMuted, toggleMute } = useNotificationSound();
  const { downloadFile, getDecryptedUrl } = useFileUpload(room?.id);
  const { triggerSnap } = useThanosSnap();

  // --- Feature 1: Forward Secrecy ---
  const {
    sessionKey,
    currentEpoch,
    epochKeyCache,
    epochCacheVersion, // ticks whenever a new epoch key is cached (late-joiner fix)
    isReady: fsReady,
    onRotate,
  } = useForwardSecrecy(room?.id, userId, cryptoKey);

  // Toast on key rotation (not first init)
  // Use ref so the onRotate callback registration is stable and doesn't re-fire on addToast identity change
  const isFirstRotationRef = useRef(true);
  const addToastRef = useRef(addToast);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);
  useEffect(() => {
    onRotate(() => {
      if (isFirstRotationRef.current) { isFirstRotationRef.current = false; return; }
      addToastRef.current('🔄 Session key rotated — forward secrecy maintained', 'info');
    });
  }, [onRotate]); // stable — no addToast dep needed

  // Effective encrypt/decrypt: use session key when available, fallback to base key
  const effectiveEncrypt = useCallback(async (plaintext) => {
    if (sessionKey) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder();
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sessionKey, enc.encode(plaintext));
      const toB64 = (buf) => { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.byteLength; i++) s += String.fromCharCode(b[i]); return btoa(s); };
      return { ciphertext: toB64(encrypted), iv: toB64(iv.buffer), epoch: currentEpoch };
    }
    return encrypt(plaintext);
  }, [sessionKey, currentEpoch, encrypt]);

  // Use a ref wrapper so effectiveDecrypt always sees the latest cache without
  // needing the Map object itself in the dependency array (Map refs are stable).
  const epochKeyCacheRef = useRef(epochKeyCache);
  useEffect(() => { epochKeyCacheRef.current = epochKeyCache; }, [epochKeyCache]);

  const effectiveDecrypt = useCallback(async (ciphertext, iv, epoch) => {
    const fromB64 = (b64) => {
      try {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes.buffer;
      } catch { return null; }
    };

    const tryDecrypt = async (key) => {
      if (!key) return null;
      try {
        const ivBuf = fromB64(iv);
        const ctBuf = fromB64(ciphertext);
        if (!ivBuf || !ctBuf) return null;
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: new Uint8Array(ivBuf) },
          key,
          ctBuf
        );
        return new TextDecoder().decode(decrypted);
      } catch { return null; }
    };

    // 1. Try matching epoch key if available (coercing String and Number representations)
    if (epoch) {
      const epochStr = String(epoch);
      const epochNum = Number(epoch);
      if (epochKeyCacheRef.current.has(epochStr)) {
        const res = await tryDecrypt(epochKeyCacheRef.current.get(epochStr));
        if (res !== null) return res;
      }
      if (!isNaN(epochNum) && epochKeyCacheRef.current.has(epochNum)) {
        const res = await tryDecrypt(epochKeyCacheRef.current.get(epochNum));
        if (res !== null) return res;
      }
    }

    // 2. Try current sessionKey
    if (sessionKey) {
      const res = await tryDecrypt(sessionKey);
      if (res !== null) return res;
    }

    // 3. Try all cached epoch keys
    for (const k of epochKeyCacheRef.current.values()) {
      const res = await tryDecrypt(k);
      if (res !== null) return res;
    }

    // 4. Try base room key (cryptoKey)
    return decrypt(ciphertext, iv);
  }, [sessionKey, decrypt]);

  // --- Feature 2 & 3: Presence with typing encryption + fingerprint detection ---
  const handleFingerprintChange = useCallback(({ userId: peerId, displayName: peerName }) => {
    setFingerprintWarning({ userId: peerId, displayName: peerName });
    addToast(`⚠️ ${peerName} appears to be on a different device`, 'warning');
  }, [addToast]);

  const { onlineMembers, typingUsers, trackTyping } = usePresence(
    room?.id, userId, displayName,
    sessionKey || cryptoKey, // use session key if available
    handleFingerprintChange
  );

  // --- Feature 4: Dead Man Switch ---
  // Stable callbacks using top-level useCallback so DMS useEffect never re-runs
  const onDmsWarn = useCallback(() => {
    addToast('⚠️ No activity detected — room closes in 30 seconds. Send a message to keep it alive.', 'warning');
  }, [addToast]);
  const onDmsCountdown = useCallback((secs) => setDmsCountdown(secs), []);
  const onDmsDestroy = useCallback(() => {
    addToast('Room auto-destroyed due to inactivity.', 'error');
    setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
  }, [addToast]);

  const { resetActivity: resetDmsActivity } = useDeadManSwitch({
    roomId: room?.id,
    userId,
    enabled: !!room?.id && keyLoaded,
    onWarn: onDmsWarn,
    onCountdown: onDmsCountdown,
    onDestroy: onDmsDestroy,
  });

  // --- Feature 5: Clipboard Auto-Clear ---
  const onClipboardCleared = useCallback(() => {
    addToast('📋 Clipboard cleared for security', 'info');
  }, [addToast]);
  useClipboardAutoClear(onClipboardCleared);

  // --- Feature 6: Access Lock ---
  const { isLocked, unlock } = useAccessLock();

  // --- Feature 7: Multi-Tab Protection ---
  const { isBlocked } = useMultiTabProtection(roomCode, userId);

  // Member lookup map (User ID -> Display Name)
  const memberMap = useMemo(() => {
    const map = {};
    onlineMembers.forEach(m => { map[m.user_id] = m.display_name || m.user_id; });
    return map;
  }, [onlineMembers]);

  const partner = useMemo(() => {
    return onlineMembers.find(m => m.user_id !== userId);
  }, [onlineMembers, userId]);

  const headerTitle = partner ? (partner.display_name || partner.user_id) : (displayName || `Room ${roomCode}`);
  const headerSubtitle = partner
    ? `Room: ${roomCode} · ID: ${partner.user_id}`
    : `Room: ${roomCode} · ID: ${userId}`;

  const countdown = useCountdown(room?.expires_at, room?.duration_minutes);

  // Auth redirect
  useEffect(() => { if (!isAuthenticated) window.location.href = '/'; }, [isAuthenticated]);

  // Fetch room details + poll
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
      try { sessionStorage.setItem('vanishchat_last_active_room', roomCode); } catch {}
      if (userId) {
        await supabase.from('room_members').upsert(
          { room_id: data.id, user_id: userId, is_online: true, display_name: displayName || userId },
          { onConflict: 'room_id,user_id' }
        );
      }
    }

    fetchRoom();
    pollInterval = setInterval(async () => {
      const { data } = await supabase.from('rooms').select('*').eq('room_code', roomCode).single();
      if (data) setRoom(data);
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [roomCode, userId, displayName]);

  // Mark offline on leave
  useEffect(() => {
    if (!room?.id || !userId) return;
    return () => {
      supabase.from('room_members').update({ is_online: false }).eq('room_id', room.id).eq('user_id', userId).then(() => {});
    };
  }, [room?.id, userId]);

  // Track partner connection status gently without kicking user
  useEffect(() => {
    if (!room || room.max_members !== 2) return;
    const count = onlineMembers.length;
    prevMemberCountRef.current = count;
  }, [onlineMembers, room]);

  // Decrypt text messages — retry whenever keys, messages, or epoch cache version change
  // epochCacheVersion ticks each time a new key is added (late-joiner handshake fix)
  useEffect(() => {
    if (!keyLoaded || !messages.length) return;
    (async () => {
      let changed = false;
      const updated = { ...decryptedMessages };
      for (const msg of messages) {
        // Re-attempt any previously failed decryptions when new keys arrive
        if (updated[msg.id] && updated[msg.id] !== '[Decryption failed]') continue;
        try {
          if (msg.encrypted_content && msg.iv) {
            const dec = await effectiveDecrypt(msg.encrypted_content, msg.iv, msg.key_epoch || null);
            if (dec && updated[msg.id] !== dec) {
              updated[msg.id] = dec;
              changed = true;
            }
          }
        } catch {
          if (updated[msg.id] !== '[Decryption failed]') {
            updated[msg.id] = '[Decryption failed]';
            changed = true;
          }
        }
      }
      if (changed) setDecryptedMessages(updated);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, keyLoaded, effectiveDecrypt, sessionKey, epochCacheVersion]);

  // Decrypt inline images
  useEffect(() => {
    if (!keyLoaded || !cryptoKey || !messages.length) return;
    (async () => {
      const updated = { ...decryptedImages };
      for (const msg of messages) {
        if (msg.type !== 'image' || updated[msg.id] || !msg.file_url) continue;
        try {
          const fileIv = msg.file_iv || msg.iv;
          if (!fileIv) continue;
          const url = await getDecryptedUrl(msg.file_url, fileIv, cryptoKey, 'image/png');
          updated[msg.id] = url;
        } catch { /* decryption failed silently */ }
      }
      setDecryptedImages(updated);
    })();
  }, [messages, keyLoaded, cryptoKey, getDecryptedUrl]);

  // Sound notification
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

  // Warning toast (< 30 seconds)
  useEffect(() => {
    if (countdown.timerStarted && countdown.totalSeconds <= TIMER_WARNING_SECONDS && countdown.totalSeconds > 0 && !warningShown) {
      setWarningShown(true);
      addToast('🚨 LESS THAN 30 SECONDS REMAINING!', 'warning');
    }
  }, [countdown, warningShown, addToast]);

  // Grace period banner
  useEffect(() => {
    if (countdown.inGracePeriod && !showGraceBanner) {
      setShowGraceBanner(true);
    }
    if (!countdown.inGracePeriod && countdown.isExpired) {
      setShowGraceBanner(false);
    }
  }, [countdown.inGracePeriod, countdown.isExpired, showGraceBanner]);

  // Thanos snap trigger — only after grace period ends (disintegrates chat text in place, no black background)
  useEffect(() => {
    if (countdown.isExpired && countdown.timerStarted && !countdown.inGracePeriod && !snapTriggered) {
      setSnapTriggered(true);
      // Room expired — clear re-entry token so dashboard doesn't offer rejoin
      try { sessionStorage.removeItem('vanishchat_last_active_room'); } catch {}
      if (chatContainerRef.current) {
        triggerSnap(chatContainerRef.current, () => {
          window.location.href = '/dashboard';
        });
      }
    }
  }, [countdown.isExpired, countdown.timerStarted, countdown.inGracePeriod, snapTriggered, triggerSnap]);

  // Send text message — use forward secrecy session key when available
  const handleSendMessage = useCallback(async (text, burnAfterRead = false) => {
    if (!keyLoaded || !room?.id) {
      addToast('Room encryption key is initializing...', 'warning');
      return;
    }
    try {
      resetDmsActivity(); // Reset dead man switch on message send
      const result = await effectiveEncrypt(text);
      const { ciphertext, iv, epoch } = result;
      await sendMessage({ encryptedContent: ciphertext, iv, type: 'text', senderId: userId, burnAfterRead, keyEpoch: epoch || null });
    } catch (err) {
      console.error('[ChatPage] Message send error:', err);
      addToast(err.message || 'Failed to send message', 'error');
      throw err;
    }
  }, [keyLoaded, room?.id, effectiveEncrypt, sendMessage, userId, resetDmsActivity, addToast]);

  // Send file (with optional burn after read)
  const handleSendFile = useCallback(async (file, burnAfterRead = false) => {
    if (!keyLoaded || !room?.id) return;
    if (file.size > MAX_FILE_SIZE_BYTES) { addToast(`File too large. Max ${MAX_FILE_SIZE_MB}MB.`, 'error'); return; }
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
      // Pass fileIv properly so recipients can decrypt
      await sendMessage({
        encryptedContent: ciphertext, iv, type: isImg ? 'image' : 'file',
        senderId: userId, fileUrl: filePath, fileName: file.name, fileSize: file.size,
        fileIv,
        burnAfterRead,
      });
      addToast('File sent!', 'success');
    } catch (err) { addToast(err.message || 'Failed to send file', 'error'); }
  }, [keyLoaded, room?.id, encryptFileHook, encrypt, sendMessage, userId, addToast]);

  // Download file with real cryptoKey
  const handleDownloadFile = useCallback(async (message) => {
    if (!cryptoKey) { addToast('Encryption key not ready', 'error'); return; }
    try {
      addToast('Downloading & decrypting…', 'info');
      const fileIv = message.file_iv || message.iv;
      await downloadFile(message.file_url, fileIv, cryptoKey, message.file_name);
    } catch (err) { addToast(err.message || 'Download failed', 'error'); }
  }, [downloadFile, cryptoKey, addToast]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleSendFile(f); };
  const handleTyping = useCallback(() => { trackTyping(true); resetDmsActivity(); }, [trackTyping, resetDmsActivity]);

  // Scroll in messages resets dead man switch
  const handleMessagesScroll = useCallback(() => resetDmsActivity(), [resetDmsActivity]);

  const roomUrl = `${window.location.origin}/room/${roomCode}${window.location.hash}`;

  // Feature 7: Multi-tab block — show before anything else
  if (isBlocked) return <MultiTabBlockScreen roomCode={roomCode} />;

  if (roomLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner size="lg" text="Connecting to room…" />
    </div>
  );

  if (roomError) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '24px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertTriangle size={26} color="var(--danger)" />
      </div>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{roomError}</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>The room may have expired or the link is invalid.</p>
      </div>
      <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => window.location.href = '/dashboard'}>
        <ArrowLeft size={15} /> Back to Dashboard
      </button>
    </div>
  );

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
        addToast('Cannot read clipboard — paste the full link in your browser address bar', 'warning');
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
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Encryption Key Needed</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.6 }}>
              This room uses end-to-end encryption. The decryption key is embedded in the full invite link — it is never stored on the server.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '320px' }}>
            <button className="btn-primary" onClick={handlePasteLink}>
              Paste Full Invite Link
            </button>
            <button className="btn-ghost" onClick={() => window.location.href = '/dashboard'}>
              <ArrowLeft size={15} /> Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <Header />
      <ScreenshotGuard />

      {/* Main chat layout */}
      <div
        ref={chatContainerRef}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', maxWidth: '900px', width: '100%', margin: '0 auto', position: 'relative', overflow: 'hidden' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderBottom: '1px solid var(--border)',
          background: 'var(--surface)', flexShrink: 0, gap: '12px', flexWrap: 'wrap'
        }}>
          {/* Left info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <ArrowLeft size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={15} color="var(--accent)" />
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{headerTitle}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                  {headerSubtitle}{!countdown.isOnline ? ' · Offline' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Middle: Timer & Extend button */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CountdownBadge countdown={countdown} onExtendClick={() => setShowExtendVote(true)} />
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer',
                background: isMuted ? 'rgba(239,68,68,0.12)' : 'var(--surface-2)',
                border: isMuted ? '1px solid rgba(239,68,68,0.35)' : '1px solid var(--border)',
                color: isMuted ? 'var(--danger)' : 'var(--text-muted)', fontSize: '12px'
              }}
            >
              {isMuted ? <BellOff size={14} /> : <Bell size={14} />}
            </button>

            <button
              onClick={() => setShowQR(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontWeight: 600 }}
            >
              <Share2 size={14} /> Invite
            </button>
            <MemberList members={onlineMembers} isOpen={showMembers} onToggle={() => setShowMembers(v => !v)} />
          </div>
        </div>

        {/* Extension Vote Banner */}
        {room && (
          <ExtendVoteBanner
            roomId={room.id}
            userId={userId}
            memberCount={onlineMembers.length || 1}
            memberMap={memberMap}
          />
        )}

        {/* Feature 3: Device Fingerprint Warning Banner */}
        {fingerprintWarning && (
          <div style={{
            background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.35)',
            padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', zIndex: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Fingerprint size={14} color="#f59e0b" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b' }}>
                ⚠️ {fingerprintWarning.displayName} appears to be on a different device than when they joined.
              </span>
            </div>
            <button onClick={() => setFingerprintWarning(null)} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Feature 4: Dead Man Switch Final Countdown Banner */}
        {dmsCountdown > 0 && (
          <div style={{
            background: 'rgba(239,68,68,0.18)', borderBottom: '1px solid rgba(239,68,68,0.5)',
            padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', zIndex: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} color="var(--danger)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger)' }}>
                💤 Inactivity — room auto-destroys in {dmsCountdown}s. Type anything to cancel.
              </span>
            </div>
            <button
              onClick={() => { resetDmsActivity(); }}
              style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              Keep Alive
            </button>
          </div>
        )}

        {/* Grace Period Banner */}
        {showGraceBanner && countdown.inGracePeriod && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.4)',
            padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', zIndex: 25
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={15} color="var(--danger)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger)' }}>
                ⏳ Room expired — 30s grace period. Room ends in {countdown.graceSecondsLeft}s…
              </span>
            </div>
            <button
              onClick={() => setShowExtendVote(true)}
              style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              + Extend
            </button>
          </div>
        )}

        {/* Low timer warning banner (< 30s, still counting down) */}
        {countdown.isUnder30Sec && !countdown.inGracePeriod && (
          <div style={{
            background: 'rgba(239,68,68,0.15)', borderBottom: '1px solid rgba(239,68,68,0.4)',
            padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', zIndex: 25
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={15} color="var(--danger)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger)' }}>
                🚨 Warning: Less than 30 seconds remaining! Room will self-destruct soon.
              </span>
            </div>
            <button
              onClick={() => setShowExtendVote(true)}
              style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              + Extend Time
            </button>
          </div>
        )}

        {/* Offline indicator */}
        {!countdown.isOnline && (
          <div style={{ background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.3)', padding: '6px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>
            📵 You are offline — countdown continues locally. Messages will self-destruct on schedule.
          </div>
        )}

        {/* Drag-drop zone */}
        <DragDropZone isDragging={isDragging} />

        {/* Messages area — wrapped to allow lock overlay positioning */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div
            className="chat-messages-area"
            onScroll={handleMessagesScroll}
            style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: '16px', paddingBottom: '8px' }}
          >
            {/* Dialogue window when waiting for 2nd participant */}
            {onlineMembers.length < 2 && (
              <div style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--accent-border)',
                borderRadius: '14px',
                padding: '14px 18px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '10px',
                  background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Lock size={18} color="var(--accent)" />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', margin: '0 0 3px 0' }}>
                    🔒 End-to-End Encrypted Session
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                    Chat encryption begins when both participants join. The recipient will only see messages sent after they enter the room.
                  </p>
                </div>
              </div>
            )}

            {messagesLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                <LoadingSpinner text="Loading messages…" />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', gap: '12px', textAlign: 'center', padding: '24px' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={22} color="var(--text-dim)" />
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Encrypted Room Ready</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Send the first message to start the room countdown timer.</p>
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isSender={msg.sender_id === userId}
                  senderName={memberMap[msg.sender_id] || msg.sender_id}
                  decryptedContent={decryptedMessages[msg.id]}
                  decryptedImageUrl={decryptedImages[msg.id]}
                  onDownloadFile={handleDownloadFile}
                />
              ))
            )}

            <TypingIndicator typingUsers={typingUsers} />
            <div ref={messagesEndRef} style={{ height: '8px' }} />
          </div>

          {/* Feature 6: Access Lock Overlay */}
          {isLocked && <AccessLockOverlay onUnlock={unlock} />}
        </div>

        {/* Input */}
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

      {/* Thanos snap — redirects to Dashboard after disintegration */}
      <ThanosSnap isExpired={snapTriggered} onRedirect={() => window.location.href = '/dashboard'} />
    </div>
  );
}
