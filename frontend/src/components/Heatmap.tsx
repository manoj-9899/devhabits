// src/components/Heatmap.tsx
// ─────────────────────────────────────────────────────────────────────────────
// GitHub-style contribution heatmap.
// Renders 52 weeks × 7 days = 364 cells in a grid.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import { format, eachDayOfInterval, subDays, getDay } from 'date-fns';
import type { HeatmapDay } from '../types';

interface HeatmapProps {
  data: HeatmapDay[];
  days?: number;
}

const INTENSITY_COLORS = [
  '#161b22', // 0 – empty
  '#0e4429', // 1
  '#006d32', // 2
  '#26a641', // 3
  '#39d353', // 4
];

function getIntensity(doneCount: number, maxCount: number): number {
  if (doneCount === 0 || maxCount === 0) return 0;
  const ratio = doneCount / maxCount;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

const WEEK_DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function Heatmap({ data, days = 365 }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const { weeks, monthLabels, maxCount } = useMemo(() => {
    const today = new Date();
    const start = subDays(today, days - 1);
    const allDays = eachDayOfInterval({ start, end: today });

    // Build lookup map: dateStr → HeatmapDay
    const dataMap = new Map(data.map((d) => [d.date, d]));

    const maxCount = Math.max(...data.map((d) => d.done_count), 1);

    // Pad the start so week[0] starts on Sunday
    const firstDayOfWeek = getDay(start); // 0=Sun
    const paddedDays: (Date | null)[] = [...Array(firstDayOfWeek).fill(null), ...allDays];

    // Split into weeks (chunks of 7)
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < paddedDays.length; i += 7) {
      weeks.push(paddedDays.slice(i, i + 7));
    }

    // Month label positions
    const monthLabels: { month: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstReal = week.find(Boolean) as Date | undefined;
      if (firstReal) {
        const m = firstReal.getMonth();
        if (m !== lastMonth) {
          monthLabels.push({ month: MONTHS[m], col: wi });
          lastMonth = m;
        }
      }
    });

    return { weeks, monthLabels, maxCount, dataMap };
  }, [data, days]);

  // Pull dataMap from memo above but we need it in scope:
  const dataMap = useMemo(() => new Map(data.map((d) => [d.date, d])), [data]);

  const cellSize = 13;
  const gap = 2;

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="relative h-5 mb-1 ml-8">
        {monthLabels.map(({ month, col }) => (
          <span
            key={`${month}-${col}`}
            className="absolute text-[11px] text-[#8b949e]"
            style={{ left: col * (cellSize + gap) }}
          >
            {month}
          </span>
        ))}
      </div>

      <div className="flex gap-1.5">
        {/* Day-of-week labels */}
        <div className="flex flex-col" style={{ gap: gap }}>
          {WEEK_DAYS.map((label, i) => (
            <div
              key={i}
              className="text-[11px] text-[#8b949e] leading-none flex items-center"
              style={{ height: cellSize }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex overflow-x-auto pb-2" style={{ gap }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap }}>
              {week.map((day, di) => {
                if (!day) {
                  return <div key={di} style={{ width: cellSize, height: cellSize }} />;
                }

                const dateStr = format(day, 'yyyy-MM-dd');
                const dayData = dataMap.get(dateStr);
                const intensity = getIntensity(dayData?.done_count ?? 0, maxCount);

                return (
                  <div
                    key={di}
                    className="heatmap-cell rounded-[2px] cursor-pointer"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: INTENSITY_COLORS[intensity],
                    }}
                    onMouseEnter={(e) => {
                      const label = dayData
                        ? `${dayData.done_count} done · ${format(day, 'MMM d, yyyy')}`
                        : `Start today · ${format(day, 'MMM d, yyyy')}`;
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({ text: label, x: rect.left + rect.width / 2, y: rect.top - 8 });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-xs text-[#8b949e]">Less</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div
            key={i}
            className="rounded-[2px]"
            style={{ width: 10, height: 10, backgroundColor: color, border: '1px solid #30363d' }}
          />
        ))}
        <span className="text-xs text-[#8b949e]">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2 py-1 rounded text-xs text-[#e6edf3] bg-[#1c2128] border border-[#30363d] pointer-events-none whitespace-nowrap shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
