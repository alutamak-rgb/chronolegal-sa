'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getPb } from '@/lib/pocketbase';
import type { RecordModel } from 'pocketbase';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  firmName?: string;
  tokens: number;
  subscriptionStatus?: string;
  trialEndsAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, firmName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pb = getPb();
    if (pb.authStore.isValid) {
      const m = pb.authStore.model as RecordModel;
      setUser(mapUser(m));
    }
    setLoading(false);

    const unsub = pb.authStore.onChange(() => {
      const m = pb.authStore.model as RecordModel | null;
      setUser(m ? mapUser(m) : null);
    });

    return () => { unsub(); };
  }, []);

  function mapUser(m: RecordModel): AuthUser {
    return {
      id: m.id,
      email: m.email,
      name: m.get('name') || '',
      firmName: m.get('firmName') || '',
      tokens: m.get('tokens') || 0,
      subscriptionStatus: m.get('subscriptionStatus') || '',
      trialEndsAt: m.get('trialEndsAt') || '',
    };
  }

  async function login(email: string, password: string) {
    const pb = getPb();
    const result = await pb.collection('users').authWithPassword(email, password);
    setUser(mapUser(result.record));
  }

  async function register(email: string, password: string, name: string, firmName: string) {
    const pb = getPb();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name,
      firmName,
      tokens: 1,
      subscriptionStatus: 'trial',
      trialEndsAt: trialEnd.toISOString(),
    });
    await login(email, password);
  }

  function logout() {
    getPb().authStore.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}