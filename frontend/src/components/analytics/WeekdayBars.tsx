// src/components/analytics/WeekdayBars.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Day-of-week consistency. Computed client-side from the global heatmap:
// "Which weekdays do I actually show up on?"
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getDay, parseISO } from 'date-fns';
import type { HeatmapDay } from '../../types';
import { DURATION, EASE } from '../../lib/motion';

interface WeekdayBarsProps {
  data: HeatmapDay[];
}

const LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeekdayBars({ data }: WeekdayBarsProps) {
  const { values, max, bestIdx, worstIdx } = useMemo(() => {
    const sums = [0, 0, 0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    data.forEach((d) => {
      const w = getDay(parseISO(d.date));
      sums[w] += d.done_count;
      counts[w] += 1;
    });

    const values = sums.map((s, i) => (counts[i] > 0 ? s / counts[i] : 0));
    const max = Math.max(...values, 0.0001);

    let bestIdx = -1;
    let worstIdx = -1;
    let bestVal = -1;
    let worstVal = Infinity;

    values.forEach((v, i) => {
      // Only consider days that appear in the data window.
      if (counts[i] === 0) return;
      if (v > bestVal) {
        bestVal = v;
        bestIdx = i;
      }
      if (v < worstVal) {
        worstVal = v;
        worstIdx = i;
      }
    });

    return { values, max, bestIdx, worstIdx };
  }, [data]);

  // Reorder Mon → Sun for display (more intuitive for a habit tracker).
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="flex flex-col gap-3" aria-label="Consistency by day of week">
      <div className="flex items-end gap-2 sm:gap-3 h-32">
        {displayOrder.map((idx) => {
          const v = values[idx];
          const ratio = v / max;
          const isBest = idx === bestIdx;
          const isWorst = idx === worstIdx && bestIdx !== worstIdx;
          const fill = isBest ? '#3fb950' : isWorst ? '#d29922' : '#388bfd';
          const heightPct = Math.max(4, ratio * 100);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div className="w-full h-full flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: DURATION.slow, ease: EASE.decel }}
                  className="w-full rounded-t-[3px] origin-bottom"
                  style={{
                    backgroundColor: fill,
                    boxShadow: isBest ? `0 0 8px ${fill}40` : undefined,
                  }}
                  title={`${LABELS[idx]}: avg ${v.toFixed(1)} per day`}
                />
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider ${
                  isBest
                    ? 'text-[#3fb950] font-semibold'
                    : isWorst
                      ? 'text-[#d29922] font-semibold'
                      : 'text-[#6e7681]'
                }`}
              >
                {LABELS[idx].slice(0, 1)}
              </span>
            </div>
          );
        })}
      </div>

      {bestIdx >= 0 && worstIdx >= 0 && bestIdx !== worstIdx && (
        <p className="text-[11px] text-[#8b949e] leading-relaxed">
          You're most consistent on{' '}
          <span className="text-[#3fb950] font-semibold">{LABELS[bestIdx]}</span> and tend to slip on{' '}
          <span className="text-[#d29922] font-semibold">{LABELS[worstIdx]}</span>.
        </p>
      )}
    </div>
  );
}
