/**
 * useDeviceFingerprint — generates a lightweight, non-invasive device fingerprint.
 *
 * Built from publicly available browser properties:
 * screen resolution, color depth, timezone, language, platform, hardwareConcurrency.
 * Does NOT use canvas fingerprinting, WebGL, or any invasive technique.
 *
 * The fingerprint is hashed to an 8-character hex string and included in Supabase Presence metadata.
 * If the same userId appears with a different fingerprint mid-session, ChatPage shows a warning.
 */

/**
 * Generates and returns a short hex fingerprint hash of the current device/browser.
 * @returns {Promise<string>} 8-char hex string
 */
export async function generateFingerprint() {
  const raw = [
    navigator.language || '',
    navigator.languages?.join(',') || '',
    navigator.platform || '',
    String(navigator.hardwareConcurrency || 0),
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Return first 8 hex chars — enough to detect device changes without exposing full identity
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 8);
}
