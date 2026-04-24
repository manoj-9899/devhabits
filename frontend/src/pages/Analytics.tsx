// src/pages/Analytics.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Deep analytics: per-habit stats, heatmap, completion rates
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Heatmap } from '../components/Heatmap';
import { StreakCard, StatsCard } from '../components/StatsCard';
import { useHeatmap, useStats } from '../hooks/index';

type HeatmapRange = 90 | 180 | 365;

export function Analytics() {
  const [heatmapDays, setHeatmapDays] = useState<HeatmapRange>(365);
  const { data: heatmap, isLoading: heatmapLoading } = useHeatmap(heatmapDays);
  const { data: stats,   isLoading: statsLoading   } = useStats();

  const habits = stats?.habits ?? [];

  // Top-level aggregates
  const totalDone     = habits.reduce((sum, h) => sum + h.total_done, 0);
  const avgCompletion = habits.length > 0
    ? Math.round(habits.reduce((sum, h) => sum + (h.completion_pct ?? 0), 0) / habits.length)
    : 0;
  const bestStreak    = Math.max(...habits.map(h => h.best_streak), 0);
  
  // Sort habits by completion and streak
  const sortedBySuccess = [...habits].sort((a, b) => 
    ((b.completion_pct ?? 0) * 100 + b.current_streak) - ((a.completion_pct ?? 0) * 100 + a.current_streak)
  );
  const topHabit = sortedBySuccess[0];
  const worstHabit = sortedBySuccess.length > 1 ? sortedBySuccess[sortedBySuccess.length - 1] : undefined;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold text-[#e6edf3] tracking-tight">Analytics</h1>
        <p className="text-sm text-[#8b949e] mt-1">All-time consistency metrics</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatsCard label="Completions" value={totalDone} mono accent="#3fb950" />
        <StatsCard label="Average Rate" value={`${avgCompletion}%`} sub="per habit" mono
          accent={avgCompletion >= 70 ? '#3fb950' : avgCompletion >= 40 ? '#d29922' : '#da3633'}
        />
        <StatsCard label="Best Streak" value={bestStreak} sub="days" mono accent="#58a6ff" />
        <StatsCard
          label="Top Habit"
          value={topHabit?.name ?? '—'}
          sub={topHabit ? `${topHabit.completion_pct}% rate` : ''}
          accent={topHabit?.color}
        />
        <StatsCard
          label="Needs Work"
          value={worstHabit?.name ?? '—'}
          sub={worstHabit ? `${worstHabit.completion_pct}% rate` : ''}
          accent="#da3633"
        />
      </div>

      {/* Heatmap */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#e6edf3]">Activity Heatmap</h2>
          </div>
          {/* Range picker */}
          <div className="flex gap-1 p-1 bg-[#161b22] rounded-md border border-[#30363d]">
            {([90, 180, 365] as HeatmapRange[]).map(d => (
              <button
                key={d}
                onClick={() => setHeatmapDays(d)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  heatmapDays === d
                    ? 'bg-[#21262d] text-[#e6edf3]'
                    : 'text-[#8b949e] hover:text-[#e6edf3]'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 bg-[#161b22] border border-[#30363d] rounded-lg overflow-x-auto">
          {heatmapLoading ? (
            <div className="h-32 animate-pulse bg-[#21262d] rounded" />
          ) : (
            <Heatmap data={heatmap?.data ?? []} days={heatmapDays} />
          )}
        </div>
      </section>

      {/* Per-habit breakdown */}
      <section>
        <h2 className="text-sm font-semibold text-[#e6edf3] mb-4">Per-Habit Breakdown</h2>

        {statsLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-[#161b22] rounded-lg border border-[#30363d] animate-pulse" />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[#8b949e]">No habit data yet. Start logging!</p>
          </div>
        ) : (
          <>
            {/* Streak cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {habits.map(h => (
                <StreakCard
                  key={h.id}
                  name={h.name}
                  color={h.color}
                  current={h.current_streak}
                  best={h.best_streak}
                />
              ))}
            </div>

            {/* Completion table */}
            <div className="border border-[#30363d] rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] text-[11px] font-medium text-[#8b949e] uppercase tracking-wider">
                <span>Habit</span>
                <span className="text-right">Done</span>
                <span className="text-right">Eligible</span>
                <span className="text-right">Rate</span>
              </div>

              {habits.map((h, i) => (
                <div
                  key={h.id}
                  className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 items-center ${
                    i % 2 === 0 ? 'bg-[#0d1117]' : 'bg-[#0a0e13]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                    <span className="text-sm text-[#e6edf3] truncate">{h.name}</span>
                    <span className="text-xs text-[#8b949e]">· {h.category}</span>
                  </div>

                  <span className="text-sm font-mono text-[#3fb950] text-right">{h.total_done}</span>
                  <span className="text-sm font-mono text-[#8b949e] text-right">{h.total_eligible}</span>

                  <div className="flex items-center gap-2 justify-end">
                    {/* Mini bar */}
                    <div className="w-16 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${h.completion_pct ?? 0}%`,
                          backgroundColor: (h.completion_pct ?? 0) >= 70
                            ? '#238636'
                            : (h.completion_pct ?? 0) >= 40
                            ? '#d29922'
                            : '#da3633',
                        }}
                      />
                    </div>
                    <span className="text-sm font-mono text-[#e6edf3] w-10 text-right">
                      {h.completion_pct ?? 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
