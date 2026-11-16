import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Bot, CalendarCheck, Coins, Flame, FolderGit2, Gamepad2, Heart, Map, Medal, Swords, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useAchievements, useCourses, useDaily, useMyStats } from '../hooks/api';
import { ErrorState, ProgressBar, Skeleton, StatTile } from '../components/ui';
import { StreakCalendar } from '../components/StreakCalendar';
import { CourseIcon } from '../components/CourseIcon';
import { AchievementBadge } from '../components/game/AchievementBadge';
import { fmtNumber } from '../lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const { t, tx, lang } = useSettings();
  const courses = useCourses();
  const stats = useMyStats();
  const daily = useDaily();
  const achievements = useAchievements();
  if (!user) return null;

  const active = courses.data?.find((c) => c.unlocked && !c.comingSoon && !c.complete && (c.stats?.percent ?? 0) > 0) ?? courses.data?.find((c) => c.unlocked && !c.comingSoon && !c.complete);
  const lvl = user.level;
  const recent = (achievements.data ?? []).filter((a) => a.unlocked).sort((a, b) => String(b.unlockedAt).localeCompare(String(a.unlockedAt))).slice(0, 4);
  const chart = (stats.data?.daily ?? []).map((d) => ({ day: d.day.slice(5), xp: d.xp }));

  return (
    <div className="space-y-6">
      <motion.section className="card relative overflow-hidden p-6 sm:p-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{t('dashboard.hello', { name: user.displayName })}</h1>
            <p className="mt-1 text-muted">{t('dashboard.subtitle')}</p>
          </div>
          <div className="w-full max-w-sm">
            <div className="flex items-baseline justify-between">
              <p className="font-bold">
                {t('common.level')} {lvl.level} · <span className="gradient-text">{tx(lvl.name)}</span>
              </p>
              <p className="text-sm text-muted">{fmtNumber(user.xp, lang)} XP</p>
            </div>
            <ProgressBar className="mt-2 h-3" value={lvl.progress * 100} label={t('common.level')} />
            <p className="mt-1 text-xs text-muted">{lvl.nextMin ? t('dashboard.levelProgress', { n: fmtNumber(lvl.nextMin - user.xp, lang) }) : t('dashboard.maxLevel')}</p>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Zap} label={t('common.xp')} value={fmtNumber(user.xp, lang)} accent="var(--cv-secondary)" />
        <StatTile icon={Flame} label={t('common.streak')} value={t('common.days', { n: user.streak.current })} accent="#f97316" />
        <StatTile icon={Coins} label={t('common.coins')} value={fmtNumber(user.coins, lang)} accent="#f59e0b" />
        <StatTile icon={Heart} label={t('common.hearts')} value={`${user.hearts}/5`} accent="#f43f5e" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Davom ettirish */}
          <section className="card p-6" aria-labelledby="continue-title">
            <h2 id="continue-title" className="mb-4 text-lg font-bold">
              {t('dashboard.continueTitle')}
            </h2>
            {courses.isLoading ? (
              <Skeleton className="h-24" />
            ) : courses.isError ? (
              <ErrorState error={courses.error} onRetry={() => courses.refetch()} />
            ) : active ? (
              <Link to={`/course/${active.slug}`} className="group flex items-center gap-4 rounded-2xl border border-border bg-card-2 p-4 no-underline transition hover:border-primary/50">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ background: `${active.color}22`, color: active.color }}>
                  <CourseIcon icon={active.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-fg">{tx(active.title)}</p>
                  <ProgressBar className="mt-2" value={active.stats?.percent ?? 0} label={tx(active.title)} color={active.color} />
                  <p className="mt-1 text-xs text-muted">{t('course.lessonsDone', { done: active.stats?.doneLessons ?? 0, total: active.stats?.totalLessons ?? 0 })}</p>
                </div>
                <ArrowRight className="text-muted transition group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted">{t('dashboard.continueEmpty')}</p>
                <Link to="/map" className="btn-primary">
                  <Map size={18} /> {t('dashboard.openMap')}
                </Link>
              </div>
            )}
          </section>

          {/* XP grafigi */}
          <section className="card p-6" aria-labelledby="xp-title">
            <h2 id="xp-title" className="mb-4 text-lg font-bold">
              {t('dashboard.weekXp')}
            </h2>
            {stats.isLoading ? (
              <Skeleton className="h-48" />
            ) : chart.length === 0 ? (
              <p className="py-10 text-center text-muted">{t('common.empty')}</p>
            ) : (
              <div className="h-52" role="img" aria-label={t('dashboard.weekXp')}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart} margin={{ left: -20, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--cv-primary)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--cv-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cv-border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: 'var(--cv-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--cv-muted)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'var(--cv-card)', border: '1px solid var(--cv-border)', borderRadius: 12, color: 'var(--cv-fg)' }} />
                    <Area type="monotone" dataKey="xp" stroke="var(--cv-primary)" strokeWidth={2.5} fill="url(#xpFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Kurslar */}
          <section className="card p-6" aria-labelledby="courses-title">
            <h2 id="courses-title" className="mb-4 text-lg font-bold">
              {t('dashboard.courses')}
            </h2>
            <ul className="space-y-4">
              {(courses.data ?? [])
                .filter((c) => !c.comingSoon)
                .map((c) => (
                  <li key={c.slug}>
                    <Link to={`/course/${c.slug}`} className="flex items-center gap-3 no-underline">
                      <span style={{ color: c.color }}>
                        <CourseIcon icon={c.icon} size={22} />
                      </span>
                      <span className="w-40 shrink-0 truncate font-semibold text-fg">{tx(c.title)}</span>
                      <ProgressBar className="flex-1" value={c.stats?.percent ?? 0} label={tx(c.title)} color={c.color} />
                      <span className="w-12 text-right text-sm text-muted">{c.stats?.percent ?? 0}%</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          {/* Kunlik challenge */}
          <section className="card relative overflow-hidden p-6" aria-labelledby="daily-title">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-secondary/25 blur-2xl" aria-hidden="true" />
            <h2 id="daily-title" className="flex items-center gap-2 text-lg font-bold">
              <CalendarCheck size={20} className="text-secondary" /> {t('dashboard.dailyTitle')}
            </h2>
            <p className="mt-2 text-sm text-muted">{daily.data?.played ? t('dashboard.dailyDone', { n: daily.data.score ?? 0 }) : t('dashboard.dailyText')}</p>
            <Link to="/battle?daily=1" className="btn-primary mt-4 w-full">
              <Swords size={18} /> {daily.data?.played ? t('battle.dailyTop') : t('battle.dailyStart')}
            </Link>
          </section>

          {/* Streak */}
          <section className="card p-6" aria-labelledby="streak-title">
            <h2 id="streak-title" className="mb-1 flex items-center gap-2 text-lg font-bold">
              <Flame size={20} className="text-orange-500" /> {t('dashboard.streakCalendar')}
            </h2>
            <p className="mb-4 text-sm text-muted">{user.streak.todayDone ? t('dashboard.todayDone') : t('dashboard.todayTodo')}</p>
            <StreakCalendar days={user.activityDays} weeks={14} />
          </section>

          {/* Tezkor harakatlar */}
          <section className="card p-6" aria-labelledby="quick-title">
            <h2 id="quick-title" className="mb-4 text-lg font-bold">
              {t('dashboard.quick')}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/game', icon: Gamepad2, label: t('nav.game') },
                { to: '/battle', icon: Swords, label: t('nav.battle') },
                { to: '/projects', icon: FolderGit2, label: t('nav.projects') },
                { to: '/mentor', icon: Bot, label: t('nav.mentor') },
              ].map((q) => (
                <Link key={q.to} to={q.to} className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card-2 text-sm font-semibold text-fg no-underline transition hover:border-primary/50">
                  <q.icon size={22} className="text-primary" /> {q.label}
                </Link>
              ))}
            </div>
          </section>

          {/* Yutuqlar */}
          <section className="card p-6" aria-labelledby="ach-title">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="ach-title" className="flex items-center gap-2 text-lg font-bold">
                <Medal size={20} className="text-amber-400" /> {t('dashboard.recentAchievements')}
              </h2>
              <Link to="/achievements" className="text-sm font-semibold text-primary">
                {t('common.all')}
              </Link>
            </div>
            {recent.length === 0 ? <p className="text-sm text-muted">{t('dashboard.noAchievements')}</p> : <div className="grid grid-cols-2 gap-3">{recent.map((a) => <AchievementBadge key={a.key} a={a} compact />)}</div>}
          </section>
        </div>
      </div>
    </div>
  );
}
