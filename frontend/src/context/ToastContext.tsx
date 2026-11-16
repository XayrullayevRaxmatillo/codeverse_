import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

type Kind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: Kind;
  title: string;
  text?: string;
  icon?: ReactNode;
}
interface ToastApi {
  push: (t: Omit<Toast, 'id'>, ms?: number) => void;
  success: (title: string, text?: string) => void;
  error: (title: string, text?: string) => void;
  info: (title: string, text?: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);
  const remove = useCallback((id: number) => setToasts((l) => l.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (t: Omit<Toast, 'id'>, ms = 4500) => {
      const id = idRef.current++;
      setToasts((l) => [...l.slice(-4), { ...t, id }]);
      window.setTimeout(() => remove(id), ms);
    },
    [remove]
  );
  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (title, text) => push({ kind: 'success', title, text }),
      error: (title, text) => push({ kind: 'error', title, text }, 6000),
      info: (title, text) => push({ kind: 'info', title, text }),
    }),
    [push]
  );
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:right-6 md:left-auto" aria-live="polite" role="status">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className={cn('pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-card p-4 shadow-xl', t.kind === 'error' ? 'border-red-500/40' : t.kind === 'success' ? 'border-success/40' : 'border-border')}
            >
              <span className={cn('mt-0.5 shrink-0', t.kind === 'error' ? 'text-red-400' : t.kind === 'success' ? 'text-success' : 'text-secondary')}>
                {t.icon ?? (t.kind === 'error' ? <XCircle size={20} /> : t.kind === 'success' ? <CheckCircle2 size={20} /> : <Info size={20} />)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-fg">{t.title}</p>
                {t.text && <p className="mt-0.5 text-sm text-muted">{t.text}</p>}
              </div>
              <button type="button" onClick={() => remove(t.id)} className="text-muted hover:text-fg" aria-label="Close">
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast must be used inside ToastProvider');
  return v;
}
