import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const KEY_ROTATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generates a fresh random AES-256-GCM ephemeral key.
 */
async function generateEphemeralKey() {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Exports a CryptoKey to raw base64.
 */
async function exportKeyToBase64(cryptoKey) {
  const raw = await crypto.subtle.exportKey('raw', cryptoKey);
  const bytes = new Uint8Array(raw);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * Imports a raw base64 string back to a CryptoKey.
 */
async function importKeyFromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return crypto.subtle.importKey(
    'raw',
    bytes.buffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a session key (base64) with the base room key (AES-GCM).
 */
async function encryptSessionKeyPayload(sessionKeyBase64, baseKey) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    baseKey,
    enc.encode(sessionKeyBase64)
  );
  const toBase64 = (buf) => {
    const b = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < b.byteLength; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  };
  return { encryptedKey: toBase64(encrypted), iv: toBase64(iv.buffer) };
}

/**
 * Decrypts a session key payload with the base room key.
 */
async function decryptSessionKeyPayload(encryptedKey, iv, baseKey) {
  const fromBase64 = (b64) => {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  };
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(fromBase64(iv)) },
    baseKey,
    fromBase64(encryptedKey)
  );
  return new TextDecoder().decode(decrypted);
}

/**
 * useForwardSecrecy — manages per-session ephemeral encryption keys.
 *
 * - On room entry: generates a new random AES-256-GCM session key
 * - Broadcasts it (encrypted under baseKey) to all room participants
 * - Rotates every 5 minutes — discarding old keys from memory after rotation
 * - Old epochs are cached for decrypting previously received messages
 *
 * FIX: Late joiners broadcast a `request_session_key` event so any already-present
 * participant can re-send their current key. This solves the "User A joins first,
 * sends a message, User B joins later and can't decrypt it" problem.
 *
 * @param {string} roomId - Supabase room ID
 * @param {string} userId - Current user ID
 * @param {CryptoKey|null} baseKey - The deterministic PBKDF2 room key
 * @returns {{ sessionKey: CryptoKey|null, epochKeyCache: Map, currentEpoch: number, isReady: boolean }}
 */
export function useForwardSecrecy(roomId, userId, baseKey) {
  const [sessionKey, setSessionKey] = useState(null);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const epochKeyCacheRef = useRef(new Map()); // epoch -> CryptoKey
  const channelRef = useRef(null);
  const rotationTimerRef = useRef(null);
  const onRotateCallbackRef = useRef(null);

  // Stable refs so callbacks inside channel handlers always see latest values
  const currentEpochRef = useRef(0);
  const currentSessionKeyRef = useRef(null);
  useEffect(() => { currentEpochRef.current = currentEpoch; }, [currentEpoch]);
  useEffect(() => { currentSessionKeyRef.current = sessionKey; }, [sessionKey]);

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

      // Encrypt and broadcast the new session key to peers
      const { encryptedKey, iv } = await encryptSessionKeyPayload(newKeyB64, baseKey);
      broadcastChannel.send({
        type: 'broadcast',
        event: 'session_key_rotate',
        payload: { encryptedKey, iv, epoch: newEpoch, from: userId },
      });

      // Store in cache for decryption of in-flight messages
      epochKeyCacheRef.current.set(newEpoch, newKey);

      // Discard keys older than 2 rotation cycles
      const cutoff = newEpoch - KEY_ROTATION_MS * 2;
      for (const [ep] of epochKeyCacheRef.current) {
        if (ep < cutoff) epochKeyCacheRef.current.delete(ep);
      }

      currentEpochRef.current = newEpoch;
      currentSessionKeyRef.current = newKey;

      setSessionKey(newKey);
      setCurrentEpoch(newEpoch);
      setIsReady(true);

      if (onRotateCallbackRef.current) onRotateCallbackRef.current();
    } catch (err) {
      console.error('[ForwardSecrecy] Key rotation failed:', err);
    }
  }, [baseKey, userId]);

  // Register a callback that fires on each key rotation (used by ChatPage for toast)
  const onRotate = useCallback((cb) => {
    onRotateCallbackRef.current = cb;
  }, []);

  useEffect(() => {
    if (!roomId || !userId || !baseKey) return;
    let cancelled = false;

    const channel = supabase.channel(`fs:${roomId}`, {
      config: { broadcast: { self: false } },
    });

    // Listen for session key rotations from other participants
    channel.on('broadcast', { event: 'session_key_rotate' }, async ({ payload }) => {
      if (cancelled || !payload || payload.from === userId) return;
      try {
        const decryptedKeyB64 = await decryptSessionKeyPayload(
          payload.encryptedKey, payload.iv, baseKey
        );
        const importedKey = await importKeyFromBase64(decryptedKeyB64);

        // Always cache every epoch key received — even if it's an older epoch
        epochKeyCacheRef.current.set(payload.epoch, importedKey);

        if (!cancelled) {
          // Update session key if this epoch is newer than what we have
          if (payload.epoch >= currentEpochRef.current) {
            currentSessionKeyRef.current = importedKey;
            currentEpochRef.current = payload.epoch;
            setSessionKey(importedKey);
            setCurrentEpoch(payload.epoch);
            setIsReady(true);
          }
        }
      } catch (err) {
        console.error('[ForwardSecrecy] Failed to receive peer key:', err);
      }
    });

    // *** KEY FIX: When a peer signals they just joined, re-broadcast our current key to them ***
    channel.on('broadcast', { event: 'request_session_key' }, async ({ payload }) => {
      if (cancelled || !payload || payload.from === userId) return;
      // Re-send our current session key so the late joiner can decrypt past messages
      await broadcastCurrentKey(channel);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && !cancelled) {
        channelRef.current = channel;
        // Generate and broadcast initial session key
        await rotateKey(channel);

        // Also request any existing peer's keys (in case we are the late joiner)
        channel.send({
          type: 'broadcast',
          event: 'request_session_key',
          payload: { from: userId },
        });

        // Schedule rotation every 5 minutes
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
  }, [roomId, userId, baseKey, rotateKey, broadcastCurrentKey]);

  return {
    sessionKey,
    currentEpoch,
    epochKeyCache: epochKeyCacheRef.current,
    isReady,
    onRotate,
  };
}
