// src/components/ui/WeekdayPicker.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Multi-select day-of-week picker. Used by AddHabitModal for `target_days`
// (e.g. ["Mon","Wed","Fri"] for a Mon/Wed/Fri WEEKLY habit).
// ─────────────────────────────────────────────────────────────────────────────
import clsx from 'clsx';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Weekday = (typeof ALL_DAYS)[number];

interface WeekdayPickerProps {
  label?: string;
  value: Weekday[];
  onChange: (next: Weekday[]) => void;
  hint?: string;
  className?: string;
}

export function WeekdayPicker({ label, value, onChange, hint, className }: WeekdayPickerProps) {
  const toggle = (day: Weekday) => {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day]);
  };

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-xs font-medium text-[#8b949e] uppercase tracking-wider">{label}</span>
      )}
      <div role="group" aria-label={label ?? 'Days of the week'} className="flex gap-1.5 flex-wrap">
        {ALL_DAYS.map((day) => {
          const active = value.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              aria-pressed={active}
              className={clsx(
                'h-9 w-10 rounded-md text-xs font-mono font-semibold transition-colors duration-150 cursor-pointer border',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40',
                active
                  ? 'bg-[#1c2d4a] text-[#58a6ff] border-[#388bfd]/50'
                  : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-[#e6edf3] hover:border-[#484f58]'
              )}
            >
              {day.slice(0, 1)}
              <span className="sr-only">{day}</span>
            </button>
          );
        })}
      </div>
      {hint && <span className="text-[11px] text-[#6e7681]">{hint}</span>}
    </div>
  );
}
