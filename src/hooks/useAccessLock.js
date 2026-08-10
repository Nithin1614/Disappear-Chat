import { useState, useEffect, useCallback, useRef } from 'react';

const INACTIVITY_LOCK_MS = 60 * 1000; // 60 seconds of inactivity

/**
 * useAccessLock — hides chat content when:
 *   1. Browser tab loses visibility (tab switch / minimize)
 *   2. User is inactive for 60 seconds
 *
 * Returns `isLocked` boolean. Calling `unlock()` dismisses the overlay.
 * Activity events (mouse move, key press, click) reset the inactivity timer.
 */
export function useAccessLock() {
  const [isLocked, setIsLocked] = useState(false);
  const inactivityTimerRef = useRef(null);
  const lockedByVisibilityRef = useRef(false);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      setIsLocked(true);
    }, INACTIVITY_LOCK_MS);
  }, []);

  const unlock = useCallback(() => {
    setIsLocked(false);
    lockedByVisibilityRef.current = false;
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  useEffect(() => {
    // Tab visibility change — lock immediately when tab hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lockedByVisibilityRef.current = true;
        setIsLocked(true);
      }
    };

    // Activity events — reset inactivity timer
    const handleActivity = () => {
      if (!lockedByVisibilityRef.current) resetInactivityTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('click', handleActivity);
    document.addEventListener('touchstart', handleActivity);
    document.addEventListener('scroll', handleActivity, true);

    // Start inactivity timer on mount
    resetInactivityTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
