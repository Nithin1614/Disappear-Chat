/**
 * VanishChat Encryption Module
 * Uses Web Crypto API with AES-256-GCM for end-to-end encryption.
 * Supports URL hash keys AND deterministic PBKDF2 room key derivation,
 * ensuring code-only joining works seamlessly without sacrificing E2E encryption.
 */

// --- Base64URL helpers (URL-safe, no padding) ---

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToArrayBuffer(base64url) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// --- Standard Base64 helpers (for ciphertext/IV storage) ---

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives an AES-256-GCM key deterministically from roomCode using PBKDF2.
 * This guarantees code-only joining works without needing URL hashes while preserving Web Crypto AES-256-GCM E2E.
 */
export async function deriveKeyFromRoomCode(roomCode) {
  const cleanCode = (roomCode || '').toLowerCase().trim();
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(cleanCode),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const salt = encoder.encode('vanishchat-e2e-salt-v1');

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true, // extractable so we can format as base64Url for links
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates an encryption key for a room (derived from roomCode for universal compatibility).
 * @param {string} roomCode
 * @returns {Promise<string>} Base64URL-encoded raw key bytes.
 */
export async function generateEncryptionKey(roomCode) {
  if (roomCode) {
    const derivedKey = await deriveKeyFromRoomCode(roomCode);
    const rawKey = await crypto.subtle.exportKey('raw', derivedKey);
    return arrayBufferToBase64Url(rawKey);
  }

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const rawKey = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64Url(rawKey);
}

/**
 * Imports a CryptoKey from a base64url-encoded raw key string.
 * @param {string} base64Key - Base64URL-encoded key.
 * @returns {Promise<CryptoKey>}
 */
export async function importKeyFromBase64(base64Key) {
  const rawKey = base64UrlToArrayBuffer(base64Key);
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 */
export async function encrypt(plaintext, cryptoKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypts an AES-256-GCM ciphertext back to plaintext.
 */
export async function decrypt(ciphertext, iv, cryptoKey) {
  const encryptedData = base64ToArrayBuffer(ciphertext);
  const ivData = new Uint8Array(base64ToArrayBuffer(iv));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    cryptoKey,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Encrypts a file (ArrayBuffer) using AES-256-GCM.
 */
export async function encryptFile(arrayBuffer, cryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    arrayBuffer
  );

  return {
    encryptedData: encrypted,
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypts a file (ArrayBuffer) using AES-256-GCM.
 */
export async function decryptFile(encryptedArrayBuffer, iv, cryptoKey) {
  const ivData = new Uint8Array(base64ToArrayBuffer(iv));

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    cryptoKey,
    encryptedArrayBuffer
  );
}

/**
 * Reads the encryption key from the URL hash fragment.
 */
export function getKeyFromHash() {
  const hash = window.location.hash;
  if (!hash || !hash.includes('key=')) {
    return null;
  }
  const params = new URLSearchParams(hash.substring(1));
  return params.get('key') || null;
}
