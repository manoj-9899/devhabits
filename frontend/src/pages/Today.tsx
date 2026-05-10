// src/pages/Today.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Action-oriented inbox for today.
// • Grouped by frequency (Daily / Weekly / Interval) with section headers
// • J/K nav, D/S/M to log focused, R to refresh
// • SegmentedControl filter, mobile-friendly hints
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { HabitCard } from '../components/HabitCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SegmentedControl, type Segment } from '../components/ui/SegmentedControl';
import { useToday, useStats, useLogHabit } from '../hooks/index';
import { useUIStore } from '../store/uiStore';
import { listContainer, listItem } from '../lib/motion';
import type { FrequencyType, LogState, TodayHabit } from '../types';

type Filter = 'ALL' | LogState;

const STATE_ORDER: Record<LogState, number> = { PENDING: 0, DONE: 1, SKIPPED: 2, MISSED: 3 };

const GROUP_ORDER: FrequencyType[] = ['DAILY', 'WEEKLY', 'INTERVAL'];

const GROUP_LABEL: Record<FrequencyType, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  INTERVAL: 'Interval',
};

export function Today() {
  const { data, isLoading, refetch } = useToday();
  const { data: stats } = useStats();
  const { openAddHabit } = useUIStore();
  const { mutate: logHabit } = useLogHabit();

  const [focusedIndex, setFocusedIndex] = useState(0);
  const [filter, setFilter] = useState<Filter>('ALL');

  const habits = data?.habits ?? [];
  const summary = data?.summary;

  // Map habit_id → current_streak so we can flag streak-at-risk on cards.
  const streakMap = useMemo(() => {
    const m = new Map<string, number>();
    stats?.habits.forEach((h) => m.set(h.id, h.current_streak));
    return m;
  }, [stats]);

  const filtered = filter === 'ALL' ? habits : habits.filter((h) => h.today_state === filter);

  // Sort within group by state (PENDING first), then preserve sort_order.
  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          STATE_ORDER[a.today_state] - STATE_ORDER[b.today_state] || a.sort_order - b.sort_order
      ),
    [filtered]
  );

  // Group by frequency for section rendering.
  const grouped = useMemo(() => {
    const map = new Map<FrequencyType, TodayHabit[]>();
    sorted.forEach((h) => {
      const list = map.get(h.frequency_type) ?? [];
      list.push(h);
      map.set(h.frequency_type, list);
    });
    return map;
  }, [sorted]);

  const flatIndex = sorted; // for keyboard navigation (treats list as flat across groups)

  // ── Keyboard ────────────────────────────────────────────────────────────────
  const logFocused = useCallback(
    (state: 'DONE' | 'SKIPPED' | 'MISSED') => {
      const focused = flatIndex[focusedIndex];
      if (focused) logHabit({ habit_id: focused.id, state, source: 'WEB' });
    },
    [flatIndex, focusedIndex, logHabit]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, flatIndex.length - 1));
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'd' || e.key === 'D') logFocused('DONE');
      if (e.key === 's' || e.key === 'S') logFocused('SKIPPED');
      if (e.key === 'm' || e.key === 'M') logFocused('MISSED');
      if (e.key === 'r' || e.key === 'R') refetch();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flatIndex, logFocused, refetch]);

  // ── Filter options (with counts) ───────────────────────────────────────────
  const filterOptions: Segment<Filter>[] = [
    { value: 'ALL', label: 'All', count: summary?.total },
    { value: 'PENDING', label: 'Pending', count: summary?.pending },
    { value: 'DONE', label: 'Done', count: summary?.done },
    { value: 'SKIPPED', label: 'Skipped', count: summary?.skipped },
    { value: 'MISSED', label: 'Missed', count: summary?.missed },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-6 sm:gap-8 min-h-full">
      {/* Header & Progress */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[clamp(24px,4vw,32px)] font-bold text-[#e6edf3] tracking-tight">
              Today
            </h1>
            <p className="text-sm text-[#8b949e] mt-1 font-mono">
              {format(new Date(), 'EEEE, MMM d')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            title="Refresh (R)"
            aria-label="Refresh today's habits"
          >
            <RefreshIcon />
          </Button>
        </div>

        {summary && summary.total > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-sm text-[#8b949e] font-medium">
                {summary.done} / {summary.total} completed
              </span>
              <span className="text-xl font-bold font-mono text-[#e6edf3]">
                {summary.completion_pct}%
              </span>
            </div>
            <div
              className="h-2.5 bg-[#21262d] rounded-full overflow-hidden shadow-inner"
              role="progressbar"
              aria-valuenow={summary.completion_pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Today's completion"
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${summary.completion_pct}%` }}
                transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
                style={{
                  backgroundColor:
                    summary.completion_pct >= 80
                      ? '#238636'
                      : summary.completion_pct >= 50
                        ? '#d29922'
                        : '#388bfd',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Habits */}
      <div className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-[#161b22] rounded-xl border border-[#30363d] animate-pulse"
              />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <Card padding="lg" className="py-12 sm:py-20">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              {habits.length === 0 ? (
                <>
                  <div className="text-5xl mb-1 opacity-80" aria-hidden="true">🌱</div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#e6edf3]">No habits yet</h3>
                    <p className="text-sm text-[#8b949e] mt-1 max-w-xs">
                      Start building your routine today. Create your first habit to track your progress.
                    </p>
                  </div>
                  <Button variant="primary" onClick={openAddHabit}>
                    + Create your first habit
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-1 opacity-80" aria-hidden="true">🎉</div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#e6edf3]">All caught up</h3>
                    <p className="text-sm text-[#8b949e] mt-1">
                      Nothing matches the {filter.toLowerCase()} filter.
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6 sm:space-y-7"
          >
            {GROUP_ORDER.filter((g) => grouped.has(g)).map((group) => {
              const items = grouped.get(group)!;
              const offset = sorted.findIndex((h) => h.id === items[0]?.id);
              return (
                <section key={group} aria-labelledby={`group-${group}`}>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <h2
                      id={`group-${group}`}
                      className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-widest"
                    >
                      {GROUP_LABEL[group]}
                    </h2>
                    <span className="text-[10px] text-[#6e7681] font-mono">
                      {items.length} habit{items.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="space-y-2.5 sm:space-y-3">
                    {items.map((habit, i) => (
                      <motion.div key={habit.id} variants={listItem}>
                        <HabitCard
                          habit={habit}
                          focused={offset + i === focusedIndex}
                          currentStreak={streakMap.get(habit.id) ?? 0}
                        />
                      </motion.div>
                    ))}
                  </div>
                </section>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Footer: Filters + (desktop) keyboard hints */}
      <div className="pt-4 border-t border-[#30363d] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="overflow-x-auto -mx-1 px-1">
          <SegmentedControl<Filter>
            value={filter}
            options={filterOptions}
            onChange={(v) => {
              setFilter(v);
              setFocusedIndex(0);
            }}
            ariaLabel="Filter habits by state"
          />
        </div>

        {/* Hints only on devices that have a physical keyboard */}
        <div className="hidden md:flex gap-4 text-[11px] text-[#6e7681] font-mono border border-[#21262d] rounded-md px-3 py-2 bg-[#161b22]/50">
          <span><span className="text-[#8b949e]">J/K</span> nav</span>
          <span><span className="text-[#8b949e]">D</span> done</span>
          <span><span className="text-[#8b949e]">S</span> skip</span>
          <span><span className="text-[#8b949e]">M</span> miss</span>
        </div>
      </div>
    </div>
  );
}

const RefreshIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);
