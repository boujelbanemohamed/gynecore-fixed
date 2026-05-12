import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

export type UserRole = 'DOCTOR' | 'ASSISTANT' | 'SECRETARY' | 'PATIENT';
export interface AuthUser { id: string; email: string; firstName: string; lastName: string; role: UserRole; patientId?: string; doctorId?: string; }
interface AuthContextType { user: AuthUser | null; token: string | null; loading: boolean; loginDoctor: (email: string, password: string) => Promise<void>; loginPatient: (email: string, password: string) => Promise<void>; loginSecretary: (email: string, password: string) => Promise<void>; logout: () => void; setUser: (u: any) => void; isDoctor: boolean; isPatient: boolean; isSecretary: boolean; }

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data.data);
          setToken(savedToken);
        } catch {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const loginDoctor = async (email: string, password: string) => {
    const res = await authAPI.loginDoctor(email, password);
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('token', t);
    setToken(t); setUser(u);
  };

  const loginPatient = async (email: string, password: string) => {
    const res = await authAPI.loginPatient(email, password);
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('token', t);
    setToken(t); setUser(u);
  };

  const loginSecretary = async (email: string, password: string) => {
    const res = await authAPI.loginSecretary(email, password);
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('token', t);
    setToken(t); setUser(u);
  };

  const logout = () => {
    const isPatient = user?.role === 'PATIENT';
    const isSec = user?.role === 'SECRETARY';
    localStorage.removeItem('token');
    setToken(null); setUser(null);
    window.location.href = isPatient ? '/patient/login' : isSec ? '/secretary/login' : '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginDoctor, loginPatient, loginSecretary, logout, setUser, isDoctor: user?.role === 'DOCTOR' || user?.role === 'ASSISTANT', isPatient: user?.role === 'PATIENT', isSecretary: user?.role === 'SECRETARY' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
