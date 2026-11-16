import { useMemo } from 'react';
import { renderMarkdown } from '../lib/markdown';
import { cn } from '../lib/utils';

/** Xavfsiz markdown: DOMPurify bilan tozalangan HTML */
export function Markdown({ source, className }: { source: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(source), [source]);
  return <div className={cn('prose-cv', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
