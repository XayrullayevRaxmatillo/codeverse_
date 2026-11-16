import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Eraser, Monitor, Play, RotateCcw, Smartphone, Tablet, Terminal } from 'lucide-react';
import type { CodeFiles, SandboxMode } from '../../types';
import { buildDocument, newRunId, SANDBOX_FLAGS, type ConsoleEntry } from '../../lib/sandbox';
import { useSettings } from '../../context/SettingsContext';
import { cn } from '../../lib/utils';
import { Skeleton } from '../ui';
import type { EditorLang } from './CodeMirrorEditor';

const CodeMirrorEditor = lazy(() => import('./CodeMirrorEditor'));

type Tab = 'html' | 'css' | 'js';
type Device = 'mobile' | 'tablet' | 'desktop';
const DEVICE_WIDTH: Record<Device, string> = { mobile: '375px', tablet: '768px', desktop: '100%' };

export interface PlaygroundProps {
  mode: SandboxMode;
  files: CodeFiles;
  onChange: (files: CodeFiles) => void;
  onReset?: () => void;
  onRun?: () => void;
  toolbarExtra?: ReactNode;
  height?: string;
}

/** Interaktiv muharrir: HTML/CSS/JS tablar, ishga tushirish, konsol, qurilma ko'rinishlari */
export function Playground({ mode, files, onChange, onReset, onRun, toolbarExtra, height = 'min(70vh, 640px)' }: PlaygroundProps) {
  const { t, isDark } = useSettings();
  const tabs: Tab[] = mode === 'web' ? ['html', 'css', 'js'] : mode === 'react' ? ['js', 'css'] : ['js'];
  const [tab, setTab] = useState<Tab>(tabs[0]);
  const [device, setDevice] = useState<Device>('desktop');
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [srcDoc, setSrcDoc] = useState('');
  const [panel, setPanel] = useState<'preview' | 'console'>(mode === 'js' ? 'console' : 'preview');
  const runIdRef = useRef('');
  const frameRef = useRef<HTMLIFrameElement>(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(() => {
    if (!tabs.includes(tab)) setTab(tabs[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const run = useCallback(() => {
    const runId = newRunId();
    runIdRef.current = runId;
    setLogs([]);
    setSrcDoc(buildDocument({ mode, files: filesRef.current, runId, theme: isDark ? 'dark' : 'light' }));
    onRun?.();
  }, [mode, isDark, onRun]);

  // Birinchi ochilishda bir marta ishga tushirish
  const firstRun = useRef(false);
  useEffect(() => {
    if (firstRun.current) return;
    firstRun.current = true;
    const runId = newRunId();
    runIdRef.current = runId;
    setSrcDoc(buildDocument({ mode, files: filesRef.current, runId, theme: isDark ? 'dark' : 'light' }));
  }, [mode, isDark]);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const d = ev.data as { source?: string; runId?: string; type?: string; level?: ConsoleEntry['level']; text?: string };
      if (ev.source !== frameRef.current?.contentWindow || d?.source !== 'codeverse' || d.runId !== runIdRef.current) return;
      if (d.type === 'console' && d.text != null) setLogs((l) => [...l.slice(-199), { level: d.level ?? 'log', text: String(d.text) }]);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const lang: EditorLang = tab === 'js' ? (mode === 'react' ? 'jsx' : 'js') : tab;
  const tabLabel = (tb: Tab) => (tb === 'js' ? (mode === 'react' ? 'App.jsx' : 'script.js') : tb === 'html' ? 'index.html' : 'style.css');
  const errors = useMemo(() => logs.filter((l) => l.level === 'error').length, [logs]);

  return (
    <div className="card overflow-hidden" style={{ minHeight: 0 }}>
      {/* Asboblar paneli */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card-2 px-3 py-2">
        <div className="flex gap-1" role="tablist" aria-label="Files">
          {tabs.map((tb) => (
            <button key={tb} type="button" role="tab" aria-selected={tab === tb} onClick={() => setTab(tb)} className={cn('rounded-lg px-3 py-1.5 font-mono text-xs font-semibold', tab === tb ? 'bg-card text-fg shadow' : 'text-muted hover:text-fg')}>
              {tabLabel(tb)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {toolbarExtra}
          {onReset && (
            <button type="button" className="btn-ghost btn-sm" onClick={onReset} title={t('lesson.reset')}>
              <RotateCcw size={15} /> <span className="hidden sm:inline">{t('lesson.reset')}</span>
            </button>
          )}
          <button type="button" className="btn-primary btn-sm" onClick={run} title={t('lesson.shortcuts')}>
            <Play size={15} /> {t('lesson.run')}
          </button>
        </div>
      </div>

      <div className="grid min-h-0 lg:grid-cols-2" style={{ height }}>
        {/* Muharrir */}
        <div className="min-h-[260px] min-w-0 border-b border-border lg:border-b-0 lg:border-r" style={{ background: isDark ? '#282c34' : '#fff' }}>
          <Suspense fallback={<Skeleton className="m-3 h-40" />}>
            <CodeMirrorEditor key={tab} value={files[tab]} language={lang} dark={isDark} ariaLabel={tabLabel(tab)} onRun={run} onChange={(v) => onChange({ ...filesRef.current, [tab]: v })} />
          </Suspense>
        </div>

        {/* Natija: preview + konsol */}
        <div className="flex min-h-[260px] min-w-0 flex-col">
          <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
            {mode !== 'js' && (
              <button type="button" onClick={() => setPanel('preview')} aria-pressed={panel === 'preview'} className={cn('rounded-lg px-2.5 py-1 text-xs font-semibold', panel === 'preview' ? 'bg-card-2 text-fg' : 'text-muted')}>
                {t('lesson.preview')}
              </button>
            )}
            <button type="button" onClick={() => setPanel('console')} aria-pressed={panel === 'console'} className={cn('flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold', panel === 'console' ? 'bg-card-2 text-fg' : 'text-muted')}>
              <Terminal size={13} /> {t('lesson.console')}
              {logs.length > 0 && <span className={cn('rounded-full px-1.5 text-[10px]', errors ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary')}>{logs.length}</span>}
            </button>
            <div className="ml-auto flex items-center gap-0.5">
              {panel === 'preview' && mode !== 'js' ? (
                (['mobile', 'tablet', 'desktop'] as Device[]).map((d) => {
                  const Icon = d === 'mobile' ? Smartphone : d === 'tablet' ? Tablet : Monitor;
                  return (
                    <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d} title={t(`lesson.devices.${d}`)} aria-label={t(`lesson.devices.${d}`)} className={cn('grid h-8 w-8 place-items-center rounded-lg', device === d ? 'bg-card-2 text-primary' : 'text-muted hover:text-fg')}>
                      <Icon size={15} />
                    </button>
                  );
                })
              ) : (
                <button type="button" className="btn-ghost btn-sm" onClick={() => setLogs([])}>
                  <Eraser size={14} /> {t('lesson.clear')}
                </button>
              )}
            </div>
          </div>
          <div className="relative min-h-0 flex-1 overflow-auto bg-[repeating-conic-gradient(var(--cv-card-2)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
            <div className={cn('mx-auto h-full transition-all', panel === 'preview' && mode !== 'js' ? 'block' : 'hidden')} style={{ width: DEVICE_WIDTH[device], maxWidth: '100%' }}>
              <iframe ref={frameRef} title={t('lesson.preview')} sandbox={SANDBOX_FLAGS} srcDoc={srcDoc} className="h-full w-full border-0 bg-white" />
            </div>
            {(panel === 'console' || mode === 'js') && (
              <div className={cn('absolute inset-0 overflow-auto bg-[#0d1326] p-3 font-mono text-[13px] leading-relaxed', panel === 'console' ? 'block' : 'hidden')} role="log" aria-live="polite" aria-label={t('lesson.console')}>
                {logs.length === 0 ? (
                  <p className="text-slate-500">{t('lesson.noConsole')}</p>
                ) : (
                  logs.map((l, i) => (
                    <div key={i} className={cn('whitespace-pre-wrap break-words border-b border-white/5 py-1', l.level === 'error' ? 'text-red-400' : l.level === 'warn' ? 'text-amber-300' : l.level === 'info' ? 'text-cyan-300' : 'text-slate-200')}>
                      <span className="mr-2 select-none text-slate-600">›</span>
                      {l.text}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
