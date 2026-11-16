import { useEffect, useState, type DragEvent } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, GripVertical, XCircle } from 'lucide-react';
import type { Answer, Question, QuestionResult } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { cn } from '../../lib/utils';
import { highlight } from '../../lib/markdown';
import { Markdown } from '../Markdown';
import { DifficultyBadge } from '../ui';

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <pre className="hljs-block my-3">
      <code className="hljs" dangerouslySetInnerHTML={{ __html: highlight(code, lang) }} />
    </pre>
  );
}

const guessLang = (code: string) => (/^\s*</.test(code) ? 'html' : /[{};]\s*$/m.test(code) && /:\s*[^;]+;/.test(code) && !/=>|function|const|let/.test(code) ? 'css' : 'javascript');

/** Bitta savol: barcha 7 tur (mcq, tf, fill, out, bug, order, match) */
export function QuestionView({
  q,
  index,
  total,
  value,
  onChange,
  result,
  disabled,
}: {
  q: Question;
  index?: number;
  total?: number;
  value: Answer | undefined;
  onChange: (a: Answer) => void;
  result?: QuestionResult | null;
  disabled?: boolean;
}) {
  const { t, tx } = useSettings();
  const locked = disabled || !!result;
  const name = `q-${q.id}`;

  return (
    <fieldset className={cn('card p-5 transition', result ? (result.correct ? 'border-success/60' : 'border-danger/60') : '')} disabled={locked}>
      <legend className="sr-only">{tx(q.prompt)}</legend>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        {index != null && total != null && <span className="chip">{t('quiz.question', { i: index + 1, n: total })}</span>}
        <span className="chip">{t(`game.types.${q.type}`)}</span>
        <DifficultyBadge difficulty={q.difficulty} />
      </div>
      <Markdown source={tx(q.prompt)} className="font-semibold text-fg [&>p]:my-1" />
      {q.code && <CodeBlock code={q.code} lang={guessLang(q.code)} />}

      <div className="mt-3">
        {(q.type === 'mcq' || q.type === 'bug') && (
          <div className="grid gap-2" role="radiogroup">
            {(q.options ?? []).map((opt, i) => {
              const chosen = value === i;
              const isRight = result?.answer?.index === i;
              return (
                <label
                  key={i}
                  className={cn(
                    'flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 transition',
                    chosen ? 'border-primary bg-primary/10' : 'border-border bg-card-2 hover:border-primary/50',
                    result && isRight && 'border-success bg-success/10',
                    result && chosen && !result.correct && 'border-danger bg-danger/10',
                    locked && 'cursor-default'
                  )}
                >
                  <input type="radio" name={name} className="accent-[var(--cv-primary)]" checked={chosen} onChange={() => onChange(i)} />
                  <span className="min-w-0 flex-1 break-words">{/[<>{}();=]/.test(tx(opt)) ? <code className="font-mono text-sm">{tx(opt)}</code> : tx(opt)}</span>
                </label>
              );
            })}
          </div>
        )}

        {q.type === 'tf' && (
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {[true, false].map((v) => (
              <label key={String(v)} className={cn('flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 font-semibold', value === v ? 'border-primary bg-primary/10' : 'border-border bg-card-2 hover:border-primary/50', result?.answer?.value === v && 'border-success bg-success/10')}>
                <input type="radio" name={name} className="sr-only" checked={value === v} onChange={() => onChange(v)} />
                {v ? t('quiz.trueLabel') : t('quiz.falseLabel')}
              </label>
            ))}
          </div>
        )}

        {(q.type === 'fill' || q.type === 'out') && (
          <input
            className="input font-mono"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t('quiz.typeAnswer')}
            aria-label={t('quiz.typeAnswer')}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        )}

        {q.type === 'order' && <OrderInput lines={q.lines ?? []} value={Array.isArray(value) ? value : undefined} onChange={onChange} disabled={locked} />}
        {q.type === 'match' && <MatchInput left={q.left ?? []} right={q.right ?? []} value={Array.isArray(value) ? value : undefined} onChange={onChange} disabled={locked} />}
      </div>

      {result && (
        <div className={cn('mt-4 rounded-xl p-3 text-sm', result.correct ? 'bg-success/10' : 'bg-danger/10')} role="status">
          <p className={cn('flex items-center gap-2 font-bold', result.correct ? 'text-success' : 'text-danger')}>
            {result.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {result.correct ? t('common.correct') : t('common.wrong')}
          </p>
          {!result.correct && result.answer?.text != null && (
            <p className="mt-1">
              {t('quiz.correctAnswer')}: <code className="font-mono">{result.answer.text}</code>
            </p>
          )}
          {!result.correct && result.answer?.lines && <CodeBlock code={result.answer.lines.join('\n')} />}
          {!result.correct && result.answer?.pairs && (
            <ul className="mt-1 list-disc pl-5 font-mono">
              {result.answer.pairs.map((p) => (
                <li key={p.left}>
                  {p.left} → {p.right}
                </li>
              ))}
            </ul>
          )}
          {tx(result.explanation) && <Markdown source={tx(result.explanation)} className="mt-1 text-muted [&>p]:my-1" />}
        </div>
      )}
    </fieldset>
  );
}

