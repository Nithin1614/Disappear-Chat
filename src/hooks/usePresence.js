import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { generateFingerprint } from './useDeviceFingerprint';

// --- Minimal AES-GCM encrypt/decrypt for typing payloads ---
async function encryptTypingPayload(obj, cryptoKey) {
  if (!cryptoKey) return null;
  try {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      enc.encode(JSON.stringify(obj))
    );
    const toB64 = (buf) => {
      const b = new Uint8Array(buf);
      let s = '';
      for (let i = 0; i < b.byteLength; i++) s += String.fromCharCode(b[i]);
      return btoa(s);
    };
    return { enc: toB64(encrypted), iv: toB64(iv.buffer) };
  } catch { return null; }
}

async function decryptTypingPayload(payload, cryptoKey) {
  if (!cryptoKey || !payload?.enc || !payload?.iv) return null;
  try {
    const fromB64 = (b64) => {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes.buffer;
    };
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(fromB64(payload.iv)) },
      cryptoKey,
      fromB64(payload.enc)
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch { return null; }
}

/**
 * Presence hook for tracking online members and typing indicators.
 *
 * Enhancements over v1:
 *  - Feature 2: Typing indicator payloads are AES-256-GCM encrypted (if cryptoKey provided)
 *  - Feature 3: Device fingerprint hash included in presence metadata for change detection
 *
 * @param {string} roomId
 * @param {string} userId
 * @param {string} displayName
 * @param {CryptoKey|null} cryptoKey - Session key for encrypting typing signals
 * @param {function} onFingerprintChange - Called when a participant's fingerprint changes
 */
export function usePresence(roomId, userId, displayName = '', cryptoKey = null, onFingerprintChange = null) {
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const fingerprintRef = useRef(null);
  const peerFingerprintsRef = useRef({}); // userId -> fingerprint hash

  // Generate fingerprint once on mount
  useEffect(() => {
    generateFingerprint().then(fp => { fingerprintRef.current = fp; });
  }, []);

  useEffect(() => {
    if (!roomId || !userId) return;

    isSubscribedRef.current = false;

    const channel = supabase.channel(`presence:${roomId}`, {
      config: { presence: { key: userId } },
    });

    // Encrypted typing signals via broadcast
    channel.on('broadcast', { event: 'typing_signal' }, async ({ payload }) => {
      if (!payload || payload.from === userId) return;
      let data = null;
      if (payload.encrypted && cryptoKey) {
        data = await decryptTypingPayload(payload.encrypted, cryptoKey);
      } else if (payload.plain) {
        // Fallback if no session key yet
        data = payload.plain;
      }
      if (!data) return;

      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.user_id !== data.user_id);
        if (data.is_typing) return [...filtered, { user_id: data.user_id, display_name: data.display_name }];
        return filtered;
      });
    });

    const syncState = () => {
      const state = channel.presenceState();
      const members = [];

      Object.entries(state).forEach(([key, presences]) => {
        if (presences && presences.length > 0) {
          const latest = presences[presences.length - 1];

          // Feature 3: Detect fingerprint change
          const fp = latest.fingerprint;
          if (fp && key !== userId) {
            const prevFp = peerFingerprintsRef.current[key];
            if (prevFp && prevFp !== fp) {
              onFingerprintChange && onFingerprintChange({
                userId: key,
                displayName: latest.display_name || key,
              });
            }
            peerFingerprintsRef.current[key] = fp;
          }

          members.push({
            user_id: key,
            display_name: latest.display_name || key,
            is_online: true,
            is_typing: false, // typing is now handled via broadcast, not presence
          });
        }
      });

      setOnlineMembers(members);
    };

    channel
      .on('presence', { event: 'sync' }, syncState)
      .on('presence', { event: 'join' }, syncState)
      .on('presence', { event: 'leave' }, syncState)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
          await channel.track({
            user_id: userId,
            display_name: displayName || userId,
            is_online: true,
            joined_at: new Date().toISOString(),
            fingerprint: fingerprintRef.current || '',
          });
        }
      });

    channelRef.current = channel;

    return () => {
      isSubscribedRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, userId, displayName, cryptoKey, onFingerprintChange]);

  const trackTyping = useCallback(
    async (isTyping) => {
      if (!channelRef.current || !isSubscribedRef.current) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      const typingData = {
        user_id: userId,
        display_name: displayName || userId,
        is_typing: isTyping,
      };

      // Feature 2: Encrypt typing signal if session key available
      let broadcastPayload = { from: userId };
      if (cryptoKey) {
        const encrypted = await encryptTypingPayload(typingData, cryptoKey);
        broadcastPayload.encrypted = encrypted;
      } else {
        broadcastPayload.plain = typingData;
      }

      channelRef.current.send({
        type: 'broadcast',
        event: 'typing_signal',
        payload: broadcastPayload,
      });

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          if (channelRef.current && isSubscribedRef.current) {
            const stopData = { user_id: userId, display_name: displayName || userId, is_typing: false };
            (async () => {
              let stopPayload = { from: userId };
              if (cryptoKey) {
                stopPayload.encrypted = await encryptTypingPayload(stopData, cryptoKey);
              } else {
                stopPayload.plain = stopData;
              }
              channelRef.current.send({ type: 'broadcast', event: 'typing_signal', payload: stopPayload });
            })();
          }
        }, 3000);
      }
    },
    [userId, displayName, cryptoKey]
  );

  return { onlineMembers, typingUsers, trackTyping };
}
