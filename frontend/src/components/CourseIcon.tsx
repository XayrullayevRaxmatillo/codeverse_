import { Building2, Castle, Mountain, Orbit, Server, Sparkles, Trees, TreePalm, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  island: TreePalm,
  trees: Trees,
  castle: Castle,
  city: Building2,
  mountain: Mountain,
  server: Server,
  galaxy: Sparkles,
};

export function CourseIcon({ icon, size = 28, className }: { icon: string; size?: number; className?: string }) {
  const Icon = ICONS[icon] ?? Orbit;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
