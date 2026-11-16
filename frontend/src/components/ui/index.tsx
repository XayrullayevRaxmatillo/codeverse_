import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Inbox, Loader2, RefreshCw, X, type LucideIcon } from 'lucide-react';
import type { Difficulty, Equipped } from '../../types';
import { cn } from '../../lib/utils';
import { useSettings } from '../../context/SettingsContext';
import { AVATARS, FRAMES } from '../../lib/cosmetics';
import { errorMessage } from '../../lib/api';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin', className)} aria-hidden="true" />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

export function PageSkeleton() {
  const { t } = useSettings();
  return (
    <div className="space-y-4" role="status" aria-label={t('common.loading')}>
      <Skeleton className="h-10 w-1/3" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
        <Icon size={26} aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="max-w-md text-muted">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useSettings();
  return (
    <div className="card flex flex-col items-center gap-3 p-8 text-center" role="alert">
      <AlertTriangle className="text-warning" size={32} aria-hidden="true" />
      <h3 className="text-lg font-bold">{t('common.error')}</h3>
      <p className="max-w-md text-muted">{errorMessage(error)}</p>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          <RefreshCw size={16} /> {t('common.retry')}
        </button>
      )}
    </div>
  );
}

export function ProgressBar({ value, label, className, color }: { value: number; label: string; className?: string; color?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn('h-2.5 overflow-hidden rounded-full bg-card-2', className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <motion.div className="h-full rounded-full" style={{ background: color ?? 'linear-gradient(90deg, var(--cv-primary), var(--cv-secondary))' }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
    </div>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { t } = useSettings();
  const cls = difficulty === 'easy' ? 'text-success border-success/40' : difficulty === 'medium' ? 'text-warning border-warning/40' : 'text-danger border-danger/40';
  return <span className={cn('chip', cls)}>{t(`common.difficulty.${difficulty}`)}</span>;
}

export function Avatar({ equipped, size = 40, className }: { equipped?: Equipped | null; size?: number; className?: string }) {
  const emoji = AVATARS[equipped?.avatar ?? ''] ?? '🚀';
  const frame = FRAMES[equipped?.frame ?? ''] ?? '';
  return (
    <span className={cn('inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/30', frame, className)} style={{ width: size, height: size, fontSize: size * 0.52 }} aria-hidden="true">
      {emoji}
    </span>
  );
}

export function PageHeader({ title, subtitle, icon: Icon, action }: { title: string; subtitle?: string; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {Icon && (
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
              <Icon size={22} aria-hidden="true" />
            </span>
          )}
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatTile({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: ReactNode; accent?: string }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${accent ?? 'var(--cv-primary)'} 18%, transparent)`, color: accent ?? 'var(--cv-primary)' }}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-extrabold leading-tight">{value}</p>
        <p className="truncate text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-border bg-card-2 p-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)} className={cn('min-h-9 rounded-xl px-3 text-sm font-semibold transition', o.value === value ? 'bg-card text-fg shadow' : 'text-muted hover:text-fg')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn('card max-h-[90vh] w-full overflow-y-auto p-6 shadow-2xl outline-none', wide ? 'max-w-3xl' : 'max-w-md')}
            initial={{ y: 20, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold">{title}</h2>
              <button type="button" className="btn-ghost btn-sm btn-icon" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({ open, title, text, confirmLabel, danger, onConfirm, onCancel }: { open: boolean; title: string; text: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useSettings();
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-muted">{text}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
