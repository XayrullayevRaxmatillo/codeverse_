import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, BookOpen, Check, ChevronLeft, FolderGit2, GraduationCap, Lock, Play, Star, Trophy, UserPlus } from 'lucide-react';
import { claimCertificate, useCourse } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ErrorState, PageSkeleton, ProgressBar, Spinner } from '../components/ui';
import { CourseIcon } from '../components/CourseIcon';
import { cn } from '../lib/utils';
import { readGuest } from '../lib/guest';
import { errorMessage } from '../lib/api';
import type { NodeStatus } from '../types';

const NODE_STYLE: Record<NodeStatus, string> = {
  locked: 'bg-card-2 text-muted border-border',
  available: 'bg-primary text-white border-primary shadow-[0_0_0_6px_color-mix(in_oklab,var(--cv-primary)_25%,transparent)]',
  in_progress: 'bg-secondary text-[#04202a] border-secondary shadow-[0_0_0_6px_color-mix(in_oklab,var(--cv-secondary)_25%,transparent)]',
  completed: 'bg-success text-[#04130a] border-success',
  mastered: 'bg-gradient-to-br from-amber-300 to-orange-500 text-[#2a1600] border-amber-300',
};
const NodeIcon = ({ s }: { s: NodeStatus }) => (s === 'locked' ? <Lock size={20} /> : s === 'completed' ? <Check size={22} /> : s === 'mastered' ? <Star size={22} className="fill-current" /> : <Play size={20} className="fill-current" />);

