import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookOpen, Code2, Edit3, Flame, FolderGit2, GraduationCap, ListChecks, Swords, Trophy, UserMinus, Users } from 'lucide-react';
import { removeFriend, updateMe, useFriends, useMyStats, useProfile, useUserMutation } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, ErrorState, Modal, PageSkeleton, ProgressBar, StatTile } from '../components/ui';
import { StreakCalendar } from '../components/StreakCalendar';
import { AchievementBadge } from '../components/game/AchievementBadge';
import { errorMessage } from '../lib/api';
import { fmtDate, fmtNumber } from '../lib/utils';
import type { TKey } from '../i18n';

export default function Profile() {
  const { username } = useParams();
  const { t, tx, lang } = useSettings();
  const { user } = useAuth();
  const toast = useToast();
  const q = useProfile(username);
  const mine = !!user && user.username === username;
  const stats = useMyStats(mine);
  const friends = useFriends(mine);
  const save = useUserMutation(updateMe);
  const unfriend = useUserMutation(removeFriend);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ displayName: '', bio: '' });

  if (q.isLoading) return <PageSkeleton />;
  if (q.isError || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const { profile, achievements, certificates, courses } = q.data;
  const s = profile.stats;

  async function onSave() {
    try {
      await save.mutateAsync({ displayName: form.displayName.trim(), bio: form.bio.trim() });
      toast.success(t('common.saved'));
      setEdit(false);
      q.refetch();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/40 to-secondary/30" aria-hidden="true" />
        <div className="relative flex flex-wrap items-end gap-5 pt-8">
          <Avatar equipped={profile.equipped} size={96} className="border-4 border-card" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black sm:text-3xl">{profile.displayName}</h1>
            <p className="text-muted">
              @{profile.username} · {t('common.level')} {profile.level.level} <span className="gradient-text font-bold">{tx(profile.level.name)}</span>
            </p>
            {profile.bio && <p className="mt-2 max-w-2xl">{profile.bio}</p>}
            <p className="mt-1 text-xs text-muted">{t('profile.joined', { d: fmtDate(profile.createdAt, lang) })}</p>
          </div>
          {mine && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setForm({ displayName: user!.displayName, bio: user!.bio });
                  setEdit(true);
                }}
              >
                <Edit3 size={16} /> {t('profile.edit')}
              </button>
              <Link to="/shop" className="btn-ghost">
                {t('profile.customize')}
              </Link>
            </div>
          )}
        </div>
        <div className="relative mt-6 max-w-md">
          <ProgressBar value={profile.level.progress * 100} label={t('common.level')} />
          <p className="mt-1 text-xs text-muted">{fmtNumber(profile.xp, lang)} XP</p>
        </div>
      </section>

      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="mb-3 text-lg font-bold">
          {t('profile.stats')}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile icon={BookOpen} label={t('profile.stats_.lessons')} value={s.lessonsCompleted} />
          <StatTile icon={Code2} label={t('profile.stats_.challenges')} value={s.challengesCompleted} accent="var(--cv-secondary)" />
          <StatTile icon={ListChecks} label={t('profile.stats_.quizzes')} value={s.quizzesPassed} accent="var(--cv-success)" />
          <StatTile icon={Trophy} label={t('profile.stats_.exams')} value={s.examsPassed} accent="#f59e0b" />
          <StatTile icon={FolderGit2} label={t('profile.stats_.projects')} value={s.projectsCompleted} accent="#ec4899" />
          <StatTile icon={Swords} label={t('profile.stats_.battles')} value={s.battlesPlayed} accent="#ef4444" />
          <StatTile icon={Flame} label={t('profile.stats_.bestStreak')} value={t('common.days', { n: profile.streak.best })} accent="#f97316" />
          <StatTile icon={Code2} label={t('profile.stats_.runs')} value={s.codeRuns} accent="#64748b" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="act-title">
          <h2 id="act-title" className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Flame size={20} className="text-orange-500" /> {t('profile.activity')}
          </h2>
          <StreakCalendar days={profile.activityDays} weeks={16} />
        </section>
        <section className="card p-6" aria-labelledby="courses-title">
          <h2 id="courses-title" className="mb-4 text-lg font-bold">
            {t('profile.courses')}
          </h2>
          <ul className="space-y-3">
            {courses.map((c) => (
              <li key={c.slug} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate font-semibold">{tx(c.title)}</span>
                <ProgressBar className="flex-1" value={(c.completedLessons / 25) * 100} label={tx(c.title)} color={c.color} />
                <span className="w-10 text-right text-sm text-muted">{c.completedLessons}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {mine && stats.data && stats.data.byReason.length > 0 && (
        <section className="card p-6" aria-labelledby="src-title">
          <h2 id="src-title" className="mb-4 text-lg font-bold">
            {t('profile.xpBySource')}
          </h2>
          <div className="h-56" role="img" aria-label={t('profile.xpBySource')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.data.byReason.map((r) => ({ name: t(`profile.reasons.${r.reason}` as TKey), xp: r.xp }))} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--cv-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--cv-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--cv-card)', border: '1px solid var(--cv-border)', borderRadius: 12 }} cursor={{ fill: 'var(--cv-card-2)' }} />
                <Bar dataKey="xp" fill="var(--cv-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section aria-labelledby="ach-title">
        <h2 id="ach-title" className="mb-3 text-lg font-bold">
          {t('profile.achievements')} ({achievements.length})
        </h2>
        {achievements.length === 0 ? <p className="text-muted">{t('dashboard.noAchievements')}</p> : <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{achievements.map((a) => <li key={a.key}><AchievementBadge a={{ ...a, unlocked: true }} compact /></li>)}</ul>}
      </section>

      {certificates.length > 0 && (
        <section aria-labelledby="cert-title">
          <h2 id="cert-title" className="mb-3 text-lg font-bold">
            {t('profile.certificates')}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {certificates.map((c) => (
              <li key={c.code}>
                <Link to={`/verify/${c.code}`} className="card flex items-center gap-3 p-4 no-underline">
                  <GraduationCap style={{ color: c.color }} />
                  <span className="font-bold text-fg">{tx(c.courseTitle)}</span>
                  <span className="ml-auto font-mono text-xs text-muted">{c.code}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mine && (
        <section className="card p-6" aria-labelledby="friends-title">
          <h2 id="friends-title" className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Users size={20} /> {t('profile.friends')}
          </h2>
          {!friends.data?.length ? (
            <p className="text-sm text-muted">{t('profile.noFriends')}</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {friends.data.map((f) => (
                <li key={f.id} className="flex items-center gap-3 rounded-xl bg-card-2 p-3">
                  <Avatar equipped={f.equipped} size={36} />
                  <Link to={`/u/${f.username}`} className="min-w-0 flex-1 truncate font-semibold text-fg no-underline">
                    {f.displayName}
                    <span className="block text-xs font-normal text-muted">{fmtNumber(f.xp, lang)} XP</span>
                  </Link>
                  <button type="button" className="btn-ghost btn-sm btn-icon" onClick={() => unfriend.mutate(f.id)} aria-label={`${t('profile.remove')} ${f.displayName}`}>
                    <UserMinus size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Modal open={edit} onClose={() => setEdit(false)} title={t('profile.edit')}>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="dn">
              {t('auth.displayName')}
            </label>
            <input id="dn" className="input" maxLength={50} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="bio">
              {t('profile.bio')}
            </label>
            <textarea id="bio" className="input min-h-24" maxLength={280} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setEdit(false)}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn-primary" onClick={onSave} disabled={form.displayName.trim().length < 2 || save.isPending}>
              {t('common.save')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
