import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { AuthCard, FormError } from './AuthCard';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../lib/api';
import { Spinner } from '../../components/ui';

export default function Register() {
  const { t } = useSettings();
  const { register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pwOk = form.password.length >= 8 && /[A-Za-z]/.test(form.password) && /\d/.test(form.password);
  const userOk = /^[a-z0-9_]{3,24}$/.test(form.username);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pwOk) return setError(t('auth.passwordHint'));
    setBusy(true);
    setError(null);
    try {
      const { imported } = await register({ ...form, username: form.username.trim().toLowerCase(), email: form.email.trim() });
      if (imported > 0) toast.success(t('auth.guestImported', { n: imported }));
      nav('/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const field = (id: keyof typeof form, label: string, props: Record<string, string> = {}) => (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="input" required value={form[id]} onChange={(e) => setForm({ ...form, [id]: id === 'username' ? e.target.value.toLowerCase() : e.target.value })} {...props} />
    </div>
  );

  return (
    <AuthCard
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-primary">
            {t('common.login')}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        {field('displayName', t('auth.displayName'), { autoComplete: 'name', maxLength: '50' })}
        {field('username', t('auth.username'), { autoComplete: 'username', maxLength: '24', pattern: '[a-z0-9_]+' })}
        {form.username && !userOk && <p className="-mt-2 text-xs text-warning">a-z, 0-9, _ (3–24)</p>}
        {field('email', t('auth.email'), { type: 'email', autoComplete: 'email' })}
        <div>
          <label className="label" htmlFor="password">
            {t('auth.password')}
          </label>
          <input id="password" className="input" type="password" autoComplete="new-password" required aria-describedby="pw-hint" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <p id="pw-hint" className={`mt-1 text-xs ${form.password && !pwOk ? 'text-warning' : 'text-muted'}`}>
            {t('auth.passwordHint')}
          </p>
        </div>
        <FormError message={error} />
        <button type="submit" className="btn-primary w-full" disabled={busy || !userOk || !form.email || !form.displayName}>
          {busy ? <Spinner className="h-4 w-4" /> : <UserPlus size={18} />} {t('common.register')}
        </button>
      </form>
    </AuthCard>
  );
}
