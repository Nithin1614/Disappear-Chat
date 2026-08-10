import { useState, useEffect, useCallback, useRef } from 'react';

const INACTIVITY_LOCK_MS = 60 * 1000; // 60 seconds of inactivity

/**
 * useAccessLock — hides chat content when the user is inactive for 60 seconds.
 *
 * NOTE: Tab visibility lock was intentionally removed — locking on every tab
 * switch is too aggressive for a chat app (users frequently switch tabs).
 * Only locks on genuine inactivity (no mouse/keyboard/touch/scroll for 60s).
 *
 * Returns `isLocked` boolean. Calling `unlock()` dismisses the overlay.
 * Activity events (mouse move, key press, click, touch, scroll) reset the timer.
 */
export function useAccessLock() {
  const [isLocked, setIsLocked] = useState(false);
  const inactivityTimerRef = useRef(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      setIsLocked(true);
    }, INACTIVITY_LOCK_MS);
  }, []);

  const unlock = useCallback(() => {
    setIsLocked(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  useEffect(() => {
    const handleActivity = () => {
      // Only reset timer when not locked — don't reset when user needs to click to unlock
      setIsLocked(prev => {
        if (!prev) resetInactivityTimer();
        return prev;
      });
    };

    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('click', handleActivity);
    document.addEventListener('touchstart', handleActivity);
    document.addEventListener('scroll', handleActivity, true);

    // Start inactivity timer on mount
    resetInactivityTimer();

    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('scroll', handleActivity, true);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [resetInactivityTimer]);

  return { isLocked, unlock };
}
