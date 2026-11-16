import { Link } from 'react-router-dom';
import { Download, ExternalLink, GraduationCap } from 'lucide-react';
import { useCertificates } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from '../components/ui';
import { apiUrl } from '../lib/api';
import { fmtDate } from '../lib/utils';

export default function Certificates() {
  const { t, tx, lang } = useSettings();
  const q = useCertificates();
  if (q.isLoading) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const list = q.data ?? [];
  return (
    <div>
      <PageHeader title={t('certificates.title')} subtitle={t('certificates.subtitle')} icon={GraduationCap} />
      {list.length === 0 ? (
        <EmptyState icon={GraduationCap} title={t('common.empty')} text={t('certificates.empty')} action={<Link to="/map" className="btn-primary">{t('dashboard.openMap')}</Link>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((c) => (
            <li key={c.code} className="card relative overflow-hidden p-6">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-2xl" style={{ background: c.color ?? 'var(--cv-primary)' }} aria-hidden="true" />
              <GraduationCap className="text-primary" size={32} />
              <h2 className="mt-3 text-xl font-extrabold">{tx(c.courseTitle)}</h2>
              <p className="text-sm text-muted">
                {c.name} · {fmtDate(c.issuedAt, lang)}
              </p>
              <p className="mt-2 font-mono text-sm">{c.code}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a className="btn-primary btn-sm" href={apiUrl(`/certificates/${c.code}/pdf?lang=${lang}`)} target="_blank" rel="noopener noreferrer">
                  <Download size={15} /> {t('certificates.download')}
                </a>
                <Link className="btn-secondary btn-sm" to={`/verify/${c.code}`}>
                  <ExternalLink size={15} /> {t('certificates.verify')}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
