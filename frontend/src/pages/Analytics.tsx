// src/pages/Analytics.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Deep analytics: KPIs, full heatmap, weekday consistency, weekly trend,
// per-habit fingerprints (mini heatmaps), and a completion table.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heatmap } from '../components/Heatmap';
import { StatsCard } from '../components/StatsCard';
import { Card } from '../components/ui/Card';
import { SegmentedControl, type Segment } from '../components/ui/SegmentedControl';
import { MiniHeatmap } from '../components/analytics/MiniHeatmap';
import { WeekdayBars } from '../components/analytics/WeekdayBars';
import { TrendSparkline } from '../components/analytics/TrendSparkline';
import { useHeatmap, useHeatmapByHabit, useStats } from '../hooks/index';
import { listContainer, listItem } from '../lib/motion';
import type { HabitHeatmapDay } from '../types';

type HeatmapRange = 90 | 180 | 365;

const RANGE_OPTIONS: Segment<HeatmapRange>[] = [
  { value: 90, label: '90d' },
  { value: 180, label: '180d' },
  { value: 365, label: '365d' },
];

export function Analytics() {
  const [heatmapDays, setHeatmapDays] = useState<HeatmapRange>(365);
  const { data: heatmap, isLoading: heatmapLoading } = useHeatmap(heatmapDays);
  const { data: byHabit } = useHeatmapByHabit(90);
  const { data: stats, isLoading: statsLoading } = useStats();

  const habits = useMemo(() => stats?.habits ?? [], [stats]);

  // ── Top-level aggregates ────────────────────────────────────────────────────
  const totalDone = habits.reduce((sum, h) => sum + h.total_done, 0);
  const avgCompletion =
    habits.length > 0
      ? Math.round(habits.reduce((sum, h) => sum + (h.completion_pct ?? 0), 0) / habits.length)
      : 0;
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.best_streak), 0);
  const bestStreakLabel = streakTier(bestStreak);

  const sortedBySuccess = [...habits].sort(
    (a, b) =>
      (b.completion_pct ?? 0) * 100 +
      b.current_streak -
      ((a.completion_pct ?? 0) * 100 + a.current_streak)
  );
  const topHabit = sortedBySuccess[0];
  const worstHabit =
    sortedBySuccess.length > 1 ? sortedBySuccess[sortedBySuccess.length - 1] : undefined;

  // ── Group per-habit data into a Map<habit_id, Map<date, done_count>>  ─────
  const perHabitMap = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    (byHabit?.data ?? []).forEach((row: HabitHeatmapDay) => {
      let inner = m.get(row.habit_id);
      if (!inner) {
        inner = new Map();
        m.set(row.habit_id, inner);
      }
      inner.set(row.date, row.done_count);
    });
    return m;
  }, [byHabit]);

  // Sort per-habit list to match the table below: by completion_pct desc.
  const habitsSorted = useMemo(
    () =>
      [...habits].sort((a, b) => (b.completion_pct ?? 0) - (a.completion_pct ?? 0) || b.total_done - a.total_done),
    [habits]
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8 sm:space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-[clamp(24px,4vw,32px)] font-bold text-[#e6edf3] tracking-tight">
          Analytics
        </h1>
        <p className="text-sm text-[#8b949e] mt-1">All-time consistency metrics</p>
      </div>

      {/* KPI strip */}
      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
      >
        <motion.div variants={listItem}>
          <StatsCard label="Completions" value={totalDone} mono accent="#3fb950" />
        </motion.div>
        <motion.div variants={listItem}>
          <StatsCard
            label="Average Rate"
            value={`${avgCompletion}%`}
            sub="per habit"
            mono
            accent={avgCompletion >= 70 ? '#3fb950' : avgCompletion >= 40 ? '#d29922' : '#da3633'}
          />
        </motion.div>
        <motion.div variants={listItem}>
          <StatsCard
            label="Best Streak"
            value={bestStreak}
            sub={bestStreakLabel}
            mono
            accent="#58a6ff"
          />
        </motion.div>
        <motion.div variants={listItem}>
          <StatsCard
            label="Top Habit"
            value={topHabit?.name ?? '—'}
            sub={topHabit ? `${topHabit.completion_pct}% rate` : ''}
            accent={topHabit?.color}
            staticValue
          />
        </motion.div>
        <motion.div variants={listItem}>
          <StatsCard
            label="Needs Work"
            value={worstHabit?.name ?? '—'}
            sub={worstHabit ? `${worstHabit.completion_pct}% rate` : ''}
            accent="#da3633"
            staticValue
          />
        </motion.div>
      </motion.div>

      {/* Activity heatmap */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-[#e6edf3]">Activity Heatmap</h2>
          <SegmentedControl<HeatmapRange>
            value={heatmapDays}
            options={RANGE_OPTIONS}
            onChange={setHeatmapDays}
            size="sm"
            ariaLabel="Heatmap range"
          />
        </div>

        <Card padding="lg" className="overflow-x-auto">
          {heatmapLoading ? (
            <div className="h-32 animate-pulse bg-[#21262d] rounded" />
          ) : (
            <Heatmap data={heatmap?.data ?? []} days={heatmapDays} />
          )}
        </Card>
      </section>

      {/* Patterns: weekday + trend (side-by-side at lg) */}
      {(heatmap?.data?.length ?? 0) > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#e6edf3] mb-3 sm:mb-4">Patterns</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <Card padding="lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] text-[#8b949e] font-semibold uppercase tracking-widest">
                  Day of week
                </h3>
                <span className="text-[10px] text-[#6e7681] font-mono">{heatmapDays}d window</span>
              </div>
              <WeekdayBars data={heatmap?.data ?? []} />
            </Card>
            <Card padding="lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] text-[#8b949e] font-semibold uppercase tracking-widest">
                  Weekly trend
                </h3>
                <span className="text-[10px] text-[#6e7681] font-mono">last 12 weeks</span>
              </div>
              <TrendSparkline data={heatmap?.data ?? []} weeks={12} />
            </Card>
          </div>
        </section>
      )}

      {/* Per-habit fingerprints */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-[#e6edf3]">Per-Habit Activity</h2>
          <span className="text-[10px] text-[#6e7681] font-mono">last 90 days</span>
        </div>

        {statsLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-[#161b22] rounded-xl border border-[#30363d] animate-pulse"
              />
            ))}
          </div>
        ) : habitsSorted.length === 0 ? (
          <Card padding="lg" className="py-12 text-center">
            <p className="text-sm text-[#8b949e]">No habit data yet. Start logging!</p>
          </Card>
        ) : (
          <motion.ul
            variants={listContainer}
            initial="hidden"
            animate="visible"
            className="space-y-2 list-none m-0 p-0"
            aria-label="Per-habit activity fingerprints"
          >
            {habitsSorted.map((h) => (
              <motion.li key={h.id} variants={listItem}>
                <Card padding="md" className="hover:border-[#484f58]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                    {/* Identity */}
                    <div className="flex items-center gap-3 min-w-0 sm:w-56 shrink-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: h.color }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#e6edf3] truncate">
                          {h.name}
                        </div>
                        <div className="text-[11px] text-[#6e7681] truncate">{h.category}</div>
                      </div>
                    </div>

                    {/* Mini heatmap */}
                    <div className="flex-1 overflow-x-auto">
                      <MiniHeatmap
                        color={h.color}
                        data={perHabitMap.get(h.id) ?? new Map()}
                        days={90}
                        ariaLabel={`${h.name} — last 90 days`}
                      />
                    </div>

                    {/* Compact stats */}
                    <dl className="grid grid-cols-3 gap-3 sm:gap-4 sm:w-44 shrink-0">
                      <Stat label="Streak" value={h.current_streak} accent={h.color} />
                      <Stat label="Best" value={h.best_streak} />
                      <Stat
                        label="Rate"
                        value={`${h.completion_pct ?? 0}%`}
                        accent={
                          (h.completion_pct ?? 0) >= 70
                            ? '#3fb950'
                            : (h.completion_pct ?? 0) >= 40
                              ? '#d29922'
                              : '#da3633'
                        }
                      />
                    </dl>
                  </div>
                </Card>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </section>

      {/* Completion table */}
      {!statsLoading && habitsSorted.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#e6edf3] mb-3 sm:mb-4">Completion Table</h2>
          <Card padding="none" radius="lg" className="overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 sm:gap-4 px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] text-[11px] font-medium text-[#8b949e] uppercase tracking-wider">
              <span>Habit</span>
              <span className="text-right">Done</span>
              <span className="text-right hidden sm:block">Eligible</span>
              <span className="text-right">Rate</span>
            </div>

            {habitsSorted.map((h, i) => (
              <div
                key={h.id}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-3 sm:gap-4 px-4 py-3 items-center ${
                  i % 2 === 0 ? 'bg-[#0d1117]' : 'bg-[#0a0e13]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: h.color }}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-[#e6edf3] truncate">{h.name}</span>
                  <span className="text-xs text-[#8b949e] hidden sm:inline">· {h.category}</span>
                </div>

                <span className="text-sm font-mono text-[#3fb950] text-right">{h.total_done}</span>
                <span className="text-sm font-mono text-[#8b949e] text-right hidden sm:block">
                  {h.total_eligible}
                </span>

                <div className="flex items-center gap-2 justify-end">
                  <div className="w-12 sm:w-16 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${h.completion_pct ?? 0}%`,
                        backgroundColor:
                          (h.completion_pct ?? 0) >= 70
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
          </Card>
        </section>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function streakTier(days: number): string {
  if (days <= 0) return 'no streaks yet';
  if (days < 7) return 'just getting started';
  if (days < 30) return 'building momentum';
  if (days < 100) return 'strong habit';
  if (days < 365) return 'legendary';
  return 'lifelong';
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="text-center sm:text-right">
      <div className="text-sm font-bold font-mono" style={accent ? { color: accent } : { color: '#e6edf3' }}>
        {value}
      </div>
      <div className="text-[10px] text-[#6e7681] uppercase tracking-wider">{label}</div>
    </div>
  );
}
