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
 * First checks URL hash fragment (#key=...).
 * If no hash key is present, derives key deterministically from roomCode.
 * This guarantees code-only joining works instantly with full E2E encryption intact!
 */
export function useEncryption(roomCode = null) {
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [error, setError] = useState(null);
  const cryptoKeyRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadKey() {
      try {
        const base64Key = getKeyFromHash();
        let key = null;

        if (base64Key) {
          key = await importKeyFromBase64(base64Key);
        } else if (roomCode) {
          key = await deriveKeyFromRoomCode(roomCode);
        }

        if (!key) {
          if (!cancelled) {
            setError('No encryption key found');
            setKeyLoaded(false);
          }
          return;
        }

        if (!cancelled) {
          cryptoKeyRef.current = key;
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
    if (!cryptoKeyRef.current) {
      throw new Error('Encryption key not loaded');
    }
    return cryptoEncrypt(plaintext, cryptoKeyRef.current);
  }, []);

  const decrypt = useCallback(async (ciphertext, iv) => {
    if (!cryptoKeyRef.current) {
      throw new Error('Encryption key not loaded');
    }
    return cryptoDecrypt(ciphertext, iv, cryptoKeyRef.current);
  }, []);

  const encryptFile = useCallback(async (arrayBuffer) => {
    if (!cryptoKeyRef.current) {
      throw new Error('Encryption key not loaded');
    }
    return cryptoEncryptFile(arrayBuffer, cryptoKeyRef.current);
  }, []);

  const decryptFile = useCallback(async (encryptedArrayBuffer, iv) => {
    if (!cryptoKeyRef.current) {
      throw new Error('Encryption key not loaded');
    }
    return cryptoDecryptFile(encryptedArrayBuffer, iv, cryptoKeyRef.current);
  }, []);

  return { encrypt, decrypt, encryptFile, decryptFile, keyLoaded, error };
}
