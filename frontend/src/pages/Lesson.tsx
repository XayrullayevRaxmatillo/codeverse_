import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Flag, ListChecks, Map, Play, Trophy, UserPlus } from 'lucide-react';
import { completeLesson, saveLessonCode, sendReport, submitChallenge, submitLessonQuiz, useInvalidateProgress, useLesson } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useReward } from '../context/RewardContext';
import { useToast } from '../context/ToastContext';
import { ErrorState, Modal, PageSkeleton } from '../components/ui';
import { Markdown } from '../components/Markdown';
import { CodeBlock } from '../components/quiz/QuestionView';
import { QuizBlock } from '../components/quiz/QuizBlock';
import { ChallengePanel } from '../components/editor/ChallengePanel';
import { Playground } from '../components/editor/Playground';
import { markGuestCompleted, readGuest } from '../lib/guest';
import { errorMessage } from '../lib/api';
import type { Answer, CodeFiles, LessonProgress } from '../types';

const exampleFiles = (code: string, mode: string): CodeFiles => {
  if (mode !== 'web') return { html: '', css: '', js: code };
  const css = [...code.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1].trim()).join('\n');
  const html = code.replace(/<style>[\s\S]*?<\/style>/g, '').trim();
  return { html, css, js: '' };
};

export default function Lesson() {
  const { id } = useParams();
  const { t, tx } = useSettings();
  const { user } = useAuth();
  const { celebrate } = useReward();
  const toast = useToast();
  const invalidate = useInvalidateProgress();
  const q = useLesson(id);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [guestSolved, setGuestSolved] = useState(false);
  const [guestQuiz, setGuestQuiz] = useState(false);
  const [tryOpen, setTryOpen] = useState(false);
  const [tryFiles, setTryFiles] = useState<CodeFiles>({ html: '', css: '', js: '' });
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState('');

  useEffect(() => {
    if (q.data) setProgress(q.data.progress);
    setGuestSolved(false);
    setGuestQuiz(false);
  }, [q.data]);

  const lessonId = q.data?.lesson.id;
  const autosave = useCallback((code: CodeFiles) => {
    if (lessonId) saveLessonCode(lessonId, code).catch(() => undefined);
  }, [lessonId]);

  if (q.isLoading) return <PageSkeleton />;
  if (q.isError || !q.data) {
    return (
      <div className="space-y-4">
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
        {!user && (
          <div className="text-center">
            <Link to="/register" className="btn-primary">
              <UserPlus size={18} /> {t('course.guestRegister')}
            </Link>
          </div>
        )}
      </div>
    );
  }

  const { lesson, challenge, quiz } = q.data;
  const guest = !user;
  const completed = guest ? readGuest().completed.includes(lesson.id) || (guestSolved && guestQuiz) : !!progress?.completed;

  const finishGuestIfReady = (solved: boolean, quizOk: boolean) => {
    if (guest && (solved || !challenge) && (quizOk || quiz.length === 0)) {
      markGuestCompleted(lesson.id);
      toast.success(t('lesson.lessonCompleted'), t('lesson.guestBanner'));
    }
  };

  async function onSolved(code: CodeFiles) {
    if (!challenge) return;
    if (guest) {
      setGuestSolved(true);
      finishGuestIfReady(true, guestQuiz);
      return {};
    }
    const r = await submitChallenge(challenge.id, code);
    if (r.progress) setProgress(r.progress);
    celebrate(r.reward);
    if (r.lessonCompleted) invalidate();
    return { explanation: r.explanation };
  }

  async function onQuiz(answers: Record<string, Answer>) {
    try {
      const r = await submitLessonQuiz(lesson.id, answers, guest);
      if (guest) {
        const ok = r.result.percent >= 70;
        setGuestQuiz(ok);
        finishGuestIfReady(guestSolved, ok);
      } else {
        if (r.progress) setProgress(r.progress);
        celebrate(r.reward);
        if (r.lessonCompleted) invalidate();
      }
      toast[r.result.percent >= 70 ? 'success' : 'info'](r.result.percent >= 70 ? t('lesson.quizPassed', { n: r.result.percent }) : t('lesson.quizFailed', { n: r.result.percent }));
      return r.result;
    } catch (e) {
      toast.error(errorMessage(e));
      return null;
    }
  }

  async function complete() {
    try {
      const r = await completeLesson(lesson.id);
      setProgress(r.progress);
      celebrate(r.reward);
      invalidate();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function report() {
    try {
      await sendReport({ targetType: 'lesson', targetId: lesson.id, reason: 'error', message: reportMsg });
      toast.success(t('common.reportSent'));
      setReportOpen(false);
      setReportMsg('');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <article className="mx-auto max-w-5xl space-y-8">
      <header>
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted" aria-label="breadcrumb">
          <Link to="/map" className="no-underline hover:text-fg">
            {t('nav.map')}
          </Link>
          <span aria-hidden="true">/</span>
          <Link to={`/course/${lesson.course.slug}`} className="no-underline hover:text-fg" style={{ color: lesson.course.color }}>
            {tx(lesson.course.title)}
          </Link>
          <span aria-hidden="true">/</span>
          <span>{tx(lesson.module.title)}</span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{tx(lesson.title)}</h1>
          {user && (
            <button type="button" className="btn-ghost btn-sm" onClick={() => setReportOpen(true)}>
              <Flag size={15} /> <span className="hidden sm:inline">{t('common.report')}</span>
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="chip">{t('lesson.position', { i: lesson.position.index, n: lesson.position.total })}</span>
          <span className="chip">
            <Clock size={13} /> {t('lesson.minRead', { n: lesson.minutes })}
          </span>
          {completed && (
            <span className="chip border-success/40 text-success">
              <CheckCircle2 size={13} /> {t('common.status.completed')}
            </span>
          )}
        </div>
        {guest && (
          <div className="card mt-4 flex flex-wrap items-center justify-between gap-3 border-secondary/40 p-4">
            <p className="text-sm text-muted">{t('lesson.guestBanner')}</p>
            <Link to="/register" className="btn-primary btn-sm">
              <UserPlus size={16} /> {t('lesson.registerToSave')}
            </Link>
          </div>
        )}
      </header>

      <section className="card p-6 sm:p-8" aria-labelledby="theory">
        <h2 id="theory" className="mb-2 flex items-center gap-2 text-lg font-extrabold">
          <BookOpen size={20} className="text-primary" /> {t('lesson.theory')}
        </h2>
        <Markdown source={tx(lesson.content)} />
        {lesson.example && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">{t('lesson.example')}</h3>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => {
                  setTryFiles(exampleFiles(lesson.example, lesson.exampleMode));
                  setTryOpen(true);
                }}
              >
                <Play size={15} /> {t('lesson.tryExample')}
              </button>
            </div>
            <CodeBlock code={lesson.example} lang={lesson.exampleMode === 'web' ? 'html' : 'javascript'} />
          </div>
        )}
      </section>

      {challenge && <ChallengePanel challenge={challenge} initialCode={progress?.savedCode} solvedBefore={progress?.challengeDone} onSolved={onSolved} onAutosave={user ? autosave : undefined} lessonId={lesson.id} heading={t('lesson.challenge')} />}

      {quiz.length > 0 && (
        <section aria-labelledby="quiz-title">
          <h2 id="quiz-title" className="mb-4 flex items-center gap-2 text-lg font-extrabold">
            <ListChecks size={20} className="text-primary" /> {t('lesson.quiz')}
            {progress?.quizBest != null && <span className="chip">{progress.quizBest}%</span>}
          </h2>
          <QuizBlock questions={quiz} onSubmit={onQuiz} resetKey={lesson.id} />
        </section>
      )}

      {/* Yakun va navigatsiya */}
      <section className="card p-6">
        {completed ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-success/20 text-success">
              <CheckCircle2 size={26} />
            </span>
            <p className="text-lg font-extrabold">{t('lesson.lessonCompleted')}</p>
            <div className="ml-auto flex flex-wrap gap-2">
              {lesson.nextId ? (
                <Link to={`/lesson/${lesson.nextId}`} className="btn-primary">
                  {t('lesson.nextLesson')} <ArrowRight size={18} />
                </Link>
              ) : user ? (
                <Link to={`/exam/${lesson.module.id}`} className="btn-primary">
                  <Trophy size={18} /> {t('lesson.toExam')}
                </Link>
              ) : (
                <Link to="/register" className="btn-primary">
                  <UserPlus size={18} /> {t('course.guestRegister')}
                </Link>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted">{t('lesson.requirements')}</p>
            {user && !challenge && quiz.length === 0 && (
              <button type="button" className="btn-primary ml-auto" onClick={complete}>
                {t('common.continue')}
              </button>
            )}
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-border pt-4">
          {lesson.prevId ? (
            <Link to={`/lesson/${lesson.prevId}`} className="btn-ghost">
              <ArrowLeft size={18} /> {t('common.prev')}
            </Link>
          ) : (
            <span />
          )}
          <Link to={`/course/${lesson.course.slug}`} className="btn-ghost">
            <Map size={18} /> {t('lesson.toMap')}
          </Link>
        </div>
      </section>

      <Modal open={tryOpen} onClose={() => setTryOpen(false)} title={t('lesson.example')} wide>
        <Playground mode={lesson.exampleMode} files={tryFiles} onChange={setTryFiles} height="min(60vh, 520px)" />
      </Modal>
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t('common.report')}>
        <textarea className="input min-h-28" value={reportMsg} maxLength={1000} onChange={(e) => setReportMsg(e.target.value)} aria-label={t('common.report')} />
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-primary" onClick={report} disabled={!reportMsg.trim()}>
            {t('common.submit')}
          </button>
        </div>
      </Modal>
    </article>
  );
}
