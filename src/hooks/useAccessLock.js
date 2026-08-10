import { useState, useEffect, useCallback, useRef } from 'react';

const INACTIVITY_LOCK_MS = 90 * 1000; // 90 seconds of inactivity

/**
 * useAccessLock — hides chat content when the user is inactive for 90 seconds.
 *
 * Remains locked until the user explicitly clicks the overlay to unlock,
 * or until the room is terminated (at 7 mins inactivity).
 *
 * Returns `isLocked` boolean. Calling `unlock()` dismisses the overlay.
 */
export function useAccessLock() {
  const [isLocked, setIsLocked] = useState(false);
  const inactivityTimerRef = useRef(null);
  const isLockedRef = useRef(false); // ref mirror to avoid stale closure in activity handler

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      setIsLocked(true);
      isLockedRef.current = true;
    }, INACTIVITY_LOCK_MS);
  }, []);

  const unlock = useCallback(() => {
    setIsLocked(false);
    isLockedRef.current = false;
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  useEffect(() => {
    const handleActivity = () => {
      // Don't reset timer when locked — user must explicitly click the overlay to unlock
      if (!isLockedRef.current) resetInactivityTimer();
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
