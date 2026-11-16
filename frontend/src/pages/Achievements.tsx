import { Medal } from 'lucide-react';
import { useAchievements } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { ErrorState, PageHeader, PageSkeleton, ProgressBar } from '../components/ui';
import { AchievementBadge } from '../components/game/AchievementBadge';

export default function Achievements() {
  const { t } = useSettings();
  const q = useAchievements();
  if (q.isLoading) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const list = q.data ?? [];
  const unlocked = list.filter((a) => a.unlocked).length;
  return (
    <div>
      <PageHeader title={t('achievements.title')} subtitle={t('achievements.subtitle')} icon={Medal} />
      <div className="card mb-6 p-4">
        <p className="mb-2 text-sm font-semibold">{t('achievements.unlocked', { n: unlocked, m: list.length })}</p>
        <ProgressBar value={list.length ? (unlocked / list.length) * 100 : 0} label={t('achievements.title')} />
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[...list]
          .sort((a, b) => Number(!!b.unlocked) - Number(!!a.unlocked))
          .map((a) => (
            <li key={a.key}>
              <AchievementBadge a={a} />
            </li>
          ))}
      </ul>
    </div>
  );
}
