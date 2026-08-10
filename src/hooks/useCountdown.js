import { useState, useEffect, useRef, useMemo } from 'react';

/**
 * Countdown timer hook.
 * @param {string|null} expiresAt - ISO timestamp when the room expires, or null if timer hasn't started.
 * @param {number} durationMinutes - Original room duration in minutes (for percentage calc).
 */
export function useCountdown(expiresAt, durationMinutes = 0) {
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!expiresAt) return;

    intervalRef.current = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [expiresAt]);

  return useMemo(() => {
    if (!expiresAt) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        percentage: 100,
        isUrgent: false,
        isCritical: false,
        isExpired: false,
        formatted: '--:--:--',
        timerStarted: false,
      };
    }

    const expiryTime = new Date(expiresAt).getTime();
    const remainingMs = Math.max(0, expiryTime - now);
    const totalSeconds = Math.floor(remainingMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const totalDurationSeconds = durationMinutes * 60;
    const percentage =
      totalDurationSeconds > 0
        ? Math.max(0, Math.min(100, (totalSeconds / totalDurationSeconds) * 100))
        : 0;

    const isUrgent = percentage < 25;
    const isCritical = totalSeconds < 60;
    const isExpired = totalSeconds <= 0;

    const pad = (n) => String(n).padStart(2, '0');
    const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return {
      hours,
      minutes,
      seconds,
      totalSeconds,
      percentage,
      isUrgent,
      isCritical,
      isExpired,
      formatted,
      timerStarted: true,
    };
  }, [expiresAt, now, durationMinutes]);
}
