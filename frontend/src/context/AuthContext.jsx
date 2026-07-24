import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auraPlanToken');
      const cachedUser = localStorage.getItem('auraPlanUser');

      if (token && cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          // Validate token with a quick profile check
          const res = await api.get('/auth/profile');
          setUser(res.data);
          localStorage.setItem('auraPlanUser', JSON.stringify(res.data));
        } catch (err) {
          console.error('Failed to validate token on launch', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for custom logout triggers from api interceptor
    const handleInterceptorLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth-logout', handleInterceptorLogout);
    return () => {
      window.removeEventListener('auth-logout', handleInterceptorLogout);
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: loggedUser } = res.data;
    localStorage.setItem('auraPlanToken', token);
    localStorage.setItem('auraPlanUser', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (email, password, name, role) => {
    const res = await api.post('/auth/register', { email, password, name, role });
    const { token, user: newUser } = res.data;
    localStorage.setItem('auraPlanToken', token);
    localStorage.setItem('auraPlanUser', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    const { token, user: updatedUser } = res.data;
    if (token) localStorage.setItem('auraPlanToken', token);
    localStorage.setItem('auraPlanUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = () => {
    localStorage.removeItem('auraPlanToken');
    localStorage.removeItem('auraPlanUser');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
