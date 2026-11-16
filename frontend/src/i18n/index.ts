import uz, { type Dictionary } from './uz';
import ru from './ru';
import en from './en';
import type { Lang } from '../types';

export const DICTS: Record<Lang, Dictionary> = { uz, ru, en };
export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
type Paths<T> = { [K in keyof T]: T[K] extends string ? K & string : Join<K, Paths<T[K]>> }[keyof T];
export type TKey = Paths<Dictionary>;
export type TVars = Record<string, string | number>;

export function translate(lang: Lang, key: TKey | string, vars?: TVars): string {
  let node: unknown = DICTS[lang];
  for (const part of key.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
  if (typeof node !== 'string') {
    // zaxira: o'zbekcha, keyin kalitning o'zi
    let fb: unknown = DICTS.uz;
    for (const part of key.split('.')) fb = (fb as Record<string, unknown> | undefined)?.[part];
    node = typeof fb === 'string' ? fb : key;
  }
  let s = node as string;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
