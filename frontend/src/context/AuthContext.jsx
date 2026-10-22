import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api.js';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const clearSession = () => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      if (active) {
        setUser(null);
        setToken(null);
      }
    };

    const restoreSession = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      let cachedUser;

      try {
        cachedUser = storedUser ? JSON.parse(storedUser) : null;
      } catch {
        cachedUser = null;
      }

      if (!storedToken || !cachedUser || storedToken.startsWith('mock-token-')) {
        clearSession();
        if (active) setLoading(false);
        return;
      }

      setToken(storedToken);
      setUser(cachedUser);

      try {
        const { user: verifiedUser } = await authAPI.getMe();
        if (active && verifiedUser) {
          setUser(verifiedUser);
          localStorage.setItem('user', JSON.stringify(verifiedUser));
        }
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          clearSession();
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleExpiredSession = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:session-expired', handleExpiredSession);
    return () => window.removeEventListener('auth:session-expired', handleExpiredSession);
  }, []);

  const login = (userData, authToken) => {
    if (!userData || !authToken) throw new Error('The server did not return a valid session. Please try again.');
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success('You have signed out successfully.');
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
