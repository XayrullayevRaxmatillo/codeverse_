import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock, Map as MapIcon, Sparkles, UserPlus } from 'lucide-react';
import { useCourses } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { ErrorState, PageHeader, PageSkeleton, ProgressBar } from '../components/ui';
import { CourseIcon } from '../components/CourseIcon';
import { cn } from '../lib/utils';

export default function WorldMap() {
  const { t, tx } = useSettings();
  const { user } = useAuth();
  const q = useCourses();
  if (q.isLoading) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const courses = q.data ?? [];
  const titleOf = (slug: string | null) => tx(courses.find((c) => c.slug === slug)?.title);

  return (
    <div>
      <PageHeader title={t('map.title')} subtitle={t('map.subtitle')} icon={MapIcon} />
      {!user && (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 border-secondary/40 p-4">
          <p className="flex items-center gap-2 text-sm">
            <Sparkles size={18} className="text-secondary" /> {t('map.guestHint')}
          </p>
          <Link to="/register" className="btn-primary btn-sm">
            <UserPlus size={16} /> {t('common.register')}
          </Link>
        </div>
      )}
      <ol className="relative grid gap-6 md:grid-cols-2">
        {courses.map((c, i) => {
          const locked = !c.unlocked || c.comingSoon;
          const inner = (
            <motion.div
              className={cn('card relative h-full overflow-hidden p-6 transition', !locked && 'hover:-translate-y-1 hover:shadow-2xl', locked && 'opacity-75')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{ borderColor: locked ? undefined : `${c.color}66` }}
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30 blur-3xl" style={{ background: c.color }} aria-hidden="true" />
              <div className="relative flex items-start gap-4">
                <motion.span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl" style={{ background: `${c.color}26`, color: c.color }} animate={locked ? undefined : { y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3, delay: i * 0.3 }}>
                  <CourseIcon icon={c.icon} size={32} />
                </motion.span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted">#{c.order}</p>
                  <h2 className="text-xl font-extrabold">{tx(c.title)}</h2>
                  <p className="mt-1 text-sm text-muted">{tx(c.description)}</p>
                </div>
                {c.complete ? <CheckCircle2 className="text-success" aria-label={t('map.complete')} /> : locked ? <Lock className="text-muted" aria-hidden="true" /> : null}
              </div>
              <div className="relative mt-5">
                {c.comingSoon ? (
                  <span className="chip">{t('map.comingSoon')}</span>
                ) : (
                  <>
                    <div className="mb-2 flex justify-between text-xs text-muted">
                      <span>
                        {t('common.modules', { n: c.moduleCount })} · {t('common.lessons', { n: c.lessonCount ?? 0 })}
                      </span>
                      <span>{c.stats?.percent ?? 0}%</span>
                    </div>
                    <ProgressBar value={c.stats?.percent ?? 0} label={tx(c.title)} color={c.color} />
                    {locked && c.prerequisite && user && <p className="mt-3 text-xs text-warning">{t('map.lockedHint', { course: titleOf(c.prerequisite) })}</p>}
                  </>
                )}
              </div>
            </motion.div>
          );
          return (
            <li key={c.slug}>
              {c.comingSoon || (!c.unlocked && user) ? (
                <div aria-disabled="true">{inner}</div>
              ) : (
                <Link to={`/course/${c.slug}`} className="block h-full no-underline" aria-label={`${tx(c.title)} — ${t('map.open')}`}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
