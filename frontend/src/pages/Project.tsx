import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { saveProjectCode, submitChallenge, useChallenge, useInvalidateProgress } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { useReward } from '../context/RewardContext';
import { EmptyState, ErrorState, PageSkeleton } from '../components/ui';
import { ChallengePanel } from '../components/editor/ChallengePanel';
import type { CodeFiles } from '../types';

export default function Project() {
  const { id } = useParams();
  const { t, tx } = useSettings();
  const { celebrate } = useReward();
  const invalidate = useInvalidateProgress();
  const q = useChallenge(id);
  const autosave = useCallback((code: CodeFiles) => {
    if (id) saveProjectCode(id, code).catch(() => undefined);
  }, [id]);
  if (q.isLoading) return <PageSkeleton />;
  if (q.isError || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const p = q.data;

  async function onSolved(code: CodeFiles) {
    const r = await submitChallenge(p.id, code);
    celebrate(r.reward);
    invalidate();
    return { explanation: r.explanation };
  }

  return (
    <div className="space-y-4">
      <Link to={p.course ? `/course/${p.course.slug}` : '/projects'} className="inline-flex items-center gap-1 text-sm font-semibold text-muted no-underline hover:text-fg">
        <ArrowLeft size={16} /> {p.course ? tx(p.course.title) : t('projects.title')}
      </Link>
      {p.status === 'locked' ? (
        <EmptyState icon={Lock} title={tx(p.title)} text={t('projects.locked')} />
      ) : (
        <>
          <h1 className="text-3xl font-black">{tx(p.title)}</h1>
          <ChallengePanel challenge={p} initialCode={p.savedCode} solvedBefore={p.status === 'completed'} onSolved={onSolved} onAutosave={autosave} heading={t('projects.requirements')} />
        </>
      )}
    </div>
  );
}
