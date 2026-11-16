import type { Lang, Tri } from '../types';

export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/** {uz,ru,en} dan tanlangan til (bo'sh bo'lsa uz → en) */
export const tr = (t: Tri | undefined | null, lang: Lang) => (t ? t[lang] || t.uz || t.en || '' : '');

export const fmtNumber = (n: number, lang: Lang) => new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : 'uz-UZ').format(n);

export const fmtDate = (d: string | Date, lang: Lang) =>
  new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : 'uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d));

export const fmtDuration = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** UTC+5 bo'yicha kun kaliti (server bilan bir xil) */
export const dayKey = (d = new Date()) => new Date(d.getTime() + 5 * 3600_000).toISOString().slice(0, 10);

export const safeStorage = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};