export default function CourseMap() {
  const { slug } = useParams();
  const { t, tx } = useSettings();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const q = useCourse(slug);
  const [claiming, setClaiming] = useState(false);
  if (q.isLoading) return <PageSkeleton />;
  if (q.isError || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const c = q.data;
  const guestDone = new Set(user ? [] : readGuest().completed);

  async function claim() {
    setClaiming(true);
    try {
      const r = await claimCertificate(c.slug);
      toast.success(t('certificates.claimed'));
      nav(`/verify/${r.certificate.code}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div>
      <Link to="/map" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted no-underline hover:text-fg">
        <ChevronLeft size={16} /> {t('nav.map')}
      </Link>
      <header className="card relative mb-8 overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl" style={{ background: c.color }} aria-hidden="true" />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="grid h-20 w-20 place-items-center rounded-3xl" style={{ background: `${c.color}26`, color: c.color }}>
            <CourseIcon icon={c.icon} size={40} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black">{tx(c.title)}</h1>
            <p className="mt-1 max-w-2xl text-muted">{tx(c.description)}</p>
            {user && (
              <div className="mt-4 max-w-md">
                <ProgressBar value={c.stats?.percent ?? 0} label={tx(c.title)} color={c.color} />
                <p className="mt-1 text-xs text-muted">
                  {t('course.lessonsDone', { done: c.stats?.doneLessons ?? 0, total: c.stats?.totalLessons ?? 0 })} · {c.stats?.examsPassed ?? 0}/{c.stats?.totalExams ?? 0} {t('dashboard.exams').toLowerCase()}
                </p>
              </div>
            )}
          </div>
          {user && (
            <div>
              {c.certificate ? (
                <Link to={`/verify/${c.certificate}`} className="btn-success">
                  <GraduationCap size={18} /> {t('course.viewCertificate')}
                </Link>
              ) : (
                <button type="button" className="btn-secondary" disabled={!c.complete || claiming} onClick={claim} title={t('course.certificateHint')}>
                  {claiming ? <Spinner className="h-4 w-4" /> : <Award size={18} />} {t('course.getCertificate')}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {!user && (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted">{t('lesson.guestBanner')}</p>
          <Link to="/register" className="btn-primary btn-sm">
            <UserPlus size={16} /> {t('course.guestRegister')}
          </Link>
        </div>
      )}

      <div className="space-y-10">
        {c.modules.map((m, mi) => (
          <section key={m.id} aria-labelledby={`m-${m.id}`}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: c.color }}>
                  #{mi + 1}
                </p>
                <h2 id={`m-${m.id}`} className="text-xl font-extrabold">
                  {tx(m.title)}
                </h2>
                <p className="text-sm text-muted">{tx(m.description)}</p>
              </div>
              {user && <span className="chip">{t('course.lessonsDone', { done: m.done, total: m.total })}</span>}
            </div>
            <ol className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {m.lessons.map((l, li) => {
                const status: NodeStatus = !user && guestDone.has(l.id) ? 'completed' : l.status;
                const locked = status === 'locked';
                const body = (
                  <motion.div
                    className={cn('card flex h-full items-center gap-4 p-4 transition', !locked && 'hover:-translate-y-0.5 hover:border-primary/60')}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: li * 0.04 }}
                  >
                    <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-full border-2', NODE_STYLE[status])}>
                      <NodeIcon s={status} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-fg">
                        {li + 1}. {tx(l.title)}
                      </p>
                      <p className="text-xs text-muted">
                        {t(`common.status.${status}`)} · {t('lesson.minRead', { n: l.minutes })}
                        {l.quizBest != null && ` · ${l.quizBest}%`}
                      </p>
                    </div>
                  </motion.div>
                );
                return (
                  <li key={l.id}>
                    {locked ? (
                      <div aria-disabled="true" aria-label={`${tx(l.title)} — ${t('common.locked')}`}>
                        {body}
                      </div>
                    ) : (
                      <Link to={`/lesson/${l.id}`} className="block h-full no-underline">
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
              {user && (
                <li>
                  {m.exam.status === 'locked' ? (
                    <div className="card flex h-full items-center gap-4 border-dashed p-4 opacity-70" aria-disabled="true">
                      <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-border bg-card-2 text-muted">
                        <Trophy size={20} />
                      </span>
                      <div>
                        <p className="font-bold">{t('course.exam')}</p>
                        <p className="text-xs text-muted">{t('course.examLocked')}</p>
                      </div>
                    </div>
                  ) : (
                    <Link to={`/exam/${m.id}`} className={cn('card flex h-full items-center gap-4 p-4 no-underline transition hover:-translate-y-0.5', m.exam.status === 'completed' ? 'border-success/60' : 'border-warning/60')}>
                      <span className={cn('grid h-12 w-12 place-items-center rounded-full border-2', m.exam.status === 'completed' ? NODE_STYLE.completed : 'border-warning bg-warning text-[#2a1600]')}>
                        <Trophy size={20} />
                      </span>
                      <div>
                        <p className="font-bold text-fg">{t('course.exam')}</p>
                        <p className="text-xs text-muted">{m.exam.status === 'completed' ? t('course.examPassed', { n: m.exam.best ?? 0 }) : t('course.examAvailable', { n: m.passScore })}</p>
                      </div>
                    </Link>
                  )}
                </li>
              )}
            </ol>
          </section>
        ))}

        {user && c.project && (
          <section className="card flex flex-wrap items-center gap-4 p-6" aria-label={t('course.project')}>
            <span className={cn('grid h-14 w-14 place-items-center rounded-2xl', c.project.status === 'completed' ? 'bg-success/20 text-success' : 'bg-primary/15 text-primary')}>
              <FolderGit2 size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">{t('course.project')} · +150 XP</p>
              <h2 className="text-lg font-extrabold">{tx(c.project.title)}</h2>
              {c.project.status === 'locked' && <p className="text-sm text-muted">{t('course.projectLocked')}</p>}
            </div>
            {c.project.status === 'locked' ? (
              <span className="chip">
                <Lock size={14} /> {t('common.locked')}
              </span>
            ) : (
              <Link to={`/project/${c.project.id}`} className="btn-primary">
                <BookOpen size={18} /> {c.project.status === 'completed' ? t('projects.done') : t('projects.open')}
              </Link>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
