import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const INACTIVITY_MS = 2 * 60 * 1000;       // 2 minutes total
const WARNING_AT_MS = 30 * 1000;            // warn when 30s left (at 1m30s)
const FINAL_COUNTDOWN_AT_MS = 10 * 1000;   // red countdown when 10s left

/**
 * useDeadManSwitch — auto-destroys the room after 2 minutes of zero activity.
 *
 * Activity signals: message sent, key press in input, scroll in messages area.
 *
 * Timeline:
 *   0:00 → inactivity timer starts
 *   1:30 → yellow warning toast ("Room closes in 30s…")
 *   1:50 → red countdown banner counting 10→0
 *   2:00 → room destroyed, redirect to dashboard
 *
 * Calling `resetActivity()` at any point resets the timer silently.
 *
 * @param {object} opts
 * @param {string} opts.roomId - Supabase room ID
 * @param {string} opts.userId - Current user ID
 * @param {boolean} opts.enabled - Whether the switch is active
 * @param {function} opts.onWarn - Called when warning kicks in (30s remaining)
 * @param {function} opts.onCountdown - Called every second during final 10s countdown with seconds remaining
 * @param {function} opts.onDestroy - Called after room is destroyed
 */
export function useDeadManSwitch({ roomId, userId, enabled, onWarn, onCountdown, onDestroy }) {
  const lastActivityRef = useRef(Date.now());
  const warnFiredRef = useRef(false);
  const countdownFiredRef = useRef(false);
  const destroyedRef = useRef(false);
  const tickerRef = useRef(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warnFiredRef.current = false;
    countdownFiredRef.current = false;
    // Signal 0 to hide countdown banner
    onCountdown && onCountdown(0);
  }, [onCountdown]);

  useEffect(() => {
    if (!enabled || !roomId || !userId) return;

    destroyedRef.current = false;
    lastActivityRef.current = Date.now();
    warnFiredRef.current = false;
    countdownFiredRef.current = false;

    tickerRef.current = setInterval(async () => {
      if (destroyedRef.current) return;
      const idle = Date.now() - lastActivityRef.current;
      const remaining = INACTIVITY_MS - idle;

      // Warning toast at 30s mark
      if (remaining <= WARNING_AT_MS && !warnFiredRef.current) {
        warnFiredRef.current = true;
        onWarn && onWarn();
      }

      // Final countdown banner
      if (remaining <= FINAL_COUNTDOWN_AT_MS && remaining > 0) {
        countdownFiredRef.current = true;
        const secsLeft = Math.ceil(remaining / 1000);
        onCountdown && onCountdown(secsLeft);
      }

      // Destroy
      if (remaining <= 0 && !destroyedRef.current) {
        destroyedRef.current = true;
        clearInterval(tickerRef.current);
        try {
          // Delete all messages in room
          await supabase.from('messages').delete().eq('room_id', roomId);
          // Mark room inactive
          await supabase.from('rooms').update({ is_active: false }).eq('id', roomId);
        } catch (err) {
          console.error('[DeadManSwitch] Cleanup failed:', err);
        }
        onDestroy && onDestroy();
      }
    }, 1000);

    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [enabled, roomId, userId, onWarn, onCountdown, onDestroy]);

  return { resetActivity };
}
