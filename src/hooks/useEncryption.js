import { useState, useEffect, useRef, useCallback } from 'react';
import {
  importKeyFromBase64,
  encrypt as cryptoEncrypt,
  decrypt as cryptoDecrypt,
  encryptFile as cryptoEncryptFile,
  decryptFile as cryptoDecryptFile,
  getKeyFromHash,
} from '../lib/crypto';

/**
 * Hook that manages AES-256-GCM encryption using the key from the URL hash.
 * The key is imported once and cached in a ref to avoid re-renders.
 */
export function useEncryption() {
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [error, setError] = useState(null);
  const cryptoKeyRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadKey() {
      try {
        const base64Key = getKeyFromHash();
        if (!base64Key) {
          if (!cancelled) {
            setError('No encryption key found in URL');
            setKeyLoaded(false);
          }
          return;
        }

        const key = await importKeyFromBase64(base64Key);
        if (!cancelled) {
          cryptoKeyRef.current = key;
          setKeyLoaded(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Invalid encryption key: ' + err.message);
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
  }, []);

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
