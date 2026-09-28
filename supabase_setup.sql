-- ==========================================================
-- VanishChat Full Database Setup Script
-- Paste this entire script into Supabase SQL Editor & click RUN
-- ==========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  user_id text PRIMARY KEY,
  display_name text,
  created_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);

-- 3. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  created_by text REFERENCES public.users(user_id) ON DELETE SET NULL,
  duration_minutes integer NOT NULL DEFAULT 15 CHECK (duration_minutes >= 1 AND duration_minutes <= 1440),
  max_members integer NOT NULL DEFAULT 2 CHECK (max_members >= 2 AND max_members <= 10),
  expires_at timestamptz,
  timer_started boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- 4. ROOM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.room_members (
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  is_online boolean DEFAULT true,
  PRIMARY KEY (room_id, user_id)
);

-- 5. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id text REFERENCES public.users(user_id) ON DELETE SET NULL,
  encrypted_content text NOT NULL,
  iv text NOT NULL,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
  file_url text,
  file_name text,
  file_size integer,
  file_iv text,
  is_read boolean DEFAULT false,
  burn_after_read boolean DEFAULT false,
  key_epoch bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 6. EXTEND VOTES TABLE
CREATE TABLE IF NOT EXISTS public.extend_votes (
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
  voted_at timestamptz DEFAULT now(),
  minutes_to_add integer DEFAULT 15,
  PRIMARY KEY (room_id, user_id)
);

-- 7. CHAT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.chat_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id text NOT NULL,
  sender_name text,
  target_id text NOT NULL,
  room_code text NOT NULL,
  status text DEFAULT 'pending',
  join_url text,
  created_at timestamptz DEFAULT now()
);

-- 8. SECRET LINKS TABLE
CREATE TABLE IF NOT EXISTS public.secret_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  encrypted_content text NOT NULL,
  iv text NOT NULL,
  expires_at timestamptz,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 9. TIMER TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.start_room_timer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  member_count int;
  room_rec record;
BEGIN
  SELECT COUNT(*) INTO member_count FROM public.room_members WHERE room_id = NEW.room_id;
  IF member_count >= 2 THEN
    SELECT * INTO room_rec FROM public.rooms WHERE id = NEW.room_id;
    IF room_rec.timer_started IS NOT TRUE THEN
      UPDATE public.rooms
      SET timer_started = true,
          expires_at = now() + (room_rec.duration_minutes || ' minutes')::interval
      WHERE id = NEW.room_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_start_room_timer ON public.room_members;
CREATE TRIGGER trg_start_room_timer
AFTER INSERT ON public.room_members
FOR EACH ROW
EXECUTE FUNCTION public.start_room_timer();

-- 9b. TRIGGER TO START ROOM TIMER ON FIRST MESSAGE
CREATE OR REPLACE FUNCTION public.start_room_timer_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  room_rec record;
BEGIN
  SELECT * INTO room_rec FROM public.rooms WHERE id = NEW.room_id;
  IF room_rec.timer_started IS NOT TRUE THEN
    UPDATE public.rooms
    SET timer_started = true,
        expires_at = now() + (room_rec.duration_minutes || ' minutes')::interval
    WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_start_room_timer_on_message ON public.messages;
CREATE TRIGGER trg_start_room_timer_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.start_room_timer_on_message();

-- 10. CLEANUP HELPER FUNCTIONS (Zero security warnings)
CREATE OR REPLACE FUNCTION public.cleanup_expired_rooms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.rooms WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.users WHERE created_at < now() - interval '24 hours';
END;
$$;

-- 11. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extend_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_links ENABLE ROW LEVEL SECURITY;

-- 12. RLS POLICIES (Users)
DROP POLICY IF EXISTS "Users viewable by everyone" ON public.users;
CREATE POLICY "Users viewable by everyone" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert users" ON public.users;
CREATE POLICY "Anyone can insert users" ON public.users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record" ON public.users FOR UPDATE USING (true);

