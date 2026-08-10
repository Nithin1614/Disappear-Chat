import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const UserContext = createContext(null);

const USER_ID_KEY = 'vanishchat-user-id';
const DISPLAY_NAME_KEY = 'vanishchat-display-name';
const USER_CREATED_AT_KEY = 'vanishchat-user-created-at';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function UserProvider({ children }) {
  const [userId, setUserId] = useState(() => {
    try {
      const createdAt = localStorage.getItem(USER_CREATED_AT_KEY);
      if (createdAt && (Date.now() - parseInt(createdAt, 10) > TWENTY_FOUR_HOURS_MS)) {
        localStorage.removeItem(USER_ID_KEY);
        localStorage.removeItem(DISPLAY_NAME_KEY);
        localStorage.removeItem(USER_CREATED_AT_KEY);
        return null;
      }
      return localStorage.getItem(USER_ID_KEY) || null;
    } catch {
      return null;
    }
  });

  const [displayName, setDisplayName] = useState(() => {
    try {
      return localStorage.getItem(DISPLAY_NAME_KEY) || '';
    } catch {
      return '';
    }
  });

  // Call Supabase DB cleanup function for 24h expired users
  useEffect(() => {
    async function runCleanup() {
      try {
        await supabase.rpc('cleanup_expired_users');
      } catch {
        // cleanup failed or function missing
      }
    }
    runCleanup();
  }, []);

  const setUser = useCallback((newUserId, newDisplayName = '') => {
    setUserId(newUserId);
    setDisplayName(newDisplayName);
    const nowTs = Date.now().toString();
    try {
      localStorage.setItem(USER_ID_KEY, newUserId);
      localStorage.setItem(USER_CREATED_AT_KEY, nowTs);
      if (newDisplayName) {
        localStorage.setItem(DISPLAY_NAME_KEY, newDisplayName);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const clearUser = useCallback(() => {
    setUserId(null);
    setDisplayName('');
    try {
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(DISPLAY_NAME_KEY);
      localStorage.removeItem(USER_CREATED_AT_KEY);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const isAuthenticated = Boolean(userId);

  return (
    <UserContext.Provider
      value={{ userId, displayName, setUser, clearUser, isAuthenticated }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
