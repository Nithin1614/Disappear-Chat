import { useState, useEffect, useRef, useCallback } from 'react';
import {
  importKeyFromBase64,
  deriveKeyFromRoomCode,
  encrypt as cryptoEncrypt,
  decrypt as cryptoDecrypt,
  encryptFile as cryptoEncryptFile,
  decryptFile as cryptoDecryptFile,
  getKeyFromHash,
} from '../lib/crypto';

/**
 * Hook that manages AES-256-GCM encryption.
 * Primary key is ALWAYS derived deterministically from roomCode so all room participants
 * share the exact same key regardless of URL hash presence.
 * URL hash key (#key=...) is preserved as a fallback for backward compatibility.
 */
export function useEncryption(roomCode = null) {
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [error, setError] = useState(null);
  const primaryKeyRef = useRef(null);
  const fallbackKeyRef = useRef(null);

  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;

    async function loadKey() {
      try {
        // Primary key: derived deterministically from roomCode (shared by all participants)
        const primary = await deriveKeyFromRoomCode(roomCode);

        // Fallback key: URL hash key (#key=...) if present
        let fallback = null;
        const base64Key = getKeyFromHash();
        if (base64Key) {
          try { fallback = await importKeyFromBase64(base64Key); } catch {}
        }

        if (!cancelled) {
          primaryKeyRef.current = primary;
          fallbackKeyRef.current = fallback;
          setKeyLoaded(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to initialize encryption key: ' + err.message);
          setKeyLoaded(false);
        }
      }
    }

    loadKey();

    const handleHashChange = () => loadKey();
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      cancelled = true;
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [roomCode]);

  const encrypt = useCallback(async (plaintext) => {
    const key = primaryKeyRef.current || fallbackKeyRef.current;
    if (!key) throw new Error('Encryption key not loaded');
    return cryptoEncrypt(plaintext, key);
  }, []);

  const decrypt = useCallback(async (ciphertext, iv) => {
    const primary = primaryKeyRef.current;
    const fallback = fallbackKeyRef.current;
    if (!primary && !fallback) throw new Error('Encryption key not loaded');

    // 1. Try primary room code key first
    if (primary) {
      try {
        return await cryptoDecrypt(ciphertext, iv, primary);
      } catch (err) {
        if (!fallback) throw err;
      }
    }

    // 2. Try fallback hash key
    if (fallback) {
      return await cryptoDecrypt(ciphertext, iv, fallback);
    }

    throw new Error('Decryption failed');
  }, []);

  const encryptFile = useCallback(async (arrayBuffer) => {
    const key = primaryKeyRef.current || fallbackKeyRef.current;
    if (!key) throw new Error('Encryption key not loaded');
    return cryptoEncryptFile(arrayBuffer, key);
  }, []);

  const decryptFile = useCallback(async (encryptedArrayBuffer, iv) => {
    const primary = primaryKeyRef.current;
    const fallback = fallbackKeyRef.current;
    if (!primary && !fallback) throw new Error('Encryption key not loaded');

    if (primary) {
      try {
        return await cryptoDecryptFile(encryptedArrayBuffer, iv, primary);
      } catch (err) {
        if (!fallback) throw err;
      }
    }

    if (fallback) {
      return await cryptoDecryptFile(encryptedArrayBuffer, iv, fallback);
    }

    throw new Error('File decryption failed');
  }, []);

  return {
    encrypt,
    decrypt,
    encryptFile,
    decryptFile,
    keyLoaded,
    cryptoKey: primaryKeyRef.current || fallbackKeyRef.current,
    error
  };
}
