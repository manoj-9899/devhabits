// src/pages/Dashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Overview page: focal Today ring + 3 meaningful KPIs + heatmap + top streaks.
// Replaces the redundant 4-card metric strip from v1.
// ─────────────────────────────────────────────────────────────────────────────
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StreakCard, StatsCard } from '../components/StatsCard';
import { TodayRing } from '../components/dashboard/TodayRing';
import { Heatmap } from '../components/Heatmap';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToday, useHeatmap, useStats } from '../hooks/index';
import { useUIStore } from '../store/uiStore';
import { listContainer, listItem } from '../lib/motion';

const TOP_STREAK_LIMIT = 4;

export function Dashboard() {
  const { data: today, isLoading: todayLoading } = useToday();
  const { data: heatmap, isLoading: heatmapLoading } = useHeatmap(365);
  const { data: stats, isLoading: statsLoading } = useStats();
  const { openAddHabit } = useUIStore();

  const summary = today?.summary;
  const habits = stats?.habits ?? [];

  // Sort habits by current streak (desc) for "top streaks" rail.
  const sortedByStreak = [...habits].sort((a, b) => b.current_streak - a.current_streak);
  const topStreaks = sortedByStreak.slice(0, TOP_STREAK_LIMIT);
  const moreStreaks = Math.max(0, habits.length - TOP_STREAK_LIMIT);

  // Derived KPIs (replace redundant Total/Done/Pending/Completion strip).
  const activeStreaks = habits.filter((h) => h.current_streak > 0).length;
  const bestStreakAllTime = habits.reduce((m, h) => Math.max(m, h.best_streak), 0);
  const totalCompletions = habits.reduce((sum, h) => sum + h.total_done, 0);

  // First-run empty state.
  const noHabits = !todayLoading && (summary?.total ?? 0) === 0 && habits.length === 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[clamp(24px,4vw,32px)] font-bold text-[#e6edf3] tracking-tight">
            Overview
          </h1>
          <p className="text-sm text-[#8b949e] mt-1 font-mono">
            {format(new Date(), 'EEEE, MMMM d · yyyy')}
          </p>
        </div>
      </div>

      {noHabits ? (
        <EmptyDashboard onCreate={openAddHabit} />
      ) : (
        <>
          {/* Hero row: Today ring + KPI cards */}
          {todayLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-3 sm:gap-4">
              <div className="h-40 bg-[#161b22] rounded-xl border border-[#30363d] animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-28 bg-[#161b22] rounded-xl border border-[#30363d] animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : (
            <motion.div
              variants={listContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-3 sm:gap-4"
            >
              <motion.div variants={listItem}>
                <TodayRing done={summary?.done ?? 0} total={summary?.total ?? 0} />
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <motion.div variants={listItem}>
                  <StatsCard
                    label="Active Streaks"
                    value={activeStreaks}
                    sub={habits.length ? `of ${habits.length}` : undefined}
                    accent="#3fb950"
                    mono
                  />
                </motion.div>
                <motion.div variants={listItem}>
                  <StatsCard
                    label="Best Streak"
                    value={bestStreakAllTime}
                    sub="days"
                    accent="#58a6ff"
                    mono
                  />
                </motion.div>
                <motion.div variants={listItem}>
                  <StatsCard
                    label="Completions"
                    value={totalCompletions}
                    sub="all-time"
                    accent="#d29922"
                    mono
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Heatmap */}
          <section>
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#e6edf3]">Contribution Graph</h2>
                <span className="text-xs text-[#8b949e]">· Last 365 days</span>
              </div>
              <Link
                to="/analytics"
                className="text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors font-medium"
              >
                Open analytics →
              </Link>
            </div>

            <Card padding="lg" className="overflow-x-auto">
              {heatmapLoading ? (
                <div className="h-32 animate-pulse bg-[#21262d] rounded" />
              ) : (
                <Heatmap data={heatmap?.data ?? []} />
              )}
            </Card>
          </section>

          {/* Top streaks */}
          {topStreaks.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[#e6edf3]">Top Streaks</h2>
                  <span className="text-xs text-[#8b949e]">· Current vs best</span>
                </div>
                {moreStreaks > 0 && (
                  <Link
                    to="/habits"
                    className="text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors font-medium"
                  >
                    +{moreStreaks} more in Habits →
                  </Link>
                )}
              </div>

              {statsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-36 bg-[#161b22] rounded-xl border border-[#30363d] animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={listContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                >
                  {topStreaks.map((h) => (
                    <motion.div key={h.id} variants={listItem}>
                      <StreakCard
                        name={h.name}
                        color={h.color}
                        current={h.current_streak}
                        best={h.best_streak}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ── Empty state for first-time users ────────────────────────────────────────
function EmptyDashboard({ onCreate }: { onCreate: () => void }) {
  return (
    <Card padding="lg" className="py-12 sm:py-16">
      <div className="flex flex-col items-center text-center gap-4 max-w-md mx-auto">
        <div
          className="w-14 h-14 rounded-2xl bg-[#1a4a2e] flex items-center justify-center"
          aria-hidden="true"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3fb950"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v6M12 22v-2" />
            <path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24" />
            <path d="M2 12h6M22 12h-2" />
            <path d="M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#e6edf3]">Build your first habit</h2>
          <p className="text-sm text-[#8b949e] mt-1.5 leading-relaxed">
            Track anything daily — code review, reading, gym, gratitude. Your streaks live locally
            on this device.
          </p>
        </div>
        <Button variant="primary" onClick={onCreate}>
          Create your first habit
          <kbd className="ml-1 text-[10px] bg-[#1a4a2e]/60 px-1 rounded font-mono">N</kbd>
        </Button>
        <p className="text-[11px] text-[#6e7681] font-mono mt-1">
          Press <span className="text-[#8b949e]">?</span> to see all keyboard shortcuts
        </p>
      </div>
    </Card>
  );
}
