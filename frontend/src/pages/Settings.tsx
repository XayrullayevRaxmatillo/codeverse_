import { useState, type FormEvent } from 'react';
import { KeyRound, Settings as SettingsIcon } from 'lucide-react';
import { updateMe, useUserMutation } from '../hooks/api';
import { useSettings, type ThemeMode } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, Segmented } from '../components/ui';
import { LANGS } from '../i18n';
import { errorMessage, post } from '../lib/api';
import type { Lang } from '../types';

export default function Settings() {
  const { t, lang, setLang, theme, setTheme } = useSettings();
  const toast = useToast();
  const save = useUserMutation(updateMe);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [busy, setBusy] = useState(false);

  const changeLang = (l: Lang) => {
    setLang(l);
    save.mutate({ settings: { lang: l } });
  };
  const changeTheme = (tm: ThemeMode) => {
    setTheme(tm);
    save.mutate({ settings: { theme: tm } });
  };

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await post('/auth/change-password', pw);
      toast.success(t('settings.passwordChanged'));
      setPw({ current: '', next: '' });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t('settings.title')} icon={SettingsIcon} />
      <section className="card space-y-5 p-6">
        <div>
          <p className="label">{t('settings.language')}</p>
          <Segmented label={t('settings.language')} value={lang} onChange={changeLang} options={LANGS.map((l) => ({ value: l.code, label: `${l.flag} ${l.label}` }))} />
        </div>
        <div>
          <p className="label">{t('settings.theme')}</p>
          <Segmented label={t('settings.theme')} value={theme} onChange={changeTheme} options={(['dark', 'light', 'system'] as ThemeMode[]).map((m) => ({ value: m, label: t(`settings.themes.${m}`) }))} />
        </div>
      </section>
      <section className="card p-6" aria-labelledby="pw-title">
        <h2 id="pw-title" className="mb-4 flex items-center gap-2 text-lg font-bold">
          <KeyRound size={20} /> {t('settings.changePassword')}
        </h2>
        <form className="space-y-4" onSubmit={changePassword}>
          <div>
            <label className="label" htmlFor="cur">
              {t('settings.currentPassword')}
            </label>
            <input id="cur" type="password" className="input" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="new">
              {t('settings.newPassword')}
            </label>
            <input id="new" type="password" className="input" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} aria-describedby="new-hint" />
            <p id="new-hint" className="mt-1 text-xs text-muted">
              {t('auth.passwordHint')}
            </p>
          </div>
          <button type="submit" className="btn-primary" disabled={busy || !pw.current || pw.next.length < 8}>
            {t('common.save')}
          </button>
        </form>
      </section>
    </div>
  );
}
