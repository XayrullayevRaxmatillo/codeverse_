import { useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookOpen, Flag, Medal, Plus, Save, Shield, Trash2, Users } from 'lucide-react';
import { del, errorMessage, get, patch, post } from '../../lib/api';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog, EmptyState, ErrorState, Modal, PageHeader, PageSkeleton, Segmented, StatTile } from '../../components/ui';
import { cn, fmtDate } from '../../lib/utils';
import type { Tri } from '../../types';
import type { TKey } from '../../i18n';

/* ===================== Umumiy JSON muharriri ===================== */
function JsonEditor({ open, title, value, onClose, onSave }: { open: boolean; title: string; value: unknown; onClose: () => void; onSave: (v: unknown) => Promise<void> }) {
  const { t } = useSettings();
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setText(JSON.stringify(value, null, 2));
      setErr(null);
    }
  }, [open, value]);
  async function save() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return setErr(t('admin.invalidJson'));
    }
    setBusy(true);
    try {
      await onSave(parsed);
      onClose();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <p className="mb-2 text-xs text-muted">{t('admin.jsonHint')}</p>
      <textarea className="input min-h-[50vh] font-mono text-xs" spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} aria-label="JSON" />
      {err && (
        <p className="mt-2 rounded-xl bg-danger/10 p-2 text-sm text-danger" role="alert">
          {err}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn-primary" onClick={save} disabled={busy}>
          <Save size={16} /> {t('common.save')}
        </button>
      </div>
    </Modal>
  );
}

const strip = (o: Record<string, unknown>, keys = ['_id', 'id', '__v', 'createdAt', 'updatedAt', 'course', 'module', 'lesson', 'lessons']) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
const T0: Tri = { uz: '', ru: '', en: '' };

