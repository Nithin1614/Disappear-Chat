import { createContext, useContext, useState, useCallback } from 'react';

const UserContext = createContext(null);

const USER_ID_KEY = 'vanishchat-user-id';
const DISPLAY_NAME_KEY = 'vanishchat-display-name';

export function UserProvider({ children }) {
  const [userId, setUserId] = useState(() => {
    try {
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

  const setUser = useCallback((newUserId, newDisplayName = '') => {
    setUserId(newUserId);
    setDisplayName(newDisplayName);
    try {
      localStorage.setItem(USER_ID_KEY, newUserId);
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
