// src/components/StatsCard.tsx
import clsx from 'clsx';
import type { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  accent?: string; // hex color
  trend?: 'up' | 'down' | 'neutral';
  mono?: boolean;
  className?: string;
}

export function StatsCard({ label, value, sub, icon, accent, mono, className }: StatsCardProps) {
  return (
    <div
      className={clsx(
        'p-5 rounded-xl border border-[#30363d] bg-[#161b22]/80',
        'flex flex-col gap-3 min-w-0 transition-all duration-200 hover:border-[#484f58] hover:bg-[#161b22]',
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

      <div className="flex items-baseline gap-2">
        <span
          className={clsx(
            'text-[32px] font-bold leading-none tracking-tight',
            mono && 'font-mono tracking-normal',
            !accent && 'text-[#e6edf3]'
          )}
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </span>
        {sub && <span className="text-[13px] text-[#8b949e] font-medium">{sub}</span>}
      </div>
    </div>
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
    <div className="p-5 rounded-xl border border-[#30363d] bg-[#161b22]/80 min-w-0 transition-all duration-200 hover:border-[#484f58] hover:bg-[#161b22]">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
          />
          <span className="text-[15px] font-semibold text-[#e6edf3] truncate tracking-tight">
            {name}
          </span>
        </div>
        <span className="text-xs text-[#8b949e] font-mono shrink-0">{pct}%</span>
      </div>

      <div className="flex items-center gap-5 mb-4">
        <div>
          <div className="text-[28px] font-bold font-mono leading-none" style={{ color }}>
            {current}
          </div>
          <div className="text-[11px] text-[#8b949e] uppercase tracking-wider mt-1 font-semibold">
            current
          </div>
        </div>
        <div className="text-[#30363d] text-2xl font-light">/</div>
        <div>
          <div className="text-[28px] font-bold font-mono text-[#e6edf3] leading-none">{best}</div>
          <div className="text-[11px] text-[#8b949e] uppercase tracking-wider mt-1 font-semibold">
            best
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-500 shadow-sm"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
