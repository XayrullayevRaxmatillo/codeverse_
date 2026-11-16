import { safeStorage } from './utils';

// Mehmon (ro'yxatdan o'tmagan) progressi faqat brauzerda saqlanadi
const KEY = 'cv-guest-progress';

export interface GuestProgress {
  completed: string[];
}

export function readGuest(): GuestProgress {
  try {
    const v = JSON.parse(safeStorage.get(KEY) || '{}') as Partial<GuestProgress>;
    return { completed: Array.isArray(v.completed) ? v.completed.filter((x) => typeof x === 'string') : [] };
  } catch {
    return { completed: [] };
  }
}

export function markGuestCompleted(lessonId: string) {
  const g = readGuest();
  if (!g.completed.includes(lessonId)) g.completed.push(lessonId);
  safeStorage.set(KEY, JSON.stringify(g));
}

export const clearGuest = () => safeStorage.remove(KEY);
