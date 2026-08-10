import { useState, useEffect, useRef } from 'react';

/**
 * useMultiTabProtection — prevents the same user from opening the same chat room
 * in multiple browser tabs simultaneously.
 *
 * Strategy:
 *   - Uses BroadcastChannel API (Chrome/Firefox/Edge)
 *   - On mount: sends a "claim" ping; if a "claimed" reply arrives, blocks this tab
 *   - On unmount: sends "release" so the other tab can unblock
 *   - Safari fallback: localStorage heartbeat (800ms interval, 2s TTL)
 *
 * Bug fixes vs v1:
 *   - Blocked localStorage path now still registers its own cleanup
 *   - storageKey computed inside useEffect to avoid stale closure
 */
export function useMultiTabProtection(roomCode, userId) {
  const [isBlocked, setIsBlocked] = useState(false);
  const tabIdRef = useRef(`tab_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!roomCode || !userId) return;

    const myTabId = tabIdRef.current;
    const storageKey = `vanishchat_tab:${roomCode}:${userId}`;

    // ---- BroadcastChannel path (Chrome, Firefox, Edge) ----
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(`vanishchat:${roomCode}:${userId}`);

      bc.onmessage = (event) => {
        const { type, fromTab } = event.data || {};
        if (fromTab === myTabId) return; // ignore own messages

        if (type === 'claim') {
          // Another tab is claiming — reply to block them
          bc.postMessage({ type: 'claimed', fromTab: myTabId });
        }
        if (type === 'claimed') {
          // We got blocked — another tab is already active
          setIsBlocked(true);
        }
        if (type === 'release') {
          // Primary tab left — we're now free
          setIsBlocked(false);
        }
      };

      bc.postMessage({ type: 'claim', fromTab: myTabId });

      return () => {
        bc.postMessage({ type: 'release', fromTab: myTabId });
        bc.close();
      };
    }

    // ---- localStorage fallback (Safari) ----
    const HEARTBEAT_MS = 800;
    const TTL_MS = 2000;

    const writeHeartbeat = () => {
      localStorage.setItem(storageKey, JSON.stringify({ timestamp: Date.now(), tabId: myTabId }));
    };

    const cleanup = () => {
      try {
        const entry = localStorage.getItem(storageKey);
        if (entry) {
          const { tabId } = JSON.parse(entry);
          if (tabId === myTabId) localStorage.removeItem(storageKey);
        }
      } catch { /* ignore */ }
    };

    // Check if another tab already owns this session
    try {
      const existing = localStorage.getItem(storageKey);
      if (existing) {
        const { timestamp, tabId } = JSON.parse(existing);
        if (tabId !== myTabId && Date.now() - timestamp < TTL_MS) {
          setIsBlocked(true);
          // Still register cleanup in case we later become unblocked
          return cleanup;
        }
      }
    } catch { /* malformed, ignore */ }

    // Claim the session with a heartbeat
    writeHeartbeat();
    const timer = setInterval(writeHeartbeat, HEARTBEAT_MS);

    return () => {
      clearInterval(timer);
      cleanup();
    };
  }, [roomCode, userId]);

  return { isBlocked };
}
