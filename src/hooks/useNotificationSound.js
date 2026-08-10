import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_SOUND_KEY = 'vanishchat-sound-enabled';
const STORAGE_MUTED_KEY = 'vanishchat-muted';

/**
 * Hook for playing notification sounds using Web Audio API.
 * Includes mute toggle persisted to localStorage.
 */
export function useNotificationSound() {
  const [isTabFocused, setIsTabFocused] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SOUND_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_MUTED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const audioCtxRef = useRef(null);

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabFocused(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_SOUND_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_MUTED_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const playSound = useCallback(() => {
    if (!soundEnabled || isMuted) return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioCtxRef.current;
      const currentTime = ctx.currentTime;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(830, currentTime);
      oscillator.frequency.setValueAtTime(1000, currentTime + 0.08);

      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.25);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.25);
    } catch {
      // Audio not available
    }
  }, [soundEnabled, isMuted]);

  return { playSound, isTabFocused, soundEnabled, toggleSound, isMuted, toggleMute };
}
