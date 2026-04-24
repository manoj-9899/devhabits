// src/pages/Dashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The overview page: today's summary + heatmap + top streaks
// ─────────────────────────────────────────────────────────────────────────────
import { format } from 'date-fns';
import { StatsCard, StreakCard } from '../components/StatsCard';
import { Heatmap } from '../components/Heatmap';
import { useToday, useHeatmap, useStats } from '../hooks/index';

export function Dashboard() {
  const { data: today, isLoading: todayLoading } = useToday();
  const { data: heatmap, isLoading: heatmapLoading } = useHeatmap(365);
  const { data: stats } = useStats();

  const summary = today?.summary;
  const topStreaks = stats?.habits.slice(0, 4) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#e6edf3] tracking-tight">Overview</h1>
          <p className="text-sm text-[#8b949e] mt-1 font-mono">
            {format(new Date(), "EEEE, MMMM d · yyyy")}
          </p>
        </div>
        {summary && (
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-[#8b949e] uppercase tracking-wider mb-1">Today Progress</span>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-[#30363d] bg-[#161b22]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#238636] shadow-[0_0_8px_#238636]" />
              <span className="text-2xl font-bold font-mono text-[#e6edf3]">
                {summary.completion_pct}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {todayLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#161b22] rounded-lg border border-[#30363d] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            label="Total"
            value={summary?.total ?? 0}
            sub="habits"
            accent="#58a6ff"
            mono
          />
          <StatsCard
            label="Done"
            value={summary?.done ?? 0}
            sub={`of ${summary?.total ?? 0}`}
            accent="#3fb950"
            mono
          />
          <StatsCard
            label="Pending"
            value={summary?.pending ?? 0}
            sub="remaining"
            accent="#d29922"
            mono
          />
          <StatsCard
            label="Completion"
            value={`${summary?.completion_pct ?? 0}%`}
            sub="today"
            accent={
              (summary?.completion_pct ?? 0) >= 80 ? '#3fb950' :
              (summary?.completion_pct ?? 0) >= 50 ? '#d29922' : '#f85149'
            }
            mono
          />
        </div>
      )}

      {/* Heatmap section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-[#e6edf3]">Contribution Graph</h2>
          <span className="text-xs text-[#8b949e]">· Last 365 days</span>
        </div>

        <div className="p-5 bg-[#161b22] border border-[#30363d] rounded-lg overflow-x-auto">
          {heatmapLoading ? (
            <div className="h-32 animate-pulse bg-[#21262d] rounded" />
          ) : (
            <Heatmap data={heatmap?.data ?? []} />
          )}
        </div>
      </section>

      {/* Top streaks */}
      {topStreaks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-[#e6edf3]">Streaks</h2>
            <span className="text-xs text-[#8b949e]">· Current vs best</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topStreaks.map(h => (
              <StreakCard
                key={h.id}
                name={h.name}
                color={h.color}
                current={h.current_streak}
                best={h.best_streak}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
