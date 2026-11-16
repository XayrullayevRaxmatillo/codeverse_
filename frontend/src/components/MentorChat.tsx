import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Paperclip, Send, Trash2, X } from 'lucide-react';
import { askMentor, useAiStatus } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/api';
import { cn } from '../lib/utils';
import { Markdown } from './Markdown';
import { Avatar, Spinner } from './ui';
import type { TKey } from '../i18n';

export type MentorMode = 'chat' | 'explain' | 'error' | 'hint' | 'review' | 'generate';
const MODES: MentorMode[] = ['chat', 'explain', 'error', 'hint', 'review', 'generate'];

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

export interface MentorContext {
  lessonId?: string;
  challengeId?: string;
  getCode?: () => string;
  lastError?: string | null;
}

/** CODE AI mentor suhbati (lesson ichida drawer va alohida sahifada ishlatiladi) */
export function MentorChat({ context, initialMode = 'chat', compact }: { context?: MentorContext; initialMode?: MentorMode; compact?: boolean }) {
  const { t, lang } = useSettings();
  const { user } = useAuth();
  const status = useAiStatus();
  const [mode, setMode] = useState<MentorMode>(initialMode);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [code, setCode] = useState('');
  const [errText, setErrText] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => setMode(initialMode), [initialMode]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (busy) return;
    const attached = code || (mode !== 'chat' && mode !== 'generate' ? context?.getCode?.() ?? '' : '');
    const error = errText || (mode === 'error' ? context?.lastError ?? '' : '');
    const label = t(`mentor.modes.${mode}` as TKey);
    const userContent = text.trim() || label;
    const history = messages.filter((m) => !m.error).slice(-8).map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: 'user', content: userContent + (attached ? `\n\n\`\`\`\n${attached.slice(0, 1500)}\n\`\`\`` : '') }]);
    setText('');
    setBusy(true);
    try {
      const r = await askMentor({ mode, lang, message: text.trim() || undefined, code: attached || undefined, error: error || undefined, lessonId: context?.lessonId, challengeId: context?.challengeId, history });
      setMessages((m) => [...m, { role: 'assistant', content: r.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: errorMessage(err), error: true }]);
    } finally {
      setBusy(false);
    }
  }

  if (status.data && !status.data.enabled) {
    return (
      <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5" role="status">
        <p className="flex items-center gap-2 font-bold text-warning">
          <Bot size={20} /> {t('mentor.disabledTitle')}
        </p>
        <p className="mt-2 text-sm text-muted">{status.data.setup}</p>
        <pre className="hljs-block mt-3 text-xs">{`# server/.env\nAI_PROVIDER=anthropic   # yoki openai\nANTHROPIC_API_KEY=sk-ant-...\n# OPENAI_API_KEY=sk-...`}</pre>
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-0 flex-col', compact ? 'h-full' : 'h-[70vh] min-h-[420px]')}>
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Mode">
        {MODES.map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={cn('rounded-full border px-3 py-1 text-xs font-semibold', mode === m ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted hover:text-fg')}>
            {t(`mentor.modes.${m}` as TKey)}
          </button>
        ))}
        {messages.length > 0 && (
          <button type="button" className="ml-auto text-xs text-muted hover:text-danger" onClick={() => setMessages([])} aria-label={t('mentor.clear')} title={t('mentor.clear')}>
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-bg-2 p-3" aria-live="polite">
        <Bubble role="assistant" content={t('mentor.welcome')} />
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} error={m.error} avatar={user?.equipped} />
        ))}
        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Spinner className="h-4 w-4" /> {t('mentor.thinking')}
          </p>
        )}
      </div>

      <form onSubmit={send} className="mt-3 space-y-2">
        {!compact && (
          <div className="grid gap-2 md:grid-cols-2">
            <textarea className="input min-h-20 font-mono text-xs" placeholder={t('mentor.code')} aria-label={t('mentor.code')} value={code} onChange={(e) => setCode(e.target.value)} />
            <textarea className="input min-h-20 font-mono text-xs" placeholder={t('mentor.errorText')} aria-label={t('mentor.errorText')} value={errText} onChange={(e) => setErrText(e.target.value)} />
          </div>
        )}
        {compact && context?.getCode && (
          <p className="flex items-center gap-1 text-xs text-muted">
            <Paperclip size={12} /> {t('mentor.attached')}
          </p>
        )}
        <div className="flex gap-2">
          <textarea
            className="input min-h-11 flex-1 resize-none"
            rows={1}
            placeholder={t('mentor.placeholder')}
            aria-label={t('mentor.placeholder')}
            value={text}
            maxLength={4000}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button type="submit" className="btn-primary btn-icon" disabled={busy} aria-label={t('mentor.send')}>
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

function Bubble({ role, content, error, avatar }: Msg & { avatar?: Parameters<typeof Avatar>[0]['equipped'] }) {
  const mine = role === 'user';
  return (
    <div className={cn('flex gap-2', mine && 'flex-row-reverse')}>
      {mine ? (
        <Avatar equipped={avatar} size={30} />
      ) : (
        <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-white">
          <Bot size={16} />
        </span>
      )}
      <div className={cn('max-w-[85%] rounded-2xl px-3 py-2 text-sm', mine ? 'bg-primary text-white [&_code]:bg-white/20 [&_code]:text-white' : error ? 'border border-danger/40 bg-danger/10 text-danger' : 'border border-border bg-card')}>
        <Markdown source={content} className="[&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&_pre]:text-xs" />
      </div>
    </div>
  );
}

/** Lesson ichidagi yon panel */
export function MentorDrawer({ open, onClose, context, mode }: { open: boolean; onClose: () => void; context?: MentorContext; mode?: MentorMode }) {
  const { t } = useSettings();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t('mentor.title')}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-bg p-4 shadow-2xl"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: 'tween', duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold">
                <Bot className="text-primary" /> {t('mentor.title')}
              </h2>
              <button type="button" className="btn-ghost btn-sm btn-icon" onClick={onClose} aria-label={t('common.close')}>
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <MentorChat context={context} initialMode={mode ?? 'hint'} compact />
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
