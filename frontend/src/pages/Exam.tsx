import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, PartyPopper, RotateCcw, Trophy } from 'lucide-react';
import { submitExam, useExam, useInvalidateProgress } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { useReward } from '../context/RewardContext';
import { useToast } from '../context/ToastContext';
import { ErrorState, PageSkeleton, Spinner } from '../components/ui';
import { QuestionView, isAnswered } from '../components/quiz/QuestionView';
import { Confetti } from '../components/game/Confetti';
import { errorMessage } from '../lib/api';
import { cn, fmtDuration } from '../lib/utils';
import type { Answer, GradeResult } from '../types';

export default function Exam() {
  const { moduleId } = useParams();
  const { t, tx } = useSettings();
  const { celebrate } = useReward();
  const toast = useToast();
  const invalidate = useInvalidateProgress();
  const q = useExam(moduleId);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<{ result: GradeResult; passed: boolean; passScore: number; best: number } | null>(null);
  const submitRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!started || outcome) return;
    const id = window.setInterval(() => setLeft((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [started, outcome]);

  useEffect(() => {
    if (started && !outcome && left <= 0) {
      toast.info(t('exam.timeUp'));
      submitRef.current();
    }
  }, [left, started, outcome, toast, t]);

  if (q.isLoading) return <PageSkeleton />;
  if (q.isError || !q.data) return <ErrorState error={q.error} />;
  const exam = q.data;

  async function submit() {
    if (busy || outcome) return;
    setBusy(true);
    try {
      const r = await submitExam(exam.module.id, answers);
      setOutcome(r);
      celebrate(r.reward);
      invalidate();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  submitRef.current = submit;

  const answered = exam.questions.filter((qq) => isAnswered(qq, answers[qq.id])).length;
  const byId = new Map(outcome?.result.results.map((r) => [r.id, r]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={`/course/${exam.course.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-muted no-underline hover:text-fg">
        <ArrowLeft size={16} /> {tx(exam.course.title)}
      </Link>
      <header className="card p-6">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: exam.course.color }}>
          {t('exam.title')}
        </p>
        <h1 className="mt-1 text-2xl font-black">{tx(exam.module.title)}</h1>
        <p className="mt-2 text-muted">{t('exam.intro', { n: exam.questions.length, m: Math.round(exam.timeLimitSec / 60), p: exam.module.passScore })}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {exam.best != null && <span className="chip">{t('exam.best', { n: exam.best })}</span>}
          <span className="chip">{t('exam.attempts', { n: exam.attempts })}</span>
        </div>
        {!started && (
          <button
            type="button"
            className="btn-primary mt-5"
            onClick={() => {
              setStarted(true);
              setLeft(exam.timeLimitSec);
            }}
          >
            <Trophy size={18} /> {t('exam.start')}
          </button>
        )}
      </header>

      {outcome && (
        <motion.section className={cn('card relative overflow-hidden p-6 text-center', outcome.passed ? 'border-success/60' : 'border-warning/60')} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} role="status">
          {outcome.passed && <Confetti />}
          <div className="relative">
            {outcome.passed ? <PartyPopper className="mx-auto text-success" size={40} /> : <RotateCcw className="mx-auto text-warning" size={40} />}
            <h2 className={cn('mt-3 text-2xl font-black', outcome.passed ? 'text-success' : 'text-warning')}>{outcome.passed ? t('exam.passed', { n: outcome.result.percent }) : t('exam.failed', { n: outcome.result.percent, p: outcome.passScore })}</h2>
            <p className="mt-1 text-muted">{t('quiz.score', { score: outcome.result.score, total: outcome.result.total })}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link to={`/course/${exam.course.slug}`} className="btn-primary">
                {outcome.passed ? t('exam.nextModule') : t('lesson.toMap')}
              </Link>
              {!outcome.passed && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setOutcome(null);
                    setAnswers({});
                    setLeft(exam.timeLimitSec);
                    q.refetch();
                  }}
                >
                  <RotateCcw size={16} /> {t('exam.retry')}
                </button>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {started && (
        <>
          {!outcome && (
            <div className="sticky top-16 z-10 -mx-1 flex items-center justify-between rounded-2xl border border-border bg-bg/90 px-4 py-2 backdrop-blur">
              <span className="text-sm text-muted">{t('quiz.answered', { n: answered })} / {exam.questions.length}</span>
              <span className={cn('flex items-center gap-1 font-mono font-bold', left < 60 ? 'text-danger' : 'text-fg')} aria-label={t('exam.timeLeft')} role="timer">
                <Clock size={16} /> {fmtDuration(left)}
              </span>
            </div>
          )}
          {exam.questions.map((qq, i) => (
            <QuestionView key={qq.id} q={qq} index={i} total={exam.questions.length} value={answers[qq.id]} onChange={(a) => setAnswers((s) => ({ ...s, [qq.id]: a }))} result={byId.get(qq.id) ?? null} />
          ))}
          {!outcome && (
            <button type="button" className="btn-primary h-12 w-full" onClick={submit} disabled={busy}>
              {busy && <Spinner className="h-4 w-4" />} {t('common.submit')}
            </button>
          )}
        </>
      )}
    </div>
  );
}
