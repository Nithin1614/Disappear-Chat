import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Presence hook for tracking online members and typing indicators.
 * Uses Supabase Realtime Presence channels.
 */
export function usePresence(roomId, userId, displayName = '') {
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!roomId || !userId) return;

    const channel = supabase.channel(`presence:${roomId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const members = [];
        const typing = [];

        Object.entries(state).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            const latest = presences[presences.length - 1];
            members.push({
              user_id: key,
              display_name: latest.display_name || key,
              is_online: true,
              is_typing: latest.is_typing || false,
            });
            if (latest.is_typing && key !== userId) {
              typing.push({
                user_id: key,
                display_name: latest.display_name || key,
              });
            }
          }
        });

        setOnlineMembers(members);
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            display_name: displayName || userId,
            is_typing: false,
            is_online: true,
            joined_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, userId, displayName]);

  const trackTyping = useCallback(
    (isTyping) => {
      if (!channelRef.current) return;

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      channelRef.current.track({
        user_id: userId,
        display_name: displayName || userId,
        is_typing: isTyping,
        is_online: true,
      });

      // Auto-stop typing after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          if (channelRef.current) {
            channelRef.current.track({
              user_id: userId,
              display_name: displayName || userId,
              is_typing: false,
              is_online: true,
            });
          }
        }, 3000);
      }
    },
    [userId, displayName]
  );

  return { onlineMembers, typingUsers, trackTyping };
}
