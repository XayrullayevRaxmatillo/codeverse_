import { Atom, Award, BookOpen, Code2, Compass, Crown, Flame, Lock, Medal, Palette, Server, Star, Swords, Target, TreePalm, Zap, type LucideIcon } from 'lucide-react';
import type { AchievementInfo } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { cn } from '../../lib/utils';

const ICONS: Record<string, LucideIcon> = { book: BookOpen, code: Code2, target: Target, compass: Compass, palette: Palette, atom: Atom, server: Server, crown: Crown, island: TreePalm, flame: Flame, star: Star, medal: Medal, swords: Swords, zap: Zap };
const RARITY: Record<string, string> = { common: '#94a3b8', rare: '#00d4ff', epic: '#a78bfa', legendary: '#f59e0b' };

export function AchievementBadge({ a, compact }: { a: AchievementInfo; compact?: boolean }) {
  const { t, tx } = useSettings();
  const Icon = ICONS[a.icon] ?? Award;
  const color = RARITY[a.rarity] ?? RARITY.common;
  const locked = a.unlocked === false;
  return (
    <div className={cn('flex flex-col items-center gap-2 rounded-2xl border p-3 text-center', locked ? 'border-border opacity-60' : 'border-transparent')} style={locked ? undefined : { background: `color-mix(in oklab, ${color} 12%, transparent)`, borderColor: `color-mix(in oklab, ${color} 40%, transparent)` }}>
      <span className="relative grid h-12 w-12 place-items-center rounded-full" style={{ background: locked ? 'var(--cv-card-2)' : `color-mix(in oklab, ${color} 25%, transparent)`, color: locked ? 'var(--cv-muted)' : color }}>
        {locked ? <Lock size={20} /> : <Icon size={22} />}
      </span>
      <p className="text-sm font-bold leading-tight">{tx(a.title)}</p>
      {!compact && <p className="text-xs text-muted">{tx(a.description)}</p>}
      {!compact && (
        <span className="chip" style={{ color }}>
          {t(`achievements.rarity.${a.rarity}`)}
          {a.rewardCoins ? ` · ${t('achievements.reward', { n: a.rewardCoins })}` : ''}
        </span>
      )}
    </div>
  );
}
