import { useEffect, useRef, useCallback } from 'react';

const CLEAR_AFTER_MS = 10 * 1000; // 10 seconds

/**
 * useClipboardAutoClear — automatically clears clipboard 10 seconds after a
 * sensitive message is copied, reducing risk of accidental data leakage.
 *
 * @param {function} onCleared - Called after clipboard is cleared (for toast notification)
 */
export function useClipboardAutoClear(onCleared) {
  const timerRef = useRef(null);
  const lastCopiedTextRef = useRef('');
  // Store callback in ref so triggerClear stays stable and doesn't re-register the copy listener
  const onClearedRef = useRef(onCleared);
  useEffect(() => { onClearedRef.current = onCleared; }, [onCleared]);

  const triggerClear = useCallback((copiedText = '') => {
    lastCopiedTextRef.current = copiedText;

    // Reset existing timer if user copies again before 10s
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        // Only clear if clipboard still matches what we copied (user hasn't overwritten it)
        const current = await navigator.clipboard.readText().catch(() => null);
        if (current === null || current === lastCopiedTextRef.current) {
          await navigator.clipboard.writeText('');
          onClearedRef.current && onClearedRef.current();
        }
      } catch {
        // Clipboard access may be denied — fail silently
      }
    }, CLEAR_AFTER_MS);
  }, []); // stable — no deps needed since we use refs

  // Global copy event listener — intercepts Ctrl+C on selected text in chat
  useEffect(() => {
    const handleCopy = () => {
      const selected = window.getSelection()?.toString() || '';
      if (selected.trim()) triggerClear(selected);
    };

    document.addEventListener('copy', handleCopy);
    return () => {
      document.removeEventListener('copy', handleCopy);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [triggerClear]); // triggerClear is now stable, so this runs only once

  return { triggerClear };
}
