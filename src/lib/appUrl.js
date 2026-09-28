/**
 * Returns the clean canonical application origin.
 * In local development, returns window.location.origin (e.g. http://localhost:5173).
 * On Vercel (whether preview hash or production), always returns the clean production domain:
 * https://disappear-chat.vercel.app
 */
export function getAppOrigin() {
  if (typeof window === 'undefined') return 'https://disappear-chat.vercel.app';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return window.location.origin;
  }
  if (window.location.hostname.endsWith('.vercel.app')) {
    return 'https://disappear-chat.vercel.app';
  }
  return window.location.origin;
}
