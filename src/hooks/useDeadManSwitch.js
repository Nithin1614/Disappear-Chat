import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const INACTIVITY_MS = 7 * 60 * 1000;       // 7 minutes total inactivity
const WARNING_AT_MS = 30 * 1000;            // warn when 30s left (at 6m30s)
const FINAL_COUNTDOWN_AT_MS = 10 * 1000;   // red countdown when 10s left

/**
 * useDeadManSwitch — auto-destroys the room after 7 minutes of zero activity.
 *
 * Callbacks (onWarn, onCountdown, onDestroy) are stored in refs so they never
 * cause the interval useEffect to re-run (which would restart the timer).
 */
export function useDeadManSwitch({ roomId, userId, enabled, onWarn, onCountdown, onDestroy }) {
  const lastActivityRef = useRef(Date.now());
  const warnFiredRef = useRef(false);
  const destroyedRef = useRef(false);
  const tickerRef = useRef(null);

  // Store callbacks in refs — never stale, never cause re-runs
  const onWarnRef = useRef(onWarn);
  const onCountdownRef = useRef(onCountdown);
  const onDestroyRef = useRef(onDestroy);
  useEffect(() => { onWarnRef.current = onWarn; }, [onWarn]);
  useEffect(() => { onCountdownRef.current = onCountdown; }, [onCountdown]);
  useEffect(() => { onDestroyRef.current = onDestroy; }, [onDestroy]);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warnFiredRef.current = false;
    // Signal 0 to hide countdown banner
    onCountdownRef.current && onCountdownRef.current(0);
  }, []);

  useEffect(() => {
    if (!enabled || !roomId || !userId) return;

    destroyedRef.current = false;
    lastActivityRef.current = Date.now();
    warnFiredRef.current = false;

    tickerRef.current = setInterval(async () => {
      if (destroyedRef.current) return;
      const idle = Date.now() - lastActivityRef.current;
      const remaining = INACTIVITY_MS - idle;

      // Warning toast at 30s mark
      if (remaining <= WARNING_AT_MS && !warnFiredRef.current) {
        warnFiredRef.current = true;
        onWarnRef.current && onWarnRef.current();
      }

      // Final countdown banner (10s)
      if (remaining <= FINAL_COUNTDOWN_AT_MS && remaining > 0) {
        const secsLeft = Math.ceil(remaining / 1000);
        onCountdownRef.current && onCountdownRef.current(secsLeft);
      }

      // Destroy
      if (remaining <= 0 && !destroyedRef.current) {
        destroyedRef.current = true;
        clearInterval(tickerRef.current);
        onCountdownRef.current && onCountdownRef.current(0);
        try {
          await supabase.from('messages').delete().eq('room_id', roomId);
          await supabase.from('rooms').update({ is_active: false }).eq('id', roomId);
        } catch (err) {
          console.error('[DeadManSwitch] Cleanup failed:', err);
        }
        onDestroyRef.current && onDestroyRef.current();
      }
    }, 1000);

    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  // Only re-run when room/user/enabled changes — NOT on callback changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomId, userId]);

  return { resetActivity };
}
