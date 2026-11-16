import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, CheckCircle2, Code2, Gamepad2, GraduationCap, Sparkles, Trophy } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { CourseIcon } from '../components/CourseIcon';
import type { TKey } from '../i18n';

const WORLDS = [
  { icon: 'island', color: '#F97316', title: ['HTML oroli', 'Остров HTML', 'HTML Island'] },
  { icon: 'trees', color: '#22C55E', title: ["CSS o'rmoni", 'Лес CSS', 'CSS Forest'] },
  { icon: 'castle', color: '#EAB308', title: ['JavaScript qirolligi', 'Королевство JavaScript', 'JavaScript Kingdom'] },
  { icon: 'city', color: '#06B6D4', title: ['React shahri', 'Город React', 'React City'] },
  { icon: 'mountain', color: '#3178C6', title: ["TypeScript tog'lari", 'Горы TypeScript', 'TypeScript Mountains'], soon: true },
  { icon: 'server', color: '#10B981', title: ['Backend galaktikasi', 'Галактика Backend', 'Backend Galaxy'], soon: true },
  { icon: 'galaxy', color: '#EC4899', title: ['Full Stack koinoti', 'Вселенная Full Stack', 'Full Stack Universe'], soon: true },
] as const;

const FEATURES: { icon: typeof Code2; t: TKey; d: TKey }[] = [
  { icon: Code2, t: 'landing.f1t', d: 'landing.f1d' },
  { icon: CheckCircle2, t: 'landing.f2t', d: 'landing.f2d' },
  { icon: Gamepad2, t: 'landing.f3t', d: 'landing.f3d' },
  { icon: Bot, t: 'landing.f4t', d: 'landing.f4d' },
  { icon: Trophy, t: 'landing.f5t', d: 'landing.f5d' },
  { icon: GraduationCap, t: 'landing.f6t', d: 'landing.f6d' },
];

const SNIPPET = `function App() {
  const [xp, setXp] = useState(0);
  return (
    <button onClick={() => setXp(xp + 50)}>
      ⚡ {xp} XP
    </button>
  );
}`;

export default function Landing() {
  const { t, lang } = useSettings();
  const li = lang === 'uz' ? 0 : lang === 'ru' ? 1 : 2;
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="chip border-primary/40 text-primary">
            <Sparkles size={14} /> {t('landing.badge')}
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {t('landing.title').split(' ').slice(0, -1).join(' ')} <span className="gradient-text">{t('landing.title').split(' ').slice(-1)}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{t('landing.subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary h-12 px-6 text-base">
              {t('landing.ctaStart')} <ArrowRight size={18} />
            </Link>
            <Link to="/map" className="btn-secondary h-12 px-6 text-base">
              {t('landing.ctaGuest')}
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              ['100', t('landing.statLessons')],
              ['104', t('landing.statChallenges')],
              ['3', t('landing.statLangs')],
            ].map(([n, l]) => (
              <div key={l} className="flex flex-col">
                <dt className="text-sm text-muted">{l}</dt>
                <dd className="order-first text-3xl font-black text-fg">{n}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div className="relative" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/30 to-secondary/20 blur-3xl" aria-hidden="true" />
          <div className="card overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border bg-card-2 px-4 py-3" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-3 font-mono text-xs text-muted">App.jsx</span>
            </div>
            <pre className="hljs-block m-0 rounded-none border-0 text-[13px] sm:text-sm">
              <code>{SNIPPET}</code>
            </pre>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
              <span className="flex items-center gap-2 text-sm font-semibold text-success">
                <CheckCircle2 size={18} /> 3/3 ✓
              </span>
              <motion.span className="chip border-secondary/40 text-secondary" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                +50 XP ⚡
              </motion.span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Dunyolar */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-labelledby="worlds-title">
        <h2 id="worlds-title" className="text-3xl font-black tracking-tight">
          {t('landing.worldsTitle')}
        </h2>
        <p className="mt-2 text-muted">{t('landing.worldsSubtitle')}</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORLDS.map((w, i) => (
            <motion.li key={w.icon} className="card relative overflow-hidden p-5" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-2xl" style={{ background: w.color }} aria-hidden="true" />
              <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${w.color}22`, color: w.color }}>
                <CourseIcon icon={w.icon} />
              </span>
              <h3 className="mt-4 text-lg font-bold">{w.title[li]}</h3>
              {'soon' in w && w.soon && <span className="chip mt-2">{t('map.comingSoon')}</span>}
            </motion.li>
          ))}
        </ul>
      </section>

      {/* Xususiyatlar */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-labelledby="features-title">
        <h2 id="features-title" className="text-3xl font-black tracking-tight">
          {t('landing.featuresTitle')}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.t} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <f.icon size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{t(f.t)}</h3>
              <p className="mt-2 text-muted">{t(f.d)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Qanday ishlaydi */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-labelledby="how-title">
        <h2 id="how-title" className="text-3xl font-black tracking-tight">
          {t('landing.howTitle')}
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {(['1', '2', '3'] as const).map((n) => (
            <li key={n} className="card flex gap-4 p-6">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary font-black text-white">{n}</span>
              <div>
                <h3 className="font-bold">{t(`landing.step${n}t` as TKey)}</h3>
                <p className="mt-1 text-muted">{t(`landing.step${n}d` as TKey)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Yakuniy CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">
        <div className="card relative overflow-hidden p-8 text-center sm:p-12">
          <div className="absolute inset-0 -z-0 bg-gradient-to-br from-primary/20 to-secondary/10" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-3xl font-black tracking-tight">{t('landing.finalTitle')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">{t('landing.finalText')}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="btn-primary h-12 px-6">
                {t('landing.ctaStart')}
              </Link>
              <Link to="/login" className="btn-secondary h-12 px-6">
                {t('landing.ctaLogin')}
              </Link>
            </div>
          </div>
        </div>
        <footer className="mt-10 text-center text-sm text-muted">© {new Date().getFullYear()} CODEVERSE</footer>
      </section>
    </div>
  );
}
