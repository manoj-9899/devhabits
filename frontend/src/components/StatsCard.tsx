// src/components/StatsCard.tsx
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Card } from './ui/Card';
import { AnimatedNumber } from './ui/AnimatedNumber';

interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  accent?: string; // hex color
  trend?: 'up' | 'down' | 'neutral';
  mono?: boolean;
  /** Disable the count-up animation (e.g. when value is a name string). */
  staticValue?: boolean;
  className?: string;
}

export function StatsCard({
  label,
  value,
  sub,
  icon,
  accent,
  mono,
  staticValue,
  className,
}: StatsCardProps) {
  const numeric = typeof value === 'number';
  const numericFromPct =
    typeof value === 'string' && /^\d+%$/.test(value) ? parseInt(value, 10) : null;

  const showAnimated = !staticValue && (numeric || numericFromPct !== null);
  const animValue = numeric ? value : (numericFromPct ?? 0);
  const formatter =
    numericFromPct !== null
      ? (n: number) => `${Math.round(n)}%`
      : (n: number) => Math.round(n).toString();

  return (
    <Card
      padding="lg"
      className={clsx(
        'flex flex-col gap-3 min-w-0 hover:border-[#484f58] hover:bg-[#161b22]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-[#8b949e] font-semibold uppercase tracking-widest">
          {label}
        </span>
        {icon && (
          <span className="text-[#8b949e]" style={accent ? { color: accent } : undefined}>
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 min-w-0">
        <span
          className={clsx(
            'text-[32px] font-bold leading-none tracking-tight truncate',
            mono && 'font-mono tracking-normal',
            !accent && 'text-[#e6edf3]'
          )}
          style={accent ? { color: accent } : undefined}
        >
          {showAnimated ? (
            <AnimatedNumber value={animValue} format={formatter} />
          ) : (
            value
          )}
        </span>
        {sub && <span className="text-[13px] text-[#8b949e] font-medium">{sub}</span>}
      </div>
    </Card>
  );
}

interface StreakCardProps {
  current: number;
  best: number;
  name: string;
  color: string;
}

export function StreakCard({ current, best, name, color }: StreakCardProps) {
  const pct = best > 0 ? Math.round((current / best) * 100) : 0;

  return (
    <Card
      padding="lg"
      className="min-w-0 hover:border-[#484f58] hover:bg-[#161b22]"
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
            aria-hidden="true"
          />
          <span className="text-[15px] font-semibold text-[#e6edf3] truncate tracking-tight">
            {name}
          </span>
        </div>
        <span className="text-xs text-[#8b949e] font-mono shrink-0">{pct}%</span>
      </div>

      <div className="flex items-center gap-5 mb-4">
        <div>
          <AnimatedNumber
            value={current}
            className="text-[28px] font-bold font-mono leading-none block"
          />
          <div className="text-[11px] text-[#8b949e] uppercase tracking-wider mt-1 font-semibold">
            current
          </div>
        </div>
        <div className="text-[#30363d] text-2xl font-light" aria-hidden="true">
          /
        </div>
        <div>
          <AnimatedNumber
            value={best}
            className="text-[28px] font-bold font-mono text-[#e6edf3] leading-none block"
          />
          <div className="text-[11px] text-[#8b949e] uppercase tracking-wider mt-1 font-semibold">
            best
          </div>
        </div>
      </div>

      <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </Card>
  );
}
