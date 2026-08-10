/**
 * VanishChat Encryption Module
 * Uses Web Crypto API with AES-256-GCM for end-to-end encryption.
 * The encryption key lives only in the URL fragment (#key=...) and never reaches the server.
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
  // Add padding
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
 * Generates a new AES-256-GCM encryption key.
 * @returns {Promise<string>} Base64URL-encoded raw key bytes.
 */
export async function generateEncryptionKey() {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable
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
    false, // non-extractable once imported
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param {string} plaintext - The text to encrypt.
 * @param {CryptoKey} cryptoKey - The AES-GCM CryptoKey.
 * @returns {Promise<{ciphertext: string, iv: string}>} Base64-encoded ciphertext and IV.
 */
export async function encrypt(plaintext, cryptoKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

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
 * @param {string} ciphertext - Base64-encoded ciphertext.
 * @param {string} iv - Base64-encoded initialization vector.
 * @param {CryptoKey} cryptoKey - The AES-GCM CryptoKey.
 * @returns {Promise<string>} The decrypted plaintext.
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
 * @param {ArrayBuffer} arrayBuffer - The file data.
 * @param {CryptoKey} cryptoKey - The AES-GCM CryptoKey.
 * @returns {Promise<{encryptedData: ArrayBuffer, iv: string}>}
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
 * @param {ArrayBuffer} encryptedArrayBuffer - The encrypted file data.
 * @param {string} iv - Base64-encoded initialization vector.
 * @param {CryptoKey} cryptoKey - The AES-GCM CryptoKey.
 * @returns {Promise<ArrayBuffer>} The decrypted file data.
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
 * Expected format: #key=BASE64URL_ENCODED_KEY
 * @returns {string|null} The base64url key string, or null if not found.
 */
export function getKeyFromHash() {
  const hash = window.location.hash;
  if (!hash || !hash.includes('key=')) {
    return null;
  }
  const params = new URLSearchParams(hash.substring(1));
  return params.get('key') || null;
}
