import { useState, useEffect, useRef } from 'react';

/**
 * useMultiTabProtection — prevents the same user from opening the same chat room
 * in multiple browser tabs simultaneously.
 *
 * Strategy:
 *   - Uses BroadcastChannel API (fast, native, no server) keyed to `vanishchat:{roomCode}:{userId}`
 *   - On mount: broadcasts a "claim" ping and listens for conflicts
 *   - If a reply "claimed" arrives within 300ms, the current tab is blocked
 *   - On unmount (tab close): broadcasts "release"
 *   - Safari fallback: localStorage heartbeat with 1-second TTL
 *
 * @param {string} roomCode - The room code
 * @param {string} userId - The current user ID
 * @returns {{ isBlocked: boolean }}
 */
export function useMultiTabProtection(roomCode, userId) {
  const [isBlocked, setIsBlocked] = useState(false);
  const channelRef = useRef(null);
  const tabIdRef = useRef(`tab_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const storageKey = `vanishchat_tab:${roomCode}:${userId}`;

  useEffect(() => {
    if (!roomCode || !userId) return;

    const myTabId = tabIdRef.current;

    // ---- BroadcastChannel path (Chrome, Firefox, Edge) ----
    if (typeof BroadcastChannel !== 'undefined') {
      const channelName = `vanishchat:${roomCode}:${userId}`;
      const bc = new BroadcastChannel(channelName);
      channelRef.current = bc;

      bc.onmessage = (event) => {
        const { type, fromTab } = event.data || {};
        if (fromTab === myTabId) return; // ignore own messages

        if (type === 'claim') {
          // Another tab is claiming this channel — reply with "claimed" to block them
          bc.postMessage({ type: 'claimed', fromTab: myTabId });
        }
        if (type === 'claimed') {
          // We got blocked — another tab is already active
          setIsBlocked(true);
        }
        if (type === 'release') {
          // The other tab left — we can unblock
          setIsBlocked(false);
        }
      };

      // Broadcast our claim; wait briefly for a conflict reply
      bc.postMessage({ type: 'claim', fromTab: myTabId });

      return () => {
        bc.postMessage({ type: 'release', fromTab: myTabId });
        bc.close();
        channelRef.current = null;
      };
    }

    // ---- localStorage fallback (Safari) ----
    const heartbeatInterval = 800; // ms
    const TTL = 2000; // ms — if no heartbeat within 2s, tab is considered gone

    const existingEntry = localStorage.getItem(storageKey);
    if (existingEntry) {
      try {
        const { timestamp, tabId } = JSON.parse(existingEntry);
        if (tabId !== myTabId && Date.now() - timestamp < TTL) {
          setIsBlocked(true);
          return;
        }
      } catch { /* malformed, ignore */ }
    }

    // Register own heartbeat
    const writeHeartbeat = () => {
      localStorage.setItem(storageKey, JSON.stringify({ timestamp: Date.now(), tabId: myTabId }));
    };
    writeHeartbeat();
    const timer = setInterval(writeHeartbeat, heartbeatInterval);

    return () => {
      clearInterval(timer);
      // Only remove if we own the entry
      try {
        const entry = localStorage.getItem(storageKey);
        if (entry) {
          const { tabId } = JSON.parse(entry);
          if (tabId === myTabId) localStorage.removeItem(storageKey);
        }
      } catch { /* ignore */ }
    };
  }, [roomCode, userId, storageKey]);

  return { isBlocked };
}
