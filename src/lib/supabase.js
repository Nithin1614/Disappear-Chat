import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://bcrdgwapnggldircyjoi.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcmRnd2FwbmdnbGRpcmN5am9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMzg1MzMsImV4cCI6MjEwMTkxNDUzM30.evmMRhy9Vutv3eKWOCKKlxuIId4bQmvOnEIkh6JLqIQ';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
