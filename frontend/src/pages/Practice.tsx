import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Wrench } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { PageHeader, Segmented } from '../components/ui';
import { Playground } from '../components/editor/Playground';
import { safeStorage } from '../lib/utils';
import type { CodeFiles, SandboxMode } from '../types';

const STARTERS: Record<SandboxMode, CodeFiles> = {
  web: { html: '<h1>Salom, CODEVERSE!</h1>\n<button id="btn">Bos meni</button>\n', css: 'body { font-family: system-ui; padding: 24px; }\nh1 { color: #7c5cfc; }\n', js: 'document.querySelector("#btn").addEventListener("click", () => {\n  console.log("Tugma bosildi! 🎉");\n});\n' },
  js: { html: '', css: '', js: 'const langs = ["HTML", "CSS", "JavaScript", "React"];\nlangs.forEach((l, i) => console.log(`${i + 1}. ${l}`));\n' },
  react: { html: '', css: 'button { font-size: 18px; padding: 8px 16px; }\n', js: 'const { useState } = React;\n\nfunction App() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>⚡ {count}</button>;\n}\n' },
};

const load = (mode: SandboxMode): CodeFiles => {
  try {
    const v = JSON.parse(safeStorage.get(`cv-playground-${mode}`) || 'null') as CodeFiles | null;
    return v && typeof v.js === 'string' ? v : STARTERS[mode];
  } catch {
    return STARTERS[mode];
  }
};

export default function Practice() {
  const { t } = useSettings();
  const [mode, setMode] = useState<SandboxMode>('web');
  const [files, setFiles] = useState<CodeFiles>(() => load('web'));

  const change = (f: CodeFiles) => {
    setFiles(f);
    safeStorage.set(`cv-playground-${mode}`, JSON.stringify(f));
  };

  return (
    <div>
      <PageHeader
        title={t('practice.title')}
        subtitle={t('practice.subtitle')}
        icon={Wrench}
        action={
          <Link to="/game" className="btn-secondary">
            <Gamepad2 size={18} /> {t('practice.review')}
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold">{t('practice.mode')}:</span>
        <Segmented
          label={t('practice.mode')}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setFiles(load(m));
          }}
          options={(['web', 'js', 'react'] as SandboxMode[]).map((m) => ({ value: m, label: t(`practice.modes.${m}`) }))}
        />
      </div>
      <Playground key={mode} mode={mode} files={files} onChange={change} onReset={() => change(STARTERS[mode])} height="min(75vh, 720px)" />
      <p className="mt-3 text-sm text-muted">{t('practice.playgroundText')} · {t('lesson.shortcuts')}</p>
    </div>
  );
}
