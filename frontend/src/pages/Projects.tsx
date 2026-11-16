import { Link } from 'react-router-dom';
import { CheckCircle2, FolderGit2, Lock } from 'lucide-react';
import { useChallenges } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { DifficultyBadge, EmptyState, ErrorState, PageHeader, PageSkeleton } from '../components/ui';
import { CourseIcon } from '../components/CourseIcon';
import { cn } from '../lib/utils';

export default function Projects() {
  const { t, tx } = useSettings();
  const q = useChallenges('project');
  if (q.isLoading) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const list = q.data ?? [];
  return (
    <div>
      <PageHeader title={t('projects.title')} subtitle={t('projects.subtitle')} icon={FolderGit2} />
      {list.length === 0 ? (
        <EmptyState title={t('common.empty')} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((p) => {
            const locked = p.status === 'locked';
            return (
              <li key={p.id} className={cn('card flex flex-col p-6', locked && 'opacity-75')}>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${p.course?.color}22`, color: p.course?.color }}>
                    <CourseIcon icon={p.course?.icon ?? 'code'} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">{tx(p.course?.title)}</p>
                    <h2 className="text-lg font-extrabold">{tx(p.title)}</h2>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DifficultyBadge difficulty={p.difficulty} />
                  <span className="chip">+150 XP</span>
                  {p.status === 'completed' && (
                    <span className="chip border-success/40 text-success">
                      <CheckCircle2 size={13} /> {t('projects.done')}
                    </span>
                  )}
                </div>
                <div className="mt-auto pt-5">
                  {locked ? (
                    <p className="flex items-center gap-2 text-sm text-muted">
                      <Lock size={16} /> {t('projects.locked')}
                    </p>
                  ) : (
                    <Link to={`/project/${p.id}`} className="btn-primary w-full">
                      {t('projects.open')}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
