import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  authAPI,
  USE_MOCK_DATA,
  switchMockRole,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  AUTH_EXPIRED_EVENT,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(USER_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  const persistSession = useCallback((payload) => {
    const profile = {
      _id: payload._id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
    if (payload.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, payload.token);
    }
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const profile = await authAPI.getProfile();
        if (active) {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
          setUser(profile);
        }
      } catch {
        if (active) {
          clearSession();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    hydrate();

    const onExpired = () => clearSession();
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => {
      active = false;
      window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
    };
  }, [clearSession]);

  const login = useCallback(
    async ({ email, password }) => {
      const data = await authAPI.login({ email, password });
      return persistSession(data);
    },
    [persistSession]
  );

  const register = useCallback(
    async ({ name, email, password }) => {
      const data = await authAPI.register({ name, email, password });
      return persistSession(data);
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const toggleMockRole = useCallback(async () => {
    if (!USE_MOCK_DATA) return null;
    const updated = await switchMockRole();
    if (updated) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);
    }
    return updated;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authLoading: loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        toggleMockRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
