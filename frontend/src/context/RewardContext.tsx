import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Coins, Sparkles, Zap } from 'lucide-react';
import type { LevelInfo, Reward } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useSettings } from './SettingsContext';
import { Confetti } from '../components/game/Confetti';

interface RewardApi {
  celebrate: (r: Reward | null | undefined) => void;
}
const Ctx = createContext<RewardApi | null>(null);

export function RewardProvider({ children }: { children: ReactNode }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const { t, tx } = useSettings();
  const [levelUp, setLevelUp] = useState<LevelInfo | null>(null);

  const celebrate = useCallback(
    (r: Reward | null | undefined) => {
      if (!r) return;
      if (r.user) setUser(r.user);
      if (r.gained.xp > 0 || r.gained.coins > 0) {
        toast.push({
          kind: 'success',
          title: [r.gained.xp > 0 ? t('rewards.xp', { n: r.gained.xp }) : '', r.gained.coins > 0 ? t('rewards.coins', { n: r.gained.coins }) : ''].filter(Boolean).join(' · '),
          text: r.streak && r.streak.current > 1 ? t('rewards.streak', { n: r.streak.current }) : t('rewards.great'),
          icon: r.gained.xp > 0 ? <Zap size={20} /> : <Coins size={20} />,
        });
      }
      for (const a of r.achievements ?? []) {
        toast.push({ kind: 'success', title: `${t('rewards.achievement')} ${tx(a.title)}`, text: tx(a.description), icon: <Award size={20} /> }, 6000);
      }
      if (r.levelUp) setLevelUp(r.levelUp);
    },
    [setUser, toast, t, tx]
  );

  const value = useMemo(() => ({ celebrate }), [celebrate]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} />
    </Ctx.Provider>
  );
}

function LevelUpModal({ level, onClose }: { level: LevelInfo | null; onClose: () => void }) {
  const { t, tx } = useSettings();
  const btn = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!level) return;
    btn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [level]);
  return (
    <AnimatePresence>
      {level && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <Confetti />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="levelup-title"
            className="relative w-full max-w-sm rounded-3xl border border-primary/40 bg-card p-8 text-center shadow-2xl"
            initial={{ scale: 0.6, rotate: -4 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div className="mx-auto mb-4 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-4xl font-black text-white shadow-lg" animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
              {level.level}
            </motion.div>
            <p className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest text-secondary">
              <Sparkles size={16} /> {t('rewards.levelUp')}
            </p>
            <h2 id="levelup-title" className="mt-2 text-2xl font-extrabold text-fg">
              {tx(level.name)}
            </h2>
            <p className="mt-2 text-muted">{t('rewards.levelUpText', { n: level.level, name: tx(level.name) })}</p>
            <button ref={btn} type="button" onClick={onClose} className="btn-primary mt-6 w-full">
              {t('rewards.great')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useReward() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useReward must be used inside RewardProvider');
  return v;
}
