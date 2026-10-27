import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [role, setRole] = useState(() => localStorage.getItem('role') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          setRole(profile.role);
          localStorage.setItem('user', JSON.stringify(profile));
          localStorage.setItem('role', profile.role);
        } catch (error) {
          console.warn('Session expired or invalid:', error.message);
          // If profile fetch fails, keep basic cached data or allow logout
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (identifier, password) => {
    const data = await authApi.login(identifier, password);
    const authToken = data.token || data.access;
    const userRole = data.role;
    const userData = data.user || { email: identifier, role: userRole };

    setToken(authToken);
    setRole(userRole);
    setUser(userData);

    localStorage.setItem('token', authToken);
    localStorage.setItem('role', userRole);
    localStorage.setItem('user', JSON.stringify(userData));

    return { token: authToken, role: userRole, user: userData };
  };

  const register = async (userData) => {
    return await authApi.register(userData);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    try {
      localStorage.removeItem('medq_cart_guest');
      localStorage.removeItem('medq_cart_items');
    } catch {
      // ignore
    }
  };

  const value = {
    user,
    role,
    token,
    loading,
    isAuthenticated: Boolean(token),
    isAdmin: role?.toLowerCase() === 'admin' || user?.is_admin || user?.role?.toLowerCase() === 'admin',
    isDeliveryPerson: role?.toLowerCase() === 'delivery_person' || user?.is_delivery_person || user?.role?.toLowerCase() === 'delivery_person',
    login,
    register,
    logout,
    updateUser: (updatedUser) => {
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
