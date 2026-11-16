import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, Crown, Swords, Trophy } from 'lucide-react';
import { finishBattle, startBattle, startDaily, useDaily, type BattleResult } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useReward } from '../context/RewardContext';
import { useToast } from '../context/ToastContext';
import { Avatar, PageHeader, ProgressBar, Segmented, Spinner } from '../components/ui';
import { QuestionView } from '../components/quiz/QuestionView';
import { Confetti } from '../components/game/Confetti';
import { errorMessage } from '../lib/api';
import { AVATARS } from '../lib/cosmetics';
import { cn, fmtDuration } from '../lib/utils';
import type { Answer, BattleSession, Difficulty } from '../types';

export default function Battle() {
  const { t } = useSettings();
  const { user } = useAuth();
  const { celebrate } = useReward();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = params.get('daily') ? 'daily' : 'battle';
  const daily = useDaily();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [session, setSession] = useState<(BattleSession & { daily: boolean }) | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BattleResult['result'] | null>(null);
  const finishRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!session || result) return;
    const id = window.setInterval(() => setLeft((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [session, result]);
  useEffect(() => {
    if (session && !result && left <= 0) {
      toast.info(t('battle.timeUp'));
      finishRef.current();
    }
  }, [left, session, result, toast, t]);

  async function begin(isDaily: boolean) {
    setBusy(true);
    try {
      const s = isDaily ? await startDaily() : await startBattle(difficulty);
      setSession({ ...s, daily: isDaily });
      setAnswers({});
      setIdx(0);
      setLeft(s.timeLimitSec);
      setResult(null);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!session || busy || result) return;
    setBusy(true);
    try {
      const r = await finishBattle(session.id, answers, session.daily);
      setResult(r.result);
      celebrate(r.reward);
      if (session.daily) daily.refetch();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  finishRef.current = finish;

  if (session) {
    const q = session.questions[idx];
    const byId = new Map(result?.results.map((r) => [r.id, r]));
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {result ? (
          <motion.div className="card relative overflow-hidden p-6 text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }} role="status">
            {result.newBest && <Confetti />}
            <Trophy className="mx-auto text-amber-400" size={44} />
            <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-muted">{t('battle.results')}</p>
            <p className="mt-1 text-5xl font-black gradient-text">{result.score}</p>
            <p className="mt-2 text-muted">{t('battle.correctCount', { c: result.correct, n: result.total })} · {fmtDuration(result.elapsedMs / 1000)}</p>
            {result.late && <p className="mt-2 text-warning">{t('battle.late')}</p>}
            {result.newBest ? <p className="mt-2 font-bold text-success">{t('battle.newBest')}</p> : <p className="mt-2 text-sm text-muted">{t('battle.personalBest', { n: result.best })}</p>}
            <div className="mt-5 flex justify-center gap-2">
              <button type="button" className="btn-primary" onClick={() => setSession(null)}>
                {t('battle.again')}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="card sticky top-16 z-10 flex items-center gap-4 p-4">
            <span className={cn('flex items-center gap-1 font-mono text-xl font-black', left <= 15 ? 'text-danger' : 'text-fg')} role="timer" aria-label={`${left}`}>
              <Clock size={20} /> {fmtDuration(left)}
            </span>
            <ProgressBar className="flex-1" value={(left / session.timeLimitSec) * 100} label="time" color={left <= 15 ? 'var(--cv-danger)' : undefined} />
            <span className="chip">
              {idx + 1}/{session.questions.length}
            </span>
          </div>
        )}

        {result ? (
          session.questions.map((qq, i) => <QuestionView key={qq.id} q={qq} index={i} total={session.questions.length} value={answers[qq.id]} onChange={() => undefined} result={byId.get(qq.id) ?? null} />)
        ) : (
          q && (
            <>
              <motion.div key={q.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
                <QuestionView q={q} index={idx} total={session.questions.length} value={answers[q.id]} onChange={(a) => setAnswers((s) => ({ ...s, [q.id]: a }))} />
              </motion.div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} aria-label={t('common.prev')}>
                  <ChevronLeft size={18} />
                </button>
                {idx + 1 < session.questions.length ? (
                  <button type="button" className="btn-primary flex-1" onClick={() => setIdx((i) => i + 1)}>
                    {t('common.next')} <ChevronRight size={18} />
                  </button>
                ) : (
                  <button type="button" className="btn-success flex-1" onClick={finish} disabled={busy}>
                    {busy && <Spinner className="h-4 w-4" />} {t('battle.finish')}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5" aria-label="questions">
                {session.questions.map((qq, i) => (
                  <button key={qq.id} type="button" onClick={() => setIdx(i)} className={cn('h-8 w-8 rounded-lg text-xs font-bold', i === idx ? 'bg-primary text-white' : answers[qq.id] !== undefined ? 'bg-success/25 text-success' : 'bg-card-2 text-muted')} aria-label={`${i + 1}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </>
          )
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={tab === 'daily' ? t('battle.dailyTitle') : t('battle.title')} subtitle={t('battle.subtitle')} icon={tab === 'daily' ? CalendarCheck : Swords} />
      <div className="mb-6">
        <Segmented
          label="mode"
          value={tab}
          onChange={(v) => setParams(v === 'daily' ? { daily: '1' } : {})}
          options={[
            { value: 'battle', label: t('battle.title') },
            { value: 'daily', label: t('battle.dailyTitle') },
          ]}
        />
      </div>
      {tab === 'battle' ? (
        <div className="card space-y-5 p-6">
          <div>
            <p className="label">{t('battle.difficulty')}</p>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button key={d} type="button" aria-pressed={difficulty === d} onClick={() => setDifficulty(d)} className={cn('rounded-2xl border p-4 text-center', difficulty === d ? 'border-primary bg-primary/10' : 'border-border bg-card-2')}>
                  <p className="font-bold">{t(`common.difficulty.${d}`)}</p>
                  <p className="text-xs text-muted">{t('battle.seconds', { n: d === 'easy' ? 150 : d === 'medium' ? 120 : 90 })}</p>
                  <p className="mt-1 text-xs text-muted">{t('battle.personalBest', { n: user?.battleBest[d] ?? 0 })}</p>
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="btn-primary h-12 w-full" onClick={() => begin(false)} disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : <Swords size={18} />} {t('battle.start')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card p-6">
            <p className="text-muted">{daily.data?.played ? t('battle.dailyPlayed', { n: daily.data.score ?? 0 }) : t('dashboard.dailyText')}</p>
            {!daily.data?.played && (
              <button type="button" className="btn-primary mt-4 h-12 w-full" onClick={() => begin(true)} disabled={busy || daily.isLoading}>
                {busy ? <Spinner className="h-4 w-4" /> : <CalendarCheck size={18} />} {t('battle.dailyStart')}
              </button>
            )}
          </div>
          <section className="card p-6" aria-labelledby="top-title">
            <h2 id="top-title" className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Crown className="text-amber-400" size={20} /> {t('battle.dailyTop')}
            </h2>
            {!daily.data?.top.length ? (
              <p className="text-sm text-muted">{t('battle.noTop')}</p>
            ) : (
              <ol className="space-y-2">
                {daily.data.top.map((r, i) => (
                  <li key={r.username} className="flex items-center gap-3 rounded-xl bg-card-2 px-3 py-2">
                    <span className="w-6 text-center font-black text-muted">{i + 1}</span>
                    <Avatar equipped={{ avatar: Object.keys(AVATARS).includes(r.avatar) ? r.avatar : 'avatar-rocket', theme: '', frame: '' }} size={30} />
                    <span className="flex-1 truncate font-semibold">{r.displayName}</span>
                    <span className="font-mono font-bold">{r.score}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
