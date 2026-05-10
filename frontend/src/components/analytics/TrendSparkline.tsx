// src/components/analytics/TrendSparkline.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Weekly completion trend — completions per week as an SVG line + area.
// Derived client-side from the global heatmap (no extra API call).
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { differenceInCalendarWeeks, parseISO, startOfWeek, format } from 'date-fns';
import type { HeatmapDay } from '../../types';
import { DURATION, EASE } from '../../lib/motion';

interface TrendSparklineProps {
  data: HeatmapDay[];
  /** Number of trailing weeks to show; default 12. */
  weeks?: number;
  height?: number;
}

export function TrendSparkline({ data, weeks = 12, height = 96 }: TrendSparklineProps) {
  const { points, total, deltaPct } = useMemo(() => {
    const buckets: number[] = Array.from({ length: weeks }, () => 0);
    if (data.length === 0) {
      return { points: [] as { x: number; y: number; v: number; weekStart: Date }[], total: 0, deltaPct: 0 };
    }

    const today = new Date();
    const refMonday = startOfWeek(today, { weekStartsOn: 1 });

    data.forEach((d) => {
      const date = parseISO(d.date);
      const wk = differenceInCalendarWeeks(refMonday, startOfWeek(date, { weekStartsOn: 1 }), {
        weekStartsOn: 1,
      });
      const idx = weeks - 1 - wk; // newest at right
      if (idx >= 0 && idx < weeks) buckets[idx] += d.done_count;
    });

    const max = Math.max(...buckets, 1);

    const points = buckets.map((v, i) => ({
      x: weeks === 1 ? 0 : i / (weeks - 1),
      y: 1 - v / max,
      v,
      weekStart: startOfWeek(
        new Date(refMonday.getTime() - (weeks - 1 - i) * 7 * 24 * 60 * 60 * 1000),
        { weekStartsOn: 1 }
      ),
    }));

    const total = buckets.reduce((s, v) => s + v, 0);

    // Compare the last 4 weeks to the previous 4 to derive a trend %.
    const half = Math.floor(buckets.length / 2);
    const recent = buckets.slice(-half).reduce((s, v) => s + v, 0);
    const prior = buckets.slice(0, half).reduce((s, v) => s + v, 0);
    const deltaPct = prior === 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - prior) / prior) * 100);

    return { points, total, deltaPct };
  }, [data, weeks]);

  const W = 240;
  const H = height;
  const PAD_X = 4;
  const PAD_Y = 6;

  const toX = (n: number) => PAD_X + n * (W - 2 * PAD_X);
  const toY = (n: number) => PAD_Y + n * (H - 2 * PAD_Y);

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x).toFixed(1)} ${toY(p.y).toFixed(1)}`)
    .join(' ');

  const areaPath =
    points.length > 0
      ? `${linePath} L ${toX(points[points.length - 1].x).toFixed(1)} ${(H - PAD_Y).toFixed(1)} L ${toX(points[0].x).toFixed(1)} ${(H - PAD_Y).toFixed(1)} Z`
      : '';

  const trendColor = deltaPct >= 5 ? '#3fb950' : deltaPct <= -5 ? '#f85149' : '#8b949e';
  const trendLabel = deltaPct === 0 ? 'flat' : `${deltaPct > 0 ? '+' : ''}${deltaPct}%`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold font-mono text-[#e6edf3]">{total}</div>
        <span className="text-[11px] font-mono" style={{ color: trendColor }}>
          {trendLabel} vs prior
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Weekly completion trend: ${total} total, ${trendLabel} vs prior period.`}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#388bfd" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#388bfd" stopOpacity="0" />
          </linearGradient>
        </defs>

        {points.length > 1 && (
          <>
            <motion.path
              d={areaPath}
              fill="url(#trendFill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: DURATION.slow, ease: EASE.decel }}
            />
            <motion.path
              d={linePath}
              fill="none"
              stroke="#58a6ff"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: DURATION.slow * 1.4, ease: EASE.decel }}
            />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={toX(p.x)}
                cy={toY(p.y)}
                r={i === points.length - 1 ? 2.5 : 1}
                fill={i === points.length - 1 ? '#58a6ff' : '#388bfd'}
              >
                <title>
                  {format(p.weekStart, 'MMM d')} — {p.v} completion{p.v === 1 ? '' : 's'}
                </title>
              </circle>
            ))}
          </>
        )}

        {points.length === 0 && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="10" fill="#6e7681">
            No data yet
          </text>
        )}
      </svg>
      <div className="flex justify-between text-[10px] text-[#6e7681] font-mono">
        <span>{weeks}w ago</span>
        <span>now</span>
      </div>
    </div>
  );
}
