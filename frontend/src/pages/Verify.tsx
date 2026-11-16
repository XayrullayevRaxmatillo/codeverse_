import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, Download, SearchX, ShieldCheck } from 'lucide-react';
import { verifyCertificate } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { PageHeader, Spinner } from '../components/ui';
import { apiUrl } from '../lib/api';
import { fmtDate } from '../lib/utils';
import type { CertificateInfo } from '../types';

export default function Verify() {
  const { code } = useParams();
  const { t, tx, lang } = useSettings();
  const nav = useNavigate();
  const [input, setInput] = useState(code ?? '');
  const [state, setState] = useState<{ loading: boolean; cert: CertificateInfo | null; notFound: boolean }>({ loading: !!code, cert: null, notFound: false });

  useEffect(() => {
    if (!code) return;
    let alive = true;
    setState({ loading: true, cert: null, notFound: false });
    verifyCertificate(code)
      .then((c) => alive && setState({ loading: false, cert: c, notFound: false }))
      .catch(() => alive && setState({ loading: false, cert: null, notFound: true }));
    return () => {
      alive = false;
    };
  }, [code]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) nav(`/verify/${encodeURIComponent(input.trim().toUpperCase())}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('certificates.verifyTitle')} icon={ShieldCheck} />
      <form onSubmit={onSubmit} className="card mb-6 flex gap-2 p-3">
        <label htmlFor="code" className="sr-only">
          {t('certificates.code')}
        </label>
        <input id="code" className="input font-mono" placeholder={t('certificates.verifyPlaceholder')} value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit" className="btn-primary">
          {t('common.check')}
        </button>
      </form>
      {state.loading && <Spinner className="mx-auto h-8 w-8 text-primary" />}
      {state.notFound && (
        <div className="card flex items-center gap-3 border-danger/50 p-6 text-danger" role="alert">
          <SearchX /> {t('certificates.invalid')}
        </div>
      )}
      {state.cert && (
        <div className="card relative overflow-hidden border-success/50 p-8" role="status">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-secondary/10" aria-hidden="true" />
          <div className="relative">
            <p className="flex items-center gap-2 font-bold text-success">
              <BadgeCheck /> {t('certificates.valid')}
            </p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted">{t('certificates.issuedTo')}</dt>
                <dd className="text-xl font-extrabold">{state.cert.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted">{t('certificates.course')}</dt>
                <dd className="text-xl font-extrabold">{tx(state.cert.courseTitle)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted">{t('certificates.issuedAt')}</dt>
                <dd className="font-semibold">{fmtDate(state.cert.issuedAt, lang)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted">{t('certificates.code')}</dt>
                <dd className="font-mono font-semibold">{state.cert.code}</dd>
              </div>
            </dl>
            <a className="btn-primary mt-6" href={apiUrl(`/certificates/${state.cert.code}/pdf?lang=${lang}`)} target="_blank" rel="noopener noreferrer">
              <Download size={16} /> {t('certificates.download')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
