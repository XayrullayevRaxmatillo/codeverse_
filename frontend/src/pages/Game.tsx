import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins, Flame, Gamepad2, Heart, Play, RotateCcw } from 'lucide-react';
import { answerGame, refillHearts, startGame, useCourses } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useReward } from '../context/RewardContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, ProgressBar, Spinner } from '../components/ui';
import { QuestionView, isAnswered } from '../components/quiz/QuestionView';
import { Confetti } from '../components/game/Confetti';
import { errorMessage } from '../lib/api';
import { cn } from '../lib/utils';
import type { Answer, Question, QuestionResult } from '../types';
import type { TKey } from '../i18n';

const TYPES = ['mixed', 'mcq', 'tf', 'fill', 'out', 'bug', 'order', 'match'] as const;

export default function Game() {
  const { t, tx } = useSettings();
  const { user, setUser } = useAuth();
  const { celebrate } = useReward();
  const toast = useToast();
  const courses = useCourses();
  const [type, setType] = useState<(typeof TYPES)[number]>('mixed');
  const [course, setCourse] = useState('');
  const [game, setGame] = useState<{ id: string; questions: Question[] } | null>(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState<Answer | undefined>();
  const [feedback, setFeedback] = useState<QuestionResult | null>(null);
  const [hearts, setHearts] = useState(user?.hearts ?? 5);
  const [combo, setCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function begin() {
    setBusy(true);
    try {
      const g = await startGame({ type, course: course || undefined, count: 8 });
      setGame(g);
      setHearts(g.hearts);
      setIdx(0);
      setAnswer(undefined);
      setFeedback(null);
      setCombo(0);
      setCorrect(0);
      setDone(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!game || answer === undefined) return;
    const q = game.questions[idx];
    setBusy(true);
    try {
      const r = await answerGame(game.id, q.id, answer);
      setFeedback({ id: q.id, correct: r.correct, explanation: r.explanation, answer: r.answer });
      setHearts(r.hearts);
      setCombo((c) => (r.correct ? c + 1 : 0));
      if (r.correct) setCorrect((c) => c + 1);
      celebrate(r.reward);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (!game) return;
    if (idx + 1 >= game.questions.length) return setDone(true);
    setIdx((i) => i + 1);
    setAnswer(undefined);
    setFeedback(null);
  }

  async function refill() {
    try {
      const r = await refillHearts();
      setUser(r.user);
      setHearts(r.user.hearts);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const q = game?.questions[idx];
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('game.title')} subtitle={t('game.subtitle')} icon={Gamepad2} />

      {!game || done ? (
        <div className="space-y-4">
          {done && game && (
            <motion.div className="card relative overflow-hidden p-6 text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }} role="status">
              {correct >= game.questions.length * 0.7 && <Confetti />}
              <p className="text-3xl font-black">{t('game.finished')}</p>
              <p className="mt-2 text-lg text-muted">{t('game.result', { c: correct, n: game.questions.length })}</p>
            </motion.div>
          )}
          <div className="card space-y-4 p-6">
            <div>
              <p className="label">{t('game.type')}</p>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((ty) => (
                  <button key={ty} type="button" onClick={() => setType(ty)} aria-pressed={type === ty} className={cn('rounded-xl border px-3 py-2 text-sm font-semibold', type === ty ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted hover:text-fg')}>
                    {t(`game.types.${ty}` as TKey)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="game-course">
                {t('game.course')}
              </label>
              <select id="game-course" className="input" value={course} onChange={(e) => setCourse(e.target.value)}>
                <option value="">{t('game.anyCourse')}</option>
                {(courses.data ?? [])
                  .filter((c) => c.unlocked && !c.comingSoon)
                  .map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {tx(c.title)}
                    </option>
                  ))}
              </select>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted">
              <Heart size={16} className="fill-rose-500 text-rose-500" /> {t('game.heartsInfo')}
            </p>
            <button type="button" className="btn-primary h-12 w-full" onClick={begin} disabled={busy}>
              {busy ? <Spinner className="h-4 w-4" /> : done ? <RotateCcw size={18} /> : <Play size={18} />} {done ? t('game.again') : t('game.start')}
            </button>
          </div>
        </div>
      ) : (
        q && (
          <div className="space-y-4">
            <div className="card flex flex-wrap items-center gap-4 p-4">
              <div className="flex items-center gap-1" aria-label={`${t('common.hearts')}: ${hearts}`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <motion.span key={i} animate={i === hearts ? { scale: [1, 1.3, 1] } : undefined}>
                    <Heart size={20} className={i < hearts ? 'fill-rose-500 text-rose-500' : 'text-muted'} />
                  </motion.span>
                ))}
              </div>
              <AnimatePresence>
                {combo > 1 && (
                  <motion.span key={combo} className="chip border-orange-500/40 text-orange-400" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                    <Flame size={14} /> {t('game.combo', { n: combo })}
                  </motion.span>
                )}
              </AnimatePresence>
              <div className="ml-auto w-40">
                <ProgressBar value={((idx + (feedback ? 1 : 0)) / game.questions.length) * 100} label="progress" />
              </div>
            </div>
            {hearts === 0 && (
              <div className="card flex flex-wrap items-center gap-3 border-warning/40 p-4 text-sm">
                <p className="flex-1 text-muted">{t('game.heartsEmpty', { m: 20 })}</p>
                <button type="button" className="btn-secondary btn-sm" onClick={refill}>
                  <Coins size={15} className="text-amber-400" /> {t('game.refill', { n: 30 })}
                </button>
              </div>
            )}
            <motion.div key={q.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
              <QuestionView q={q} index={idx} total={game.questions.length} value={answer} onChange={setAnswer} result={feedback} />
            </motion.div>
            {feedback ? (
              <button type="button" className="btn-primary h-12 w-full" onClick={next}>
                {idx + 1 >= game.questions.length ? t('game.finished') : t('game.next')}
              </button>
            ) : (
              <button type="button" className="btn-success h-12 w-full" onClick={submit} disabled={busy || !isAnswered(q, answer)}>
                {busy && <Spinner className="h-4 w-4" />} {t('common.check')}
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}
