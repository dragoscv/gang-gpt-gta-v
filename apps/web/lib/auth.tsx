'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/trpc';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('auth-token');
    if (token) {
      // Verify token with backend
      checkAuth(token);
    } else {
      setLoading(false);
    }
  }, []);
  const checkAuth = async (token: string) => {
    try {
      const response = await apiClient.get('/trpc/auth.me', token);
      if (response.result?.data?.user) {
        setUser(response.result.data.user);
      } else {
        localStorage.removeItem('auth-token');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('auth-token');
    } finally {
      setLoading(false);
    }
  };
  const login = async (identifier: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiClient.post('/trpc/auth.login', {
        identifier, // Can be username or email
        password,
      });

      if (response.result?.data) {
        const { user: userData, accessToken } = response.result.data;
        localStorage.setItem('auth-token', accessToken);
        setUser(userData);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  const register = async (username: string, email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiClient.post('/trpc/auth.register', {
        username,
        email,
        password,
      });

      if (response.result?.data) {
        const { user: userData, accessToken } = response.result.data;
        localStorage.setItem('auth-token', accessToken);
        setUser(userData);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  const logout = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (token) {
        // Call the logout endpoint if token exists
        await apiClient.get('/trpc/auth.logout', token);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('auth-token');
      setUser(null);
      setError(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
