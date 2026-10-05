import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, getStoredToken, setStoredToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const curToken = getStoredToken();
    if (!curToken) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const data = await authApi.me();
      setAdmin(data.admin || { role: 'admin' });
    } catch (err) {
      console.warn('Failed to verify existing session:', err.message);
      setStoredToken('');
      setToken('');
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    const handleUnauthorized = () => {
      setToken('');
      setAdmin(null);
    };

    window.addEventListener('endorphins:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('endorphins:unauthorized', handleUnauthorized);
    };
  }, [fetchProfile]);

  const login = async (password) => {
    const data = await authApi.login({ password });
    if (data.access_token) {
      setToken(data.access_token);
      await fetchProfile();
    }
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignored
    } finally {
      setToken('');
      setAdmin(null);
      setStoredToken('');
    }
  };

  const value = {
    token,
    admin,
    isAuthenticated: Boolean(token),
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
