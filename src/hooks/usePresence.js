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
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!roomId || !userId) return;

    isSubscribedRef.current = false;

    const channel = supabase.channel(`presence:${roomId}`, {
      config: { presence: { key: userId } },
    });

    const syncState = () => {
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
    };

    channel
      .on('presence', { event: 'sync' }, syncState)
      .on('presence', { event: 'join' }, syncState)
      .on('presence', { event: 'leave' }, syncState)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
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
      isSubscribedRef.current = false;
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
      // Guard: only track if channel is subscribed
      if (!channelRef.current || !isSubscribedRef.current) return;

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

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          if (channelRef.current && isSubscribedRef.current) {
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
