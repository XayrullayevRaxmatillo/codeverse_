import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCard, FormError } from './AuthCard';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage, post } from '../../lib/api';
import type { User } from '../../types';
import { Spinner } from '../../components/ui';

export default function ResetPassword() {
  const { t } = useSettings();
  const { setUser } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(token.length === 64 ? null : t('auth.tokenMissing'));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await post<{ user: User }>('/auth/reset-password', { token, password });
      setUser(r.user);
      toast.success(t('auth.resetDone'));
      nav('/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title={t('auth.resetTitle')} footer={<Link to="/forgot-password" className="font-semibold text-primary">{t('auth.forgotTitle')}</Link>}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="label" htmlFor="password">
            {t('auth.newPassword')}
          </label>
          <input id="password" className="input" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="pw-hint" />
          <p id="pw-hint" className="mt-1 text-xs text-muted">
            {t('auth.passwordHint')}
          </p>
        </div>
        <FormError message={error} />
        <button type="submit" className="btn-primary w-full" disabled={busy || token.length !== 64 || password.length < 8}>
          {busy && <Spinner className="h-4 w-4" />} {t('common.save')}
        </button>
      </form>
    </AuthCard>
  );
}
