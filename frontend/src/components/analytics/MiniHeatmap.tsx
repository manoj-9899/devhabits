// src/components/analytics/MiniHeatmap.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Compact per-habit heatmap strip. ~7 rows × N columns, tinted to the habit's
// own color so each habit reads as a distinct "fingerprint" instead of the
// monochrome global heatmap.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo } from 'react';
import { eachDayOfInterval, format, getDay, subDays } from 'date-fns';

interface MiniHeatmapProps {
  /** Habit color — used as the high-intensity end of the gradient. */
  color: string;
  /** Sparse per-day done counts for this habit, keyed by yyyy-MM-dd. */
  data: Map<string, number>;
  /** Number of days to render (default 90). */
  days?: number;
  /** Cell side length in px. */
  cellSize?: number;
  /** Cell gap in px. */
  gap?: number;
  /** Optional label e.g. for screen readers. */
  ariaLabel?: string;
}

export function MiniHeatmap({
  color,
  data,
  days = 90,
  cellSize = 9,
  gap = 2,
  ariaLabel,
}: MiniHeatmapProps) {
  const { weeks, max } = useMemo(() => {
    const today = new Date();
    const start = subDays(today, days - 1);
    const allDays = eachDayOfInterval({ start, end: today });

    // Pad so column 0 starts on Sunday.
    const padCount = getDay(start);
    const padded: (Date | null)[] = [...Array(padCount).fill(null), ...allDays];

    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

    let max = 1;
    data.forEach((v) => {
      if (v > max) max = v;
    });

    return { weeks, max };
  }, [data, days]);

  const totalDone = useMemo(() => {
    let n = 0;
    data.forEach((v) => (n += v));
    return n;
  }, [data]);

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `Activity over the last ${days} days — ${totalDone} completions.`}
      className="inline-flex"
      style={{ gap }}
    >
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col" style={{ gap }}>
          {week.map((day, di) => {
            if (!day) return <div key={di} style={{ width: cellSize, height: cellSize }} />;
            const key = format(day, 'yyyy-MM-dd');
            const count = data.get(key) ?? 0;
            const intensity = count === 0 ? 0 : Math.min(1, count / max);
            const fill = count === 0 ? '#161b22' : tint(color, intensity);
            return (
              <div
                key={di}
                className="rounded-[2px]"
                style={{ width: cellSize, height: cellSize, backgroundColor: fill }}
                title={`${count} on ${format(day, 'MMM d')}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Returns the habit color blended toward dark canvas at low intensity.
// Keeps the visual "tinted" rather than punching a saturated dot for every cell.
function tint(hex: string, intensity: number): string {
  const { r, g, b } = hexToRgb(hex);
  // Floor at ~20 % opacity equivalent so even a single completion is visible.
  const t = 0.2 + intensity * 0.8;
  const bg = { r: 22, g: 27, b: 34 }; // matches #161b22
  const blend = (c: number, b: number) => Math.round(b + (c - b) * t);
  return `rgb(${blend(r, bg.r)}, ${blend(g, bg.g)}, ${blend(b, bg.b)})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { r: 88, g: 166, b: 255 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
