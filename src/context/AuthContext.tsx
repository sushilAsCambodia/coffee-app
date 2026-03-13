import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, AuthUser, setToken } from '../services/api';

const USER_KEY = '@coffee_app_user';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updated: AuthUser) => Promise<void>;
  loginWithGoogle?: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      if (raw) {
        // Verify the stored token is still valid by hitting /auth/me
        const me = await api.getMe();
        setUser(me);
      }
    } catch {
      // Token expired or invalid — clear everything
      await api.clearSession();
      await AsyncStorage.removeItem(USER_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { user: u, token } = await api.login(email, password);
    await setToken(token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    const { user: u, token } = await api.register(name, email, password);
    await setToken(token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const loginWithGoogle = async (token: string) => {
    await setToken(token);
    const me = await api.getMe();
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(me));
    setUser(me);
  };

  const logout = async () => {
    await api.logout();
    await api.clearSession();
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const updateUser = async (updated: AuthUser) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
