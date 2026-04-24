// src/components/ui/Badge.tsx
import clsx from 'clsx';
import type { LogState } from '../../types';

const STATE_STYLES: Record<LogState, string> = {
  DONE: 'bg-[#1a4a2e] text-[#3fb950] border border-[#238636]/50',
  SKIPPED: 'bg-[#1c2d4a] text-[#58a6ff] border border-[#388bfd]/50',
  MISSED: 'bg-[#3d1c1c] text-[#f85149] border border-[#da3633]/50',
  PENDING: 'bg-[#161b22] text-[#8b949e] border border-[#30363d]',
};

const STATE_LABELS: Record<LogState, string> = {
  DONE: '✓ Done',
  SKIPPED: '⟶ Skip',
  MISSED: '✗ Miss',
  PENDING: '· Pending',
};

interface BadgeProps {
  state: LogState;
  className?: string;
}

export function StateBadge({ state, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-medium leading-none',
        STATE_STYLES[state],
        className
      )}
    >
      {STATE_LABELS[state]}
    </span>
  );
}

interface CategoryBadgeProps {
  category: string;
  color: string;
}

export function CategoryBadge({ category, color }: CategoryBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium leading-none"
      style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {category}
    </span>
  );
}
