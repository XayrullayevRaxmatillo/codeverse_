import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { AuthCard, FormError } from './AuthCard';
import { useSettings } from '../../context/SettingsContext';
import { errorMessage, post } from '../../lib/api';
import { Spinner } from '../../components/ui';

export default function ForgotPassword() {
  const { t } = useSettings();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title={t('auth.forgotTitle')} subtitle={t('auth.forgotText')} footer={<Link to="/login" className="font-semibold text-primary">{t('common.back')}</Link>}>
      {sent ? (
        <p className="flex items-start gap-3 rounded-xl bg-success/10 p-4 text-success" role="status">
          <MailCheck className="shrink-0" /> {t('auth.linkSent')}
        </p>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="label" htmlFor="email">
              {t('auth.email')}
            </label>
            <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <FormError message={error} />
          <button type="submit" className="btn-primary w-full" disabled={busy || !email}>
            {busy && <Spinner className="h-4 w-4" />} {t('auth.sendLink')}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
