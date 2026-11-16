import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang, Tri } from '../types';
import { translate, type TKey, type TVars } from '../i18n';
import { safeStorage, tr } from '../lib/utils';

export type ThemeMode = 'dark' | 'light' | 'system';

interface SettingsValue {
  lang: Lang;
  theme: ThemeMode;
  isDark: boolean;
  setLang: (l: Lang) => void;
  setTheme: (t: ThemeMode) => void;
  setAccent: (hex: string | null) => void;
  t: (key: TKey, vars?: TVars) => string;
  tx: (v: Tri | undefined | null) => string;
}

const Ctx = createContext<SettingsValue | null>(null);

const initialLang = (): Lang => {
  const saved = safeStorage.get('cv-lang');
  if (saved === 'uz' || saved === 'ru' || saved === 'en') return saved;
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'uz';
  return nav === 'ru' ? 'ru' : nav === 'en' ? 'en' : 'uz';
};
const initialTheme = (): ThemeMode => {
  const saved = safeStorage.get('cv-theme');
  return saved === 'light' || saved === 'system' ? saved : 'dark';
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);
  const [systemDark, setSystemDark] = useState(() => (typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)').matches : true));

  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSystemDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    safeStorage.set('cv-lang', l);
  }, []);
  const setTheme = useCallback((tm: ThemeMode) => {
    setThemeState(tm);
    safeStorage.set('cv-theme', tm);
  }, []);
  const setAccent = useCallback((hex: string | null) => {
    if (hex) document.documentElement.style.setProperty('--cv-primary', hex);
    else document.documentElement.style.removeProperty('--cv-primary');
  }, []);

  const value = useMemo<SettingsValue>(
    () => ({
      lang,
      theme,
      isDark,
      setLang,
      setTheme,
      setAccent,
      t: (key, vars) => translate(lang, key, vars),
      tx: (v) => tr(v, lang),
    }),
    [lang, theme, isDark, setLang, setTheme, setAccent]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSettings must be used inside SettingsProvider');
  return v;
}
