import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Trophy, UserPlus } from 'lucide-react';
import { addFriend, useLeaderboard, useUserMutation } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, EmptyState, ErrorState, PageHeader, Segmented, Skeleton } from '../components/ui';
import { cn, fmtNumber } from '../lib/utils';
import { errorMessage } from '../lib/api';

type Period = 'daily' | 'weekly' | 'monthly' | 'all';

export default function Leaderboard() {
  const { t, tx, lang } = useSettings();
  const { user } = useAuth();
  const toast = useToast();
  const [period, setPeriod] = useState<Period>('weekly');
  const [scope, setScope] = useState<'global' | 'friends'>('global');
  const [friend, setFriend] = useState('');
  const q = useLeaderboard(period, scope);
  const add = useUserMutation(addFriend);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    try {
      await add.mutateAsync(friend.trim().toLowerCase());
      toast.success(t('leaderboard.friendAdded'));
      setFriend('');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const rows = q.data?.rows ?? [];
  const medal = (r: number) => (r === 1 ? 'text-amber-400' : r === 2 ? 'text-slate-300' : r === 3 ? 'text-orange-400' : 'text-muted');

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t('leaderboard.title')} subtitle={t('leaderboard.subtitle')} icon={Trophy} />
      <div className="mb-4 flex flex-wrap gap-3">
        <Segmented label="period" value={period} onChange={setPeriod} options={(['daily', 'weekly', 'monthly', 'all'] as Period[]).map((p) => ({ value: p, label: t(`leaderboard.periods.${p}`) }))} />
        {user && <Segmented label="scope" value={scope} onChange={setScope} options={[{ value: 'global', label: t('leaderboard.scopes.global') }, { value: 'friends', label: t('leaderboard.scopes.friends') }]} />}
      </div>
      {user && (
        <form onSubmit={onAdd} className="card mb-4 flex flex-wrap items-center gap-2 p-3">
          <label htmlFor="friend" className="sr-only">
            {t('leaderboard.addFriend')}
          </label>
          <input id="friend" className="input min-w-0 flex-1" placeholder={t('leaderboard.friendPlaceholder')} value={friend} onChange={(e) => setFriend(e.target.value)} />
          <button type="submit" className="btn-secondary" disabled={!friend.trim() || add.isPending}>
            <UserPlus size={16} /> {t('leaderboard.addFriend')}
          </button>
        </form>
      )}
      {q.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Trophy} title={t('leaderboard.empty')} />
      ) : (
        <ol className="space-y-2" aria-label={t('leaderboard.title')}>
          {rows.map((r, i) => {
            const me = user?.id === r.id;
            return (
              <motion.li key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
                <Link to={`/u/${r.username}`} className={cn('card flex items-center gap-3 p-3 no-underline transition hover:border-primary/50', me && 'border-primary/70 bg-primary/10')}>
                  <span className={cn('w-8 text-center text-lg font-black', medal(r.rank))}>{r.rank <= 3 ? <Crown size={20} className="mx-auto" aria-label={`#${r.rank}`} /> : r.rank}</span>
                  <Avatar equipped={r.equipped} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-fg">
                      {r.displayName} {me && <span className="chip ml-1">{t('leaderboard.you')}</span>}
                    </p>
                    <p className="truncate text-xs text-muted">
                      @{r.username} · {t('common.level')} {r.level.level} {tx(r.level.name)}
                    </p>
                  </div>
                  <span className="font-mono font-black text-secondary">{fmtNumber(r.xp, lang)} XP</span>
                </Link>
              </motion.li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
