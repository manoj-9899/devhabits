// src/components/dashboard/TodayRing.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Focal "today's progress" ring for the Dashboard. Replaces the 4-card metric
// strip's redundant pct/done/pending values with a single hero element.
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { Card } from '../ui/Card';
import { DURATION, EASE } from '../../lib/motion';

interface TodayRingProps {
  done: number;
  total: number;
  className?: string;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TodayRing({ done, total, className }: TodayRingProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const offset = CIRCUMFERENCE * (1 - pct / 100);

  const ringColor = pct >= 80 ? '#3fb950' : pct >= 50 ? '#d29922' : pct > 0 ? '#58a6ff' : '#30363d';
  const status =
    pct === 100
      ? "Today's done. Rest well."
      : pct >= 80
        ? 'Almost there — finish strong.'
        : pct >= 50
          ? 'Halfway. Keep momentum.'
          : pct > 0
            ? 'Started. One more.'
            : total > 0
              ? 'Nothing logged yet.'
              : 'No habits to track today.';

  return (
    <Card padding="lg" className={clsx('flex items-center gap-5 sm:gap-6', className)}>
      {/* SVG ring */}
      <div className="relative shrink-0" style={{ width: 128, height: 128 }}>
        <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true">
          {/* Track */}
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            stroke="#21262d"
            strokeWidth="10"
          />
          {/* Progress */}
          <motion.circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: DURATION.slow * 2, ease: EASE.decel }}
            transform="rotate(-90 64 64)"
            style={{ filter: pct > 0 ? `drop-shadow(0 0 6px ${ringColor}60)` : undefined }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatedNumber
            value={pct}
            format={(n) => `${Math.round(n)}%`}
            className="text-[28px] font-bold font-mono leading-none text-[#e6edf3]"
          />
          <div className="text-[10px] text-[#8b949e] uppercase tracking-widest mt-1 font-semibold">
            today
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <AnimatedNumber
            value={done}
            className="text-[32px] font-bold font-mono leading-none text-[#e6edf3]"
          />
          <span className="text-sm text-[#8b949e] font-medium">/ {total}</span>
          <span className="text-xs text-[#6e7681] uppercase tracking-wider font-semibold ml-1">
            done
          </span>
        </div>
        <p className="text-sm text-[#8b949e] mt-2 leading-relaxed">{status}</p>
      </div>
    </Card>
  );
}
