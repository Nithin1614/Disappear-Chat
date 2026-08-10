import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const KEY_ROTATION_MS = 5 * 60 * 1000; // 5 minutes

async function generateEphemeralKey() {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function exportKeyToBase64(cryptoKey) {
  const raw = await crypto.subtle.exportKey('raw', cryptoKey);
  const bytes = new Uint8Array(raw);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function importKeyFromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return crypto.subtle.importKey('raw', bytes.buffer, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function encryptSessionKeyPayload(sessionKeyBase64, baseKey) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, baseKey, enc.encode(sessionKeyBase64));
  const toBase64 = (buf) => { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.byteLength; i++) s += String.fromCharCode(b[i]); return btoa(s); };
  return { encryptedKey: toBase64(encrypted), iv: toBase64(iv.buffer) };
}

async function decryptSessionKeyPayload(encryptedKey, iv, baseKey) {
  const fromBase64 = (b64) => { const bin = atob(b64); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return bytes.buffer; };
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(fromBase64(iv)) }, baseKey, fromBase64(encryptedKey));
  return new TextDecoder().decode(decrypted);
}

/**
 * useForwardSecrecy — manages per-session ephemeral AES-256-GCM keys.
 *
 * FIX: Now exports `epochCacheVersion` (a counter that increments whenever
 * a new key is added to the cache). ChatPage's decryption effect depends on
 * this counter, so it re-runs automatically when late-joiner keys arrive.
 *
 * FIX: `request_session_key` handshake — when a late-joiner subscribes they
 * broadcast this event, and any already-present participant re-sends their
 * current key so the late-joiner can decrypt already-stored messages.
 */
export function useForwardSecrecy(roomId, userId, baseKey) {
  const [sessionKey, setSessionKey] = useState(null);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [isReady, setIsReady] = useState(false);
  // *** KEY FIX: version counter that ticks every time a key is added to cache ***
  const [epochCacheVersion, setEpochCacheVersion] = useState(0);

  const epochKeyCacheRef = useRef(new Map()); // epoch -> CryptoKey
  const channelRef = useRef(null);
  const rotationTimerRef = useRef(null);
  const onRotateCallbackRef = useRef(null);

  // Stable refs so channel callbacks always see latest values without stale closures
  const currentEpochRef = useRef(0);
  const currentSessionKeyRef = useRef(null);
  useEffect(() => { currentEpochRef.current = currentEpoch; }, [currentEpoch]);
  useEffect(() => { currentSessionKeyRef.current = sessionKey; }, [sessionKey]);

  // Helper: add key to cache AND bump version so decryption effect re-runs
  const cacheKey = useCallback((epoch, key) => {
    epochKeyCacheRef.current.set(epoch, key);
    setEpochCacheVersion(v => v + 1); // *** triggers re-decryption in ChatPage ***
  }, []);

  const broadcastCurrentKey = useCallback(async (broadcastChannel) => {
    if (!baseKey || !broadcastChannel || !currentSessionKeyRef.current || !currentEpochRef.current) return;
    try {
      const keyB64 = await exportKeyToBase64(currentSessionKeyRef.current);
      const { encryptedKey, iv } = await encryptSessionKeyPayload(keyB64, baseKey);
      broadcastChannel.send({
        type: 'broadcast',
        event: 'session_key_rotate',
        payload: { encryptedKey, iv, epoch: currentEpochRef.current, from: userId },
      });
    } catch (err) {
      console.error('[ForwardSecrecy] Failed to re-broadcast key:', err);
    }
  }, [baseKey, userId]);

  const rotateKey = useCallback(async (broadcastChannel) => {
    if (!baseKey || !broadcastChannel) return;
    try {
      const newKey = await generateEphemeralKey();
      const newKeyB64 = await exportKeyToBase64(newKey);
      const newEpoch = Date.now();

      const { encryptedKey, iv } = await encryptSessionKeyPayload(newKeyB64, baseKey);
      broadcastChannel.send({
        type: 'broadcast',
        event: 'session_key_rotate',
        payload: { encryptedKey, iv, epoch: newEpoch, from: userId },
      });

      // Prune old keys (keep 2 rotation windows)
      const cutoff = newEpoch - KEY_ROTATION_MS * 2;
      for (const [ep] of epochKeyCacheRef.current) {
        if (ep < cutoff) epochKeyCacheRef.current.delete(ep);
      }

      cacheKey(newEpoch, newKey); // bumps epochCacheVersion

      currentEpochRef.current = newEpoch;
      currentSessionKeyRef.current = newKey;

      setSessionKey(newKey);
      setCurrentEpoch(newEpoch);
      setIsReady(true);

      if (onRotateCallbackRef.current) onRotateCallbackRef.current();
    } catch (err) {
      console.error('[ForwardSecrecy] Key rotation failed:', err);
    }
  }, [baseKey, userId, cacheKey]);

  const onRotate = useCallback((cb) => {
    onRotateCallbackRef.current = cb;
  }, []);

  useEffect(() => {
    if (!roomId || !userId || !baseKey) return;
    let cancelled = false;

    const channel = supabase.channel(`fs:${roomId}`, {
      config: { broadcast: { self: false } },
    });

    // Receive session key from any peer (rotation or handshake response)
    channel.on('broadcast', { event: 'session_key_rotate' }, async ({ payload }) => {
      if (cancelled || !payload || payload.from === userId) return;
      try {
        const decryptedKeyB64 = await decryptSessionKeyPayload(payload.encryptedKey, payload.iv, baseKey);
        const importedKey = await importKeyFromBase64(decryptedKeyB64);

        // Always cache — even older epochs — so late joiners can decrypt past msgs
        cacheKey(payload.epoch, importedKey); // *** bumps epochCacheVersion ***

        if (!cancelled && payload.epoch >= currentEpochRef.current) {
          currentSessionKeyRef.current = importedKey;
          currentEpochRef.current = payload.epoch;
          setSessionKey(importedKey);
          setCurrentEpoch(payload.epoch);
          setIsReady(true);
        }
      } catch (err) {
        console.error('[ForwardSecrecy] Failed to receive peer key:', err);
      }
    });

    // Late-joiner handshake: peer asks for the current key
    channel.on('broadcast', { event: 'request_session_key' }, async ({ payload }) => {
      if (cancelled || !payload || payload.from === userId) return;
      await broadcastCurrentKey(channel);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && !cancelled) {
        channelRef.current = channel;
        // Generate and broadcast our own key
        await rotateKey(channel);
        // Also request any existing peer's key (we might be the late joiner)
        channel.send({ type: 'broadcast', event: 'request_session_key', payload: { from: userId } });
        // Schedule key rotation every 5 minutes
        rotationTimerRef.current = setInterval(() => rotateKey(channel), KEY_ROTATION_MS);
      }
    });

    return () => {
      cancelled = true;
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, userId, baseKey, rotateKey, broadcastCurrentKey, cacheKey]);

  return {
    sessionKey,
    currentEpoch,
    epochKeyCache: epochKeyCacheRef.current,
    epochCacheVersion, // *** new: lets ChatPage react when new keys arrive ***
    isReady,
    onRotate,
  };
}
