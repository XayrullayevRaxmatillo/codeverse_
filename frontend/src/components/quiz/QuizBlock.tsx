import { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import type { Answer, GradeResult, Question } from '../../types';
import { QuestionView, isAnswered } from './QuestionView';
import { useSettings } from '../../context/SettingsContext';
import { Spinner } from '../ui';
import { cn } from '../../lib/utils';

/** Bir nechta savolni birga ko'rsatib, bitta tugma bilan yuboradi (dars mini-testi, imtihon) */
export function QuizBlock({
  questions,
  onSubmit,
  passScore = 70,
  submitLabel,
  resetKey,
  disabled,
}: {
  questions: Question[];
  onSubmit: (answers: Record<string, Answer>) => Promise<GradeResult | null>;
  passScore?: number;
  submitLabel?: string;
  resetKey?: string;
  disabled?: boolean;
}) {
  const { t } = useSettings();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<GradeResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    setAnswers({});
    setResult(null);
  }, [resetKey]);

  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.id])).length;
  const all = answeredCount === questions.length;

  async function submit() {
    setBusy(true);
    try {
      const r = await onSubmit(answers);
      if (r) setResult(r);
    } finally {
      setBusy(false);
    }
  }

  const byId = new Map(result?.results.map((r) => [r.id, r]));
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <QuestionView key={`${q.id}-${round}`} q={q} index={i} total={questions.length} value={answers[q.id]} onChange={(a) => setAnswers((s) => ({ ...s, [q.id]: a }))} result={byId.get(q.id) ?? null} disabled={disabled} />
      ))}
      <div className="card flex flex-wrap items-center gap-3 p-4">
        {result ? (
          <>
            <p className={cn('flex items-center gap-2 text-lg font-extrabold', result.percent >= passScore ? 'text-success' : 'text-warning')} role="status">
              <CheckCircle2 /> {t('quiz.score', { score: result.score, total: result.total })} · {result.percent}%
            </p>
            <button
              type="button"
              className="btn-secondary ml-auto"
              onClick={() => {
                setResult(null);
                setAnswers({});
                setRound((r) => r + 1);
              }}
            >
              <RotateCcw size={16} /> {t('common.tryAgain')}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">{all ? t('quiz.answered', { n: answeredCount }) : `${t('quiz.answered', { n: answeredCount })} / ${questions.length}`}</p>
            <button type="button" className="btn-primary ml-auto" onClick={submit} disabled={!all || busy || disabled} title={all ? undefined : t('quiz.unanswered')}>
              {busy && <Spinner className="h-4 w-4" />} {submitLabel ?? t('lesson.submitQuiz')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