-- 13. RLS POLICIES (Rooms)
DROP POLICY IF EXISTS "Rooms viewable by everyone" ON public.rooms;
CREATE POLICY "Rooms viewable by everyone" ON public.rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create rooms" ON public.rooms;
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Rooms can be updated" ON public.rooms;
CREATE POLICY "Rooms can be updated" ON public.rooms FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Rooms can be deleted" ON public.rooms;
CREATE POLICY "Rooms can be deleted" ON public.rooms FOR DELETE USING (true);

-- 14. RLS POLICIES (Room Members)
DROP POLICY IF EXISTS "Room members viewable" ON public.room_members;
CREATE POLICY "Room members viewable" ON public.room_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can join rooms" ON public.room_members;
CREATE POLICY "Anyone can join rooms" ON public.room_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Members can update status" ON public.room_members;
CREATE POLICY "Members can update status" ON public.room_members FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Members can be deleted" ON public.room_members;
CREATE POLICY "Members can be deleted" ON public.room_members FOR DELETE USING (true);

-- 15. RLS POLICIES (Messages)
DROP POLICY IF EXISTS "Messages viewable" ON public.messages;
CREATE POLICY "Messages viewable" ON public.messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;
CREATE POLICY "Anyone can send messages" ON public.messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Messages can be updated" ON public.messages;
CREATE POLICY "Messages can be updated" ON public.messages FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Messages can be deleted" ON public.messages;
CREATE POLICY "Messages can be deleted" ON public.messages FOR DELETE USING (true);

-- 16. RLS POLICIES (Extend Votes)
DROP POLICY IF EXISTS "Votes viewable" ON public.extend_votes;
CREATE POLICY "Votes viewable" ON public.extend_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can vote" ON public.extend_votes;
CREATE POLICY "Anyone can vote" ON public.extend_votes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Votes can be deleted" ON public.extend_votes;
CREATE POLICY "Votes can be deleted" ON public.extend_votes FOR DELETE USING (true);

-- 17. RLS POLICIES (Chat Requests)
DROP POLICY IF EXISTS "Chat requests viewable" ON public.chat_requests;
CREATE POLICY "Chat requests viewable" ON public.chat_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create chat requests" ON public.chat_requests;
CREATE POLICY "Anyone can create chat requests" ON public.chat_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Chat requests can be updated" ON public.chat_requests;
CREATE POLICY "Chat requests can be updated" ON public.chat_requests FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Chat requests can be deleted" ON public.chat_requests;
CREATE POLICY "Chat requests can be deleted" ON public.chat_requests FOR DELETE USING (true);

-- 18. RLS POLICIES (Secret Links)
DROP POLICY IF EXISTS "Secret links viewable" ON public.secret_links;
CREATE POLICY "Secret links viewable" ON public.secret_links FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create secret links" ON public.secret_links;
CREATE POLICY "Anyone can create secret links" ON public.secret_links FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Secret links can be updated" ON public.secret_links;
CREATE POLICY "Secret links can be updated" ON public.secret_links FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Secret links can be deleted" ON public.secret_links;
CREATE POLICY "Secret links can be deleted" ON public.secret_links FOR DELETE USING (true);

-- 19. ENABLE SUPABASE REALTIME WEBSOCKETS
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.extend_votes;

-- 20. STORAGE BUCKET FOR ATTACHMENTS (room-files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-files', 'room-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access room-files" ON storage.objects;
CREATE POLICY "Public Access room-files" ON storage.objects FOR SELECT USING (bucket_id = 'room-files');

DROP POLICY IF EXISTS "Public Upload room-files" ON storage.objects;
CREATE POLICY "Public Upload room-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'room-files');

DROP POLICY IF EXISTS "Public Delete room-files" ON storage.objects;
CREATE POLICY "Public Delete room-files" ON storage.objects FOR DELETE USING (bucket_id = 'room-files');
