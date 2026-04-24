// src/pages/Today.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The "Inbox" page — action-oriented list of today's habits.
// Keyboard: J/K to navigate cards, D/S/M to log the focused one.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { HabitCard } from '../components/HabitCard';
import { Button } from '../components/ui/Button';
import { useToday } from '../hooks/index';
import { useUIStore } from '../store/uiStore';
import { useLogHabit } from '../hooks/index';
import type { LogState } from '../types';

const STATE_ORDER: Record<string, number> = { PENDING: 0, DONE: 1, SKIPPED: 2, MISSED: 3 };

export function Today() {
  const { data, isLoading, refetch } = useToday();
  const { openAddHabit } = useUIStore();
  const { mutate: logHabit } = useLogHabit();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [filter, setFilter] = useState<'ALL' | LogState>('ALL');

  const habits = data?.habits ?? [];
  const summary = data?.summary;

  const filtered = filter === 'ALL' ? habits : habits.filter((h) => h.today_state === filter);

  const sorted = [...filtered].sort(
    (a, b) => STATE_ORDER[a.today_state] - STATE_ORDER[b.today_state]
  );

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const logFocused = useCallback(
    (state: 'DONE' | 'SKIPPED' | 'MISSED') => {
      const focused = sorted[focusedIndex];
      if (focused) logHabit({ habit_id: focused.id, state, source: 'WEB' });
    },
    [sorted, focusedIndex, logHabit]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, sorted.length - 1));
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
  }, [sorted, logFocused, refetch]);

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col gap-8 min-h-full">
      {/* Header & Progress */}
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[32px] font-bold text-[#e6edf3] tracking-tight">Today</h1>
            <p className="text-sm text-[#8b949e] mt-1 font-mono">
              {format(new Date(), 'EEEE, MMM d')}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} title="Refresh (R)">
            <RefreshIcon />
          </Button>
        </div>

        {summary && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#8b949e] font-medium">
                {summary.done} / {summary.total} completed
              </span>
              <span className="text-xl font-bold font-mono text-[#e6edf3]">
                {summary.completion_pct}%
              </span>
            </div>
            <div className="h-3 bg-[#21262d] rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                style={{
                  width: `${summary.completion_pct}%`,
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

      {/* Habits list */}
      <div className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[#161b22] rounded-lg border border-[#30363d] animate-pulse"
              />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center border border-dashed border-[#30363d] rounded-xl bg-[#0d1117]/50">
            {habits.length === 0 ? (
              <>
                <div className="text-5xl mb-2 opacity-80">🌱</div>
                <div>
                  <h3 className="text-lg font-semibold text-[#e6edf3]">No habits yet</h3>
                  <p className="text-sm text-[#8b949e] mt-1 mb-4 max-w-xs">
                    Start building your routine today. Create your first habit to track your
                    progress.
                  </p>
                </div>
                <Button variant="primary" size="md" onClick={openAddHabit}>
                  + Create your first habit
                </Button>
              </>
            ) : (
              <>
                <div className="text-5xl mb-2 opacity-80">🎉</div>
                <div>
                  <h3 className="text-lg font-semibold text-[#e6edf3]">All caught up!</h3>
                  <p className="text-sm text-[#8b949e] mt-1">
                    You've completed all your {filter.toLowerCase()} habits.
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((habit, i) => (
              <HabitCard key={habit.id} habit={habit} index={i} focused={i === focusedIndex} />
            ))}
          </div>
        )}
      </div>

      {/* Footer: Filters & Hints */}
      <div className="pt-4 border-t border-[#30363d] flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#161b22] rounded-lg border border-[#30363d] w-fit">
          {(['ALL', 'PENDING', 'DONE', 'SKIPPED', 'MISSED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setFocusedIndex(0);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filter === f
                  ? 'bg-[#21262d] text-[#e6edf3] shadow-sm'
                  : 'text-[#8b949e] hover:text-[#e6edf3]'
              }`}
            >
              {f === 'ALL'
                ? `All ${summary ? `(${summary.total})` : ''}`
                : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Keyboard hints */}
        <div className="flex gap-4 text-[11px] text-[#6e7681] font-mono border border-[#21262d] rounded-md px-3 py-2 bg-[#161b22]/50">
          <span>
            <span className="text-[#8b949e]">J/K</span> nav
          </span>
          <span>
            <span className="text-[#8b949e]">D</span> done
          </span>
          <span>
            <span className="text-[#8b949e]">S</span> skip
          </span>
          <span>
            <span className="text-[#8b949e]">M</span> miss
          </span>
        </div>
      </div>
    </div>
  );
}

const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);
