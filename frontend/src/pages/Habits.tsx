// src/pages/Habits.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Full habit management: list all habits, see details, archive
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { CategoryBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useHabits, useArchiveHabit } from '../hooks/index';
import { useUIStore } from '../store/uiStore';
import type { Habit } from '../types';

const FREQ_LABELS = { DAILY: 'Daily', WEEKLY: 'Weekly', INTERVAL: 'Every N days' };

export function Habits() {
  const { data, isLoading } = useHabits(true); // withStreak=true
  const { mutate: archive, isPending: archiving } = useArchiveHabit();
  const { openAddHabit } = useUIStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const habits = data?.habits ?? [];

  const categories = ['All', ...Array.from(new Set(habits.map(h => h.category)))];

  const filtered = habits.filter(h => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
                        h.category.toLowerCase().includes(search.toLowerCase());
    const matchCat    = categoryFilter === 'All' || h.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3]">Habits</h1>
          <p className="text-sm text-[#8b949e] mt-1">
            {habits.length} active habit{habits.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openAddHabit} icon={<PlusIcon />}>
          New Habit
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search habits..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded-md text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] transition-colors"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                categoryFilter === c
                  ? 'bg-[#388bfd] text-white'
                  : 'bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2 text-[11px] font-medium text-[#8b949e] uppercase tracking-wider border-b border-[#21262d]">
          <span>Habit</span>
          <span>Frequency</span>
          <span>Streak</span>
          <span>Best</span>
          <span />
        </div>
      )}

      {/* Habits list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-[#161b22] rounded-lg border border-[#30363d] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          {habits.length === 0 ? (
            <>
              <div className="text-5xl">🌱</div>
              <p className="text-sm text-[#8b949e]">No habits yet. Start building consistency.</p>
              <Button variant="primary" onClick={openAddHabit}>Add your first habit</Button>
            </>
          ) : (
            <p className="text-sm text-[#8b949e]">No habits match your filter.</p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(habit => (
            <HabitRow
              key={habit.id}
              habit={habit}
              onArchive={() => archive(habit.id)}
              archiving={archiving}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface HabitRowProps {
  habit:     Habit;
  onArchive: () => void;
  archiving: boolean;
}

function HabitRow({ habit, onArchive, archiving }: HabitRowProps) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="group grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-3 bg-[#0d1117] hover:bg-[#161b22] border border-[#30363d] hover:border-[#484f58] rounded-lg transition-all duration-100">
      {/* Name + category */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
        <div className="min-w-0">
          <div className="text-sm font-medium text-[#e6edf3] truncate">{habit.name}</div>
          {habit.description && (
            <div className="text-xs text-[#8b949e] truncate">{habit.description}</div>
          )}
        </div>
        <CategoryBadge category={habit.category} color={habit.color} />
      </div>

      {/* Frequency */}
      <span className="text-xs text-[#8b949e] font-mono whitespace-nowrap">
        {FREQ_LABELS[habit.frequency_type]}
        {habit.interval_days ? ` (${habit.interval_days}d)` : ''}
      </span>

      {/* Current streak */}
      <div className="text-center">
        <div className="text-sm font-bold font-mono" style={{ color: habit.color }}>
          {habit.current_streak ?? 0}
        </div>
        <div className="text-[10px] text-[#6e7681]">streak</div>
      </div>

      {/* Best streak */}
      <div className="text-center">
        <div className="text-sm font-bold font-mono text-[#e6edf3]">
          {habit.best_streak ?? 0}
        </div>
        <div className="text-[10px] text-[#6e7681]">best</div>
      </div>

      {/* Archive action */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        {confirm ? (
          <div className="flex gap-1">
            <button
              onClick={onArchive}
              disabled={archiving}
              className="text-[11px] text-[#f85149] hover:underline cursor-pointer disabled:opacity-50"
            >
              Confirm
            </button>
            <span className="text-[#30363d]">·</span>
            <button onClick={() => setConfirm(false)} className="text-[11px] text-[#8b949e] hover:underline cursor-pointer">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            className="p-1.5 rounded text-[#8b949e] hover:text-[#f85149] hover:bg-[#3d1c1c] transition-colors cursor-pointer"
            title="Archive habit"
          >
            <ArchiveIcon />
          </button>
        )}
      </div>
    </div>
  );
}

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const ArchiveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);
