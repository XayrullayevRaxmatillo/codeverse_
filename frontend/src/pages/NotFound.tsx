import { Link } from 'react-router-dom';
import { Orbit } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  const { t } = useSettings();
  return (
    <div className="card mx-auto max-w-xl">
      <h1 className="sr-only">{t('common.notFoundTitle')}</h1>
      <EmptyState icon={Orbit} title={`404 · ${t('common.notFoundTitle')}`} text={t('common.notFoundText')} action={<Link to="/map" className="btn-primary">{t('nav.map')}</Link>} />
    </div>
  );
}
