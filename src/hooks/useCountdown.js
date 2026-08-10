import { useState, useEffect, useRef, useMemo } from 'react';

const GRACE_PERIOD_SECONDS = 30;

/**
 * Countdown timer hook with offline support and 30s grace period.
 * For sessions 5 minutes or longer (or extended sessions), a 30s grace period
 * activates at 00:00. If not extended within 30s, the room is terminated.
 */
export function useCountdown(expiresAt, durationMinutes = 0) {
  const [now, setNow] = useState(Date.now());
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [graceStarted, setGraceStarted] = useState(false);
  const [graceSecondsLeft, setGraceSecondsLeft] = useState(GRACE_PERIOD_SECONDS);
  const intervalRef = useRef(null);
  const graceIntervalRef = useRef(null);

  // Track online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Local countdown tick — runs every second
  useEffect(() => {
    if (!expiresAt) return;

    intervalRef.current = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [expiresAt]);

  // Reset grace period whenever room extension occurs (expiresAt updates)
  useEffect(() => {
    setGraceStarted(false);
    setGraceSecondsLeft(GRACE_PERIOD_SECONDS);
  }, [expiresAt]);

  // Start grace period countdown when main room timer hits 0 for 5m+ rooms
  useEffect(() => {
    if (!expiresAt) return;
    const expiryTime = new Date(expiresAt).getTime();
    if (now >= expiryTime && durationMinutes >= 5 && !graceStarted) {
      setGraceStarted(true);
    }
  }, [expiresAt, now, durationMinutes, graceStarted]);

  // Grace period countdown tick (30s -> 0s)
  useEffect(() => {
    if (!graceStarted) return;

    graceIntervalRef.current = setInterval(() => {
      setGraceSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(graceIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (graceIntervalRef.current) clearInterval(graceIntervalRef.current); };
  }, [graceStarted]);

  return useMemo(() => {
    if (!expiresAt) {
      return {
        hours: 0, minutes: 0, seconds: 0, totalSeconds: 0,
        percentage: 100, isUrgent: false, isCritical: false,
        isUnder30Sec: false, isExpired: false, inGracePeriod: false,
        graceSecondsLeft: GRACE_PERIOD_SECONDS, formatted: '--:--:--',
        timerStarted: false, isOnline,
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
    const isCritical = totalSeconds <= 30;
    const isUnder30Sec = totalSeconds > 0 && totalSeconds <= 30;
    const rawExpired = totalSeconds <= 0;

    // Grace period applies to rooms with duration >= 5 minutes (or extended rooms)
    const graceEligible = durationMinutes >= 5;
    const inGracePeriod = rawExpired && graceEligible && graceSecondsLeft > 0;
    const isExpired = rawExpired && (!graceEligible || graceSecondsLeft <= 0);

    const pad = (n) => String(n).padStart(2, '0');
    const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return {
      hours, minutes, seconds, totalSeconds, percentage,
      isUrgent, isCritical, isUnder30Sec, isExpired,
      inGracePeriod, graceSecondsLeft,
      formatted, timerStarted: true, isOnline,
    };
  }, [expiresAt, now, durationMinutes, graceStarted, graceSecondsLeft, isOnline]);
}