/* ===================== Statistika ===================== */
interface Stats {
  totals: Record<string, number>;
  xpDaily: { day: string; xp: number; users: number }[];
  signups: { day: string; count: number }[];
  courses: { slug: string; title: Tri; color: string; learners: number; completed: number }[];
}
function AdminStats() {
  const { t, tx } = useSettings();
  const q = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => get<Stats>('/admin/stats') });
  if (q.isLoading) return <PageSkeleton />;
  if (q.isError || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const data = q.data;
  const keys = ['users', 'activeToday', 'courses', 'lessons', 'challenges', 'questions', 'openReports', 'certificates'] as const;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {keys.map((k) => (
          <StatTile key={k} icon={k === 'users' || k === 'activeToday' ? Users : k === 'openReports' ? Flag : BookOpen} label={t(`admin.totals.${k}` as TKey)} value={data.totals[k] ?? 0} />
        ))}
      </div>
      <section className="card p-6">
        <h2 className="mb-4 font-bold">{t('admin.xpDaily')}</h2>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={q.data.xpDaily.map((d) => ({ ...d, day: d.day.slice(5) }))} margin={{ left: -16 }}>
              <XAxis dataKey="day" tick={{ fill: 'var(--cv-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--cv-muted)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--cv-card)', border: '1px solid var(--cv-border)', borderRadius: 12 }} />
              <Bar dataKey="xp" fill="var(--cv-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="card p-6">
        <h2 className="mb-4 font-bold">{t('admin.learners')}</h2>
        <ul className="space-y-2">
          {q.data.courses.map((c) => (
            <li key={c.slug} className="flex items-center justify-between rounded-xl bg-card-2 px-4 py-2">
              <span className="font-semibold" style={{ color: c.color }}>
                {tx(c.title)}
              </span>
              <span className="font-mono">
                {c.learners} / {c.completed}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ===================== Foydalanuvchilar ===================== */
interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  isBanned: boolean;
  xp: number;
  level: number;
  createdAt: string;
}
function AdminUsers() {
  const { t, lang } = useSettings();
  const toast = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['admin', 'users', search, page], queryFn: () => get<{ users: AdminUser[]; pages: number; total: number }>('/admin/users', { q: search, page }) });
  const m = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<AdminUser> }) => patch(`/admin/users/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div className="space-y-4">
      <input className="input max-w-md" placeholder={t('admin.searchUsers')} aria-label={t('admin.searchUsers')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      {q.isLoading ? (
        <PageSkeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="p-3">{t('leaderboard.player')}</th>
                <th className="p-3">Email</th>
                <th className="p-3">XP</th>
                <th className="p-3">{t('admin.role')}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {q.data?.users.map((u) => (
                <tr key={u.id} className="border-b border-border/60">
                  <td className="p-3">
                    <p className="font-semibold">{u.displayName}</p>
                    <p className="text-xs text-muted">
                      @{u.username} · {fmtDate(u.createdAt, lang)}
                    </p>
                  </td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 font-mono">
                    {u.xp} (L{u.level})
                  </td>
                  <td className="p-3">
                    <span className={cn('chip', u.role === 'admin' && 'border-primary/40 text-primary')}>{u.role}</span> {u.isBanned && <span className="chip border-danger/40 text-danger">{t('admin.banned')}</span>}
                  </td>
                  <td className="space-x-1 whitespace-nowrap p-3 text-right">
                    <button type="button" className="btn-ghost btn-sm" onClick={() => m.mutate({ id: u.id, body: { role: u.role === 'admin' ? 'user' : 'admin' } })}>
                      {u.role === 'admin' ? t('admin.makeUser') : t('admin.makeAdmin')}
                    </button>
                    <button type="button" className={u.isBanned ? 'btn-secondary btn-sm' : 'btn-danger btn-sm'} onClick={() => m.mutate({ id: u.id, body: { isBanned: !u.isBanned } })}>
                      {u.isBanned ? t('admin.unban') : t('admin.ban')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {q.data && q.data.pages > 1 && (
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t('common.prev')}
          </button>
          <span className="text-sm text-muted">
            {page} / {q.data.pages}
          </span>
          <button type="button" className="btn-secondary btn-sm" disabled={page >= q.data.pages} onClick={() => setPage((p) => p + 1)}>
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
}

/* ===================== Kontent (kurs → modul → dars) ===================== */
interface AdminCourse { id: string; slug: string; title: Tri; [k: string]: unknown }
interface AdminLessonRow { id: string; slug: string; title: Tri; order: number; isGuest: boolean }
interface AdminModule { id: string; slug: string; title: Tri; order: number; lessons: AdminLessonRow[]; [k: string]: unknown }
interface AdminLessonFull { lesson: Record<string, unknown> & { id: string }; challenge: (Record<string, unknown> & { id: string }) | null; questions: (Record<string, unknown> & { id: string; key: string; type: string; prompt: Tri })[] }

type EditState = { title: string; value: unknown; save: (v: unknown) => Promise<void> } | null;

function AdminContent() {
  const { t, tx } = useSettings();
  const toast = useToast();
  const qc = useQueryClient();
  const courses = useQuery({ queryKey: ['admin', 'courses'], queryFn: () => get<{ courses: AdminCourse[] }>('/admin/courses').then((r) => r.courses) });
  const [courseId, setCourseId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [edit, setEdit] = useState<EditState>(null);
  const [confirm, setConfirm] = useState<{ text: string; run: () => Promise<void> } | null>(null);
  const modules = useQuery({ queryKey: ['admin', 'modules', courseId], enabled: !!courseId, queryFn: () => get<{ modules: AdminModule[] }>('/admin/modules', { course: courseId }).then((r) => r.modules) });
  const lesson = useQuery({ queryKey: ['admin', 'lesson', lessonId], enabled: !!lessonId, queryFn: () => get<AdminLessonFull>(`/admin/lessons/${lessonId}`) });

  useEffect(() => {
    if (!courseId && courses.data?.length) setCourseId(courses.data[0].id);
  }, [courses.data, courseId]);

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin'] });
  const openEdit = (title: string, value: unknown, save: (v: unknown) => Promise<unknown>) =>
    setEdit({
      title,
      value,
      save: async (v) => {
        await save(v);
        toast.success(t('common.saved'));
        refresh();
      },
    });
  const remove = (text: string, url: string, after?: () => void) =>
    setConfirm({
      text,
      run: async () => {
        try {
          await del(url);
          after?.();
          refresh();
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });

  const course = courses.data?.find((c) => c.id === courseId);
  const selectedModule = useMemo(() => modules.data?.find((m) => m.lessons.some((l) => l.id === lessonId)), [modules.data, lessonId]);

  if (courses.isLoading) return <PageSkeleton />;
  if (courses.isError) return <ErrorState error={courses.error} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-3">
        <div className="flex gap-2">
          <select className="input" value={courseId} onChange={(e) => { setCourseId(e.target.value); setLessonId(''); }} aria-label={t('admin.selectCourse')}>
            {courses.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {tx(c.title)}
              </option>
            ))}
          </select>
          <button type="button" className="btn-secondary btn-icon" title={t('admin.addCourse')} aria-label={t('admin.addCourse')} onClick={() => openEdit(t('admin.addCourse'), { slug: 'new-course', world: 'new-world', order: 10, title: T0, description: T0, color: '#7C5CFC', icon: 'code', prerequisite: null, comingSoon: true, isPublished: false }, (v) => post('/admin/courses', v))}>
            <Plus size={18} />
          </button>
        </div>
        {course && (
          <div className="flex gap-2">
            <button type="button" className="btn-ghost btn-sm flex-1" onClick={() => openEdit(tx(course.title), strip(course), (v) => patch(`/admin/courses/${course.id}`, v))}>
              {t('common.edit')}
            </button>
            <button type="button" className="btn-danger btn-sm" onClick={() => remove(t('admin.deleteConfirm'), `/admin/courses/${course.id}`, () => setCourseId(''))} aria-label={t('common.delete')}>
              <Trash2 size={15} />
            </button>
          </div>
        )}
        <div className="card max-h-[65vh] overflow-y-auto p-2">
          {modules.data?.map((m) => (
            <div key={m.id} className="mb-2">
              <div className="flex items-center gap-1 px-2 py-1">
                <p className="flex-1 truncate text-sm font-bold">
                  {m.order}. {tx(m.title)}
                </p>
                <button type="button" className="btn-ghost btn-sm" onClick={() => openEdit(tx(m.title), strip(m), (v) => patch(`/admin/modules/${m.id}`, v))}>
                  {t('common.edit')}
                </button>
                <button type="button" className="btn-ghost btn-sm" title={t('admin.addLesson')} aria-label={t('admin.addLesson')} onClick={() => openEdit(t('admin.addLesson'), { module: m.id, slug: 'new-lesson', order: m.lessons.length + 1, title: T0, content: T0, example: '', exampleMode: 'web', isGuest: false, minutes: 8 }, (v) => post('/admin/lessons', v))}>
                  <Plus size={15} />
                </button>
              </div>
              <ul>
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    <button type="button" onClick={() => setLessonId(l.id)} className={cn('w-full truncate rounded-lg px-3 py-1.5 text-left text-sm', lessonId === l.id ? 'bg-primary/15 text-primary' : 'text-muted hover:bg-card-2 hover:text-fg')}>
                      {l.order}. {tx(l.title)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {courseId && (
            <button type="button" className="btn-ghost btn-sm w-full" onClick={() => openEdit(t('admin.addModule'), { course: courseId, slug: 'new-module', order: (modules.data?.length ?? 0) + 1, title: T0, description: T0, passScore: 70 }, (v) => post('/admin/modules', v))}>
              <Plus size={15} /> {t('admin.addModule')}
            </button>
          )}
        </div>
      </aside>

      <section className="min-w-0">
        {!lessonId ? (
          <EmptyState icon={BookOpen} title={t('admin.editLesson')} text={t('admin.jsonHint')} />
        ) : lesson.isLoading ? (
          <PageSkeleton />
        ) : lesson.isError || !lesson.data ? (
          <ErrorState error={lesson.error} />
        ) : (
          <LessonEditor data={lesson.data} lessonId={lessonId} moduleTitle={selectedModule ? tx(selectedModule.title) : ''} openEdit={openEdit} remove={(text, url, after) => remove(text, url, after)} onDeleted={() => setLessonId('')} />
        )}
      </section>
      <JsonEditor open={!!edit} title={edit?.title ?? ''} value={edit?.value} onClose={() => setEdit(null)} onSave={(v) => edit!.save(v)} />
      <ConfirmDialog
        open={!!confirm}
        title={t('common.delete')}
        text={confirm?.text ?? ''}
        confirmLabel={t('common.delete')}
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          await confirm?.run();
          setConfirm(null);
        }}
      />
    </div>
  );
}

function LessonEditor({ data, lessonId, moduleTitle, openEdit, remove, onDeleted }: { data: AdminLessonFull; lessonId: string; moduleTitle: string; openEdit: (title: string, value: unknown, save: (v: unknown) => Promise<unknown>) => void; remove: (text: string, url: string, after?: () => void) => void; onDeleted: () => void }) {
  const { t, tx } = useSettings();
  const ch = data.challenge;
  return (
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="flex-1 text-lg font-bold">{tx(data.lesson.title as Tri)}</h2>
                <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(t('admin.editLesson'), strip(data.lesson), (v) => patch(`/admin/lessons/${lessonId}`, v))}>
                  {t('admin.json')}
                </button>
                <button type="button" className="btn-danger btn-sm" onClick={() => remove(t('admin.deleteConfirm'), `/admin/lessons/${lessonId}`, onDeleted)} aria-label={t('common.delete')}>
                  <Trash2 size={15} />
                </button>
              </div>
              {moduleTitle && <p className="text-xs text-muted">{moduleTitle}</p>}
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2">
                <h3 className="flex-1 font-bold">{t('admin.challenge')}</h3>
                {ch ? (
                  <>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(t('admin.challenge'), strip(ch, ['_id', 'id', '__v', 'createdAt', 'updatedAt', 'course', 'lesson']), (v) => patch(`/admin/challenges/${ch.id}`, v))}>
                      {t('admin.json')}
                    </button>
                    <button type="button" className="btn-danger btn-sm" onClick={() => remove(t('admin.deleteConfirm'), `/admin/challenges/${ch.id}`)} aria-label={t('common.delete')}>
                      <Trash2 size={15} />
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(t('admin.challenge'), { key: `custom.${lessonId}`, kind: 'lesson', lesson: lessonId, title: T0, mode: 'web', instructions: T0, starter: { html: '', css: '', js: '' }, solution: { html: '', css: '', js: '' }, tests: [{ d: T0, e: "exists('h1')" }], rules: [], hints: [], difficulty: 'easy' }, (v) => post('/admin/challenges', v))}>
                    <Plus size={15} /> {t('common.create')}
                  </button>
                )}
              </div>
              {ch && <p className="mt-1 text-sm text-muted">{tx(ch.title as Tri)} · {(ch.tests as unknown[])?.length ?? 0} tests</p>}
            </div>

            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="flex-1 font-bold">{t('admin.questions')}</h3>
                <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(t('admin.addQuestion'), { key: `custom.${lessonId}.q${Date.now()}`, lesson: lessonId, type: 'mcq', prompt: T0, code: '', options: [T0, T0], answer: 0, explanation: T0, difficulty: 'easy' }, (v) => post('/admin/questions', v))}>
                  <Plus size={15} /> {t('admin.addQuestion')}
                </button>
              </div>
              <ul className="space-y-2">
                {data.questions.map((qq) => (
                  <li key={qq.id} className="flex items-center gap-2 rounded-xl bg-card-2 px-3 py-2 text-sm">
                    <span className="chip">{qq.type}</span>
                    <span className="min-w-0 flex-1 truncate">{tx(qq.prompt)}</span>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => openEdit(qq.key, strip(qq, ['_id', 'id', '__v', 'createdAt', 'updatedAt', 'course', 'module', 'source']), (v) => patch(`/admin/questions/${qq.id}`, { ...(v as object), lesson: lessonId }))}>
                      {t('common.edit')}
                    </button>
                    <button type="button" className="btn-ghost btn-sm text-danger" onClick={() => remove(t('admin.deleteConfirm'), `/admin/questions/${qq.id}`)} aria-label={t('common.delete')}>
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
  );
}

/* ===================== Shikoyatlar ===================== */
interface ReportRow { id: string; targetType: string; targetId: string; reason: string; message: string; status: string; createdAt: string; user: { username: string; displayName: string } | null }
function AdminReports() {
  const { t, lang } = useSettings();
  const qc = useQueryClient();
  const [status, setStatus] = useState<'open' | 'resolved' | 'dismissed' | 'all'>('open');
  const q = useQuery({ queryKey: ['admin', 'reports', status], queryFn: () => get<{ reports: ReportRow[] }>('/admin/reports', { status }).then((r) => r.reports) });
  const m = useMutation({ mutationFn: ({ id, s }: { id: string; s: string }) => patch(`/admin/reports/${id}`, { status: s }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }) });
  return (
    <div className="space-y-4">
      <Segmented label={t('admin.statusFilter')} value={status} onChange={setStatus} options={(['open', 'resolved', 'dismissed', 'all'] as const).map((s) => ({ value: s, label: s }))} />
      {q.isLoading ? (
        <PageSkeleton />
      ) : !q.data?.length ? (
        <EmptyState icon={Flag} title={t('admin.noReports')} />
      ) : (
        <ul className="space-y-2">
          {q.data.map((r) => (
            <li key={r.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="chip">{r.targetType}</span>
                <span className="font-mono">{r.targetId}</span>
                <span>· @{r.user?.username} · {fmtDate(r.createdAt, lang)}</span>
                <span className="chip ml-auto">{r.status}</span>
              </div>
              <p className="mt-2">{r.message || r.reason}</p>
              <div className="mt-3 flex gap-2">
                {r.status === 'open' ? (
                  <>
                    <button type="button" className="btn-success btn-sm" onClick={() => m.mutate({ id: r.id, s: 'resolved' })}>
                      {t('admin.resolve')}
                    </button>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => m.mutate({ id: r.id, s: 'dismissed' })}>
                      {t('admin.dismiss')}
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn-ghost btn-sm" onClick={() => m.mutate({ id: r.id, s: 'open' })}>
                    {t('admin.reopen')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ===================== Yutuqlar ===================== */
function AdminAchievements() {
  const { t, tx } = useSettings();
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'achievements'], queryFn: () => get<{ achievements: (Record<string, unknown> & { id: string; key: string; title: Tri; condition: { type: string; value: number } })[] }>('/admin/achievements').then((r) => r.achievements) });
  const [edit, setEdit] = useState<EditState>(null);
  const save = (fn: (v: unknown) => Promise<unknown>) => async (v: unknown) => {
    await fn(v);
    toast.success(t('common.saved'));
    qc.invalidateQueries({ queryKey: ['admin', 'achievements'] });
  };
  return (
    <div className="space-y-4">
      <button type="button" className="btn-primary" onClick={() => setEdit({ title: t('admin.newAchievement'), value: { key: 'new-achievement', title: T0, description: T0, icon: 'trophy', condition: { type: 'lessons', value: 10 }, rewardCoins: 20, rarity: 'common' }, save: save((v) => post('/admin/achievements', v)) })}>
        <Plus size={16} /> {t('admin.newAchievement')}
      </button>
      <ul className="grid gap-2 md:grid-cols-2">
        {q.data?.map((a) => (
          <li key={a.id} className="card flex items-center gap-3 p-3">
            <Medal className="text-amber-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{tx(a.title)}</p>
              <p className="font-mono text-xs text-muted">
                {a.condition.type} ≥ {a.condition.value}
              </p>
            </div>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setEdit({ title: a.key, value: strip(a, ['_id', 'id', '__v', 'createdAt', 'updatedAt']), save: save((v) => patch(`/admin/achievements/${a.id}`, v)) })}>
              {t('common.edit')}
            </button>
            <button type="button" className="btn-ghost btn-sm text-danger" aria-label={t('common.delete')} onClick={async () => { await del(`/admin/achievements/${a.id}`).catch((e) => toast.error(errorMessage(e))); qc.invalidateQueries({ queryKey: ['admin', 'achievements'] }); }}>
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      <JsonEditor open={!!edit} title={edit?.title ?? ''} value={edit?.value} onClose={() => setEdit(null)} onSave={(v) => edit!.save(v)} />
    </div>
  );
}

/* ===================== Layout ===================== */
export default function Admin() {
  const { t } = useSettings();
  const tabs: { to: string; key: TKey; end?: boolean }[] = [
    { to: '/admin', key: 'admin.dashboard', end: true },
    { to: '/admin/users', key: 'admin.users' },
    { to: '/admin/content', key: 'admin.content' },
    { to: '/admin/reports', key: 'admin.reports' },
    { to: '/admin/achievements', key: 'admin.achievements' },
  ];
  return (
    <div>
      <PageHeader title={t('admin.title')} icon={Shield} />
      <nav className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-border bg-card-2 p-1" aria-label={t('admin.title')}>
        {tabs.map((tb) => (
          <NavLink key={tb.to} to={tb.to} end={tb.end} className={({ isActive }) => cn('rounded-xl px-3 py-2 text-sm font-semibold no-underline', isActive ? 'bg-card text-fg shadow' : 'text-muted hover:text-fg')}>
            {t(tb.key)}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<AdminStats />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="achievements" element={<AdminAchievements />} />
      </Routes>
    </div>
  );
}