/** Kodni tartiblash: strelka tugmalari (klaviatura) + sudrab tashlash */
function OrderInput({ lines, value, onChange, disabled }: { lines: string[]; value?: number[]; onChange: (a: number[]) => void; disabled?: boolean }) {
  const { t } = useSettings();
  const [order, setOrder] = useState<number[]>(value ?? lines.map((_, i) => i));
  const [drag, setDrag] = useState<number | null>(null);
  useEffect(() => {
    if (!value) onChange(order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || disabled) return;
    const next = [...order];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setOrder(next);
    onChange(next);
  };
  return (
    <div>
      <p className="mb-2 text-xs text-muted">{t('quiz.orderHint')}</p>
      <ol className="grid gap-1.5">
        {order.map((li, pos) => (
          <li
            key={li}
            draggable={!disabled}
            onDragStart={() => setDrag(pos)}
            onDragOver={(e: DragEvent) => e.preventDefault()}
            onDrop={() => {
              if (drag != null) move(drag, pos);
              setDrag(null);
            }}
            className={cn('flex items-center gap-2 rounded-xl border border-border bg-card-2 px-2 py-1.5', drag === pos && 'opacity-50')}
          >
            <GripVertical size={16} className="shrink-0 cursor-grab text-muted" aria-hidden="true" />
            <code className="min-w-0 flex-1 whitespace-pre-wrap break-all font-mono text-sm">{lines[li]}</code>
            <button type="button" className="btn-ghost btn-sm btn-icon" onClick={() => move(pos, pos - 1)} disabled={disabled || pos === 0} aria-label={t('quiz.moveUp')}>
              <ArrowUp size={15} />
            </button>
            <button type="button" className="btn-ghost btn-sm btn-icon" onClick={() => move(pos, pos + 1)} disabled={disabled || pos === order.length - 1} aria-label={t('quiz.moveDown')}>
              <ArrowDown size={15} />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Juftlash: har bir chap element uchun o'ng tomondan tanlash (select — mobil va klaviatura uchun qulay) */
function MatchInput({ left, right, value, onChange, disabled }: { left: string[]; right: string[]; value?: number[]; onChange: (a: number[]) => void; disabled?: boolean }) {
  const { t } = useSettings();
  const current = value ?? left.map(() => -1);
  return (
    <div>
      <p className="mb-2 text-xs text-muted">{t('quiz.matchHint')}</p>
      <div className="grid gap-2">
        {left.map((l, i) => (
          <div key={l} className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
            <code className="rounded-xl border border-border bg-card-2 px-3 py-2 font-mono text-sm">{l}</code>
            <span className="hidden text-muted sm:block" aria-hidden="true">
              →
            </span>
            <select
              className="input font-mono text-sm"
              value={current[i]}
              disabled={disabled}
              aria-label={l}
              onChange={(e) => {
                const next = [...current];
                next[i] = Number(e.target.value);
                onChange(next);
              }}
            >
              <option value={-1}>{t('quiz.choose')}</option>
              {right.map((r, ri) => (
                <option key={r} value={ri}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

export const isAnswered = (q: Question, a: Answer | undefined) => {
  if (a === undefined || a === null) return false;
  if (q.type === 'fill' || q.type === 'out') return typeof a === 'string' && a.trim().length > 0;
  if (q.type === 'match') return Array.isArray(a) && a.every((x) => x >= 0);
  return true;
};
