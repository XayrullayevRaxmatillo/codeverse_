import { Bot } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { PageHeader } from '../components/ui';
import { MentorChat } from '../components/MentorChat';

export default function Mentor() {
  const { t } = useSettings();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t('mentor.title')} subtitle={t('mentor.subtitle')} icon={Bot} />
      <div className="card p-4 sm:p-6">
        <MentorChat />
      </div>
    </div>
  );
}
