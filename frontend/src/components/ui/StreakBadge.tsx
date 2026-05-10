// src/components/ui/StreakBadge.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Compact streak indicator with at-risk amber state. Reused on HabitCard,
// Habits row hover, and (future) habit-detail page.
// ─────────────────────────────────────────────────────────────────────────────
import clsx from 'clsx';

interface StreakBadgeProps {
  days: number;
  /** When true, renders amber pulsing variant (streak ends today if not logged). */
  atRisk?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StreakBadge({ days, atRisk, size = 'sm', className }: StreakBadgeProps) {
  if (days <= 0) return null;

  const sizing =
    size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-0.5 gap-1.5';

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-mono font-semibold leading-none border',
        sizing,
        atRisk
          ? 'bg-[#3d2e0d] text-[#d29922] border-[#d29922]/40 animate-pulse'
          : 'bg-[#1a4a2e]/40 text-[#3fb950] border-[#238636]/40',
        className
      )}
      aria-label={
        atRisk
          ? `${days} day streak — at risk, log today to continue`
          : `${days} day streak`
      }
    >
      <FlameIcon size={size === 'sm' ? 9 : 11} />
      {days}d
    </span>
  );
}

function FlameIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2c0 0-1 4-3 6s-4 4-4 8 3 6 7 6 7-3 7-7c0-3-2-5-3-7-1 1-2 2-3 2 1-3-1-7-1-8z" />
    </svg>
  );
}
