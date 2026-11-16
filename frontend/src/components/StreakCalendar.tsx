import { useSettings } from '../context/SettingsContext';
import { cn, dayKey } from '../lib/utils';

/** Oxirgi N hafta faollik taqvimi (GitHub uslubida) */
export function StreakCalendar({ days, weeks = 12 }: { days: string[]; weeks?: number }) {
  const { lang } = useSettings();
  const set = new Set(days);
  const today = new Date();
  const cells: { key: string; active: boolean; future: boolean }[] = [];
  // Joriy haftaning yakshanbasigacha to'ldiramiz (dushanbadan boshlanadigan ustunlar)
  const dow = (today.getUTCDay() + 6) % 7; // 0 = dushanba
  const total = weeks * 7;
  for (let i = total - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - (i - (6 - dow)) * 86_400_000);
    const key = dayKey(d);
    cells.push({ key, active: set.has(key), future: d.getTime() > today.getTime() + 3_600_000 });
  }
  const fmt = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : 'uz-UZ', { day: 'numeric', month: 'short' });
  return (
    <div className="overflow-x-auto">
      <div className="grid w-max grid-flow-col grid-rows-7 gap-1" role="img" aria-label={`${set.size}`}>
        {cells.map((c) => (
          <span
            key={c.key}
            title={`${fmt.format(new Date(c.key))}${c.active ? ' ✓' : ''}`}
            className={cn('h-3.5 w-3.5 rounded-[4px]', c.future ? 'bg-transparent' : c.active ? 'bg-gradient-to-br from-orange-400 to-rose-500 shadow-[0_0_6px_rgba(249,115,22,.5)]' : 'bg-card-2')}
          />
        ))}
      </div>
    </div>
  );
}
