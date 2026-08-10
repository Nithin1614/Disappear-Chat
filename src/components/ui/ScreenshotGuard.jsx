import { useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';

/**
 * Mounts globally in chat. Detects screenshot attempts and flashes a deterrent overlay.
 * Browser-level screenshots can't be truly blocked, but we deter casual attempts.
 */
export default function ScreenshotGuard() {
  const { addToast } = useToast();

  const triggerDeterrent = useCallback(() => {
    // Flash screen black
    const flash = document.createElement('div');
    flash.className = 'screenshot-flash';
    document.body.appendChild(flash);
    setTimeout(() => document.body.removeChild(flash), 500);
    addToast('📸 Screenshot attempt detected — this room is private.', 'warning');
  }, [addToast]);

  useEffect(() => {
    const handleKey = (e) => {
      const isPS = e.key === 'PrintScreen';
      const isMacSnap = e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5' || e.key === 's');
      const isWinSnip = e.metaKey && e.shiftKey && e.key === 's';
      if (isPS || isMacSnap || isWinSnip) {
        e.preventDefault();
        triggerDeterrent();
      }
    };

    // Detect clipboard write that may include screenshots
    const handleVisibility = () => {
      // When user tabs back, check if clipboard might have changed (heuristic)
    };

    document.addEventListener('keydown', handleKey, true);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('keydown', handleKey, true);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [triggerDeterrent]);

  // Apply CSS that prevents text selection and drag on chat content
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'vanishchat-screenshot-guard';
    style.textContent = `
      .chat-messages-area { 
        -webkit-user-select: none !important; 
        user-select: none !important; 
      }
      .chat-messages-area img {
        -webkit-user-drag: none !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('vanishchat-screenshot-guard');
      if (el) el.remove();
    };
  }, []);

  return null;
}
