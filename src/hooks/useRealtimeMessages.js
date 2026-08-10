import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for real-time message subscription and sending.
 * Subscribes to postgres_changes on the messages table filtered by room_id.
 */
export function useRealtimeMessages(roomId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  // Fetch existing messages on mount
  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;

    async function fetchMessages() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setMessages(data || []);
      setLoading(false);
    }

    fetchMessages();

    return () => { cancelled = true; };
  }, [roomId]);

  // Subscribe to real-time inserts and updates
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? payload.new : m))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          // Remove burn-after-read messages when deleted
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId]);

  const sendMessage = useCallback(
    async ({
      encryptedContent,
      iv,
      type = 'text',
      senderId,
      fileUrl = null,
      fileName = null,
      fileSize = null,
      fileIv = null,
      burnAfterRead = false,
    }) => {
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          sender_id: senderId,
          encrypted_content: encryptedContent,
          iv,
          type,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          file_iv: fileIv || iv,
          burn_after_read: burnAfterRead,
          is_read: false,
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);
      return data;
    },
    [roomId]
  );

  return { messages, sendMessage, loading, error };
}
