import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { AuthCard, FormError } from './AuthCard';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { errorMessage } from '../../lib/api';
import { Spinner } from '../../components/ui';

export default function Login() {
  const { t } = useSettings();
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ login: '', password: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = params.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(form.login.trim(), form.password);
      nav(safeNext, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-primary">
            {t('common.register')}
          </Link>
          {import.meta.env.DEV && <p className="mt-3 text-xs">{t('auth.demoHint')}</p>}
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label className="label" htmlFor="login">
            {t('auth.loginOrEmail')}
          </label>
          <input id="login" className="input" autoComplete="username" required value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">
              {t('auth.password')}
            </label>
            <Link to="/forgot-password" className="mb-1.5 text-xs font-semibold text-primary">
              {t('auth.forgot')}
            </Link>
          </div>
          <div className="relative">
            <input id="password" className="input pr-11" type={show ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted" onClick={() => setShow((s) => !s)} aria-label={t('auth.showPassword')} aria-pressed={show}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <FormError message={error} />
        <button type="submit" className="btn-primary w-full" disabled={busy || !form.login || !form.password}>
          {busy ? <Spinner className="h-4 w-4" /> : <LogIn size={18} />} {t('common.login')}
        </button>
      </form>
    </AuthCard>
  );
}
