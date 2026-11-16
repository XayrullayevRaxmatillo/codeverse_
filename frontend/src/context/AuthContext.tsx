import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../lib/api';
import type { User } from '../types';
import { useSettings } from './SettingsContext';
import { THEMES } from '../lib/cosmetics';
import { clearGuest, readGuest } from '../lib/guest';

interface AuthValue {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  login: (login: string, password: string) => Promise<User>;
  register: (data: { username: string; displayName: string; email: string; password: string }) => Promise<{ user: User; imported: number }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);
export const ME_KEY = ['me'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { lang, setAccent, setLang, setTheme } = useSettings();
  const me = useQuery({ queryKey: ME_KEY, queryFn: () => get<{ user: User | null }>('/auth/me').then((r) => r.user), staleTime: 30_000, retry: 1 });
  const user = me.data ?? null;

  const setUser = useCallback((u: User | null) => qc.setQueryData(ME_KEY, u), [qc]);

  // Tanlangan mavzu rangi (do'kondan) — butun ilovaga
  useEffect(() => {
    setAccent(user ? THEMES[user.equipped.theme] ?? null : null);
  }, [user, setAccent]);

  const afterAuth = useCallback(
    async (u: User) => {
      setUser(u);
      await qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
    },
    [qc, setUser]
  );

  const login = useCallback(
    async (loginValue: string, password: string) => {
      const r = await post<{ user: User }>('/auth/login', { login: loginValue, password });
      // Akkauntda saqlangan til va mavzuni qo'llash
      setLang(r.user.settings.lang);
      setTheme(r.user.settings.theme);
      await afterAuth(r.user);
      return r.user;
    },
    [afterAuth, setLang, setTheme]
  );

  const register = useCallback(
    async (data: { username: string; displayName: string; email: string; password: string }) => {
      const r = await post<{ user: User }>('/auth/register', { ...data, lang });
      let imported = 0;
      const guest = readGuest();
      if (guest.completed.length) {
        try {
          imported = (await post<{ imported: number }>('/progress/import-guest', { lessonIds: guest.completed })).imported;
          clearGuest();
        } catch {
          /* mehmon progressi ixtiyoriy */
        }
      }
      await afterAuth(r.user);
      return { user: r.user, imported };
    },
    [afterAuth, lang]
  );

  const logout = useCallback(async () => {
    await post('/auth/logout').catch(() => undefined);
    setUser(null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
  }, [qc, setUser]);

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ME_KEY });
  }, [qc]);

  const value = useMemo<AuthValue>(() => ({ user, loading: me.isLoading, setUser, login, register, logout, refresh }), [user, me.isLoading, setUser, login, register, logout, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
