// src/pages/Habits.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Habit management: search, category filters, sort, responsive list, archive + undo.
// Primary “New habit” lives in Shell — no duplicate CTA here.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { CategoryBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select, type SelectOption } from '../components/ui/Select';
import { StreakBadge } from '../components/ui/StreakBadge';
import { useHabits, useArchiveHabit, useRestoreHabit } from '../hooks/index';
import { useUIStore } from '../store/uiStore';
import { toast } from '../store/toastStore';
import { listContainer, listItem } from '../lib/motion';
import type { Habit } from '../types';

const FREQ_LABELS = { DAILY: 'Daily', WEEKLY: 'Weekly', INTERVAL: 'Every N days' };

type SortKey = 'manual' | 'name' | 'streak' | 'best' | 'category' | 'frequency';

const SORT_OPTIONS: SelectOption<SortKey>[] = [
  { value: 'manual', label: 'Manual order' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'streak', label: 'Current streak (high → low)' },
  { value: 'best', label: 'Best streak (high → low)' },
  { value: 'category', label: 'Category' },
  { value: 'frequency', label: 'Frequency' },
];

function sortHabits(list: Habit[], key: SortKey): Habit[] {
  const copy = [...list];
  switch (key) {
    case 'manual':
      return copy.sort(
        (a, b) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    case 'streak':
      return copy.sort((a, b) => (b.current_streak ?? 0) - (a.current_streak ?? 0));
    case 'best':
      return copy.sort((a, b) => (b.best_streak ?? 0) - (a.best_streak ?? 0));
    case 'category':
      return copy.sort(
        (a, b) =>
          a.category.localeCompare(b.category, undefined, { sensitivity: 'base' }) ||
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
    case 'frequency':
      return copy.sort(
        (a, b) =>
          a.frequency_type.localeCompare(b.frequency_type) ||
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
    default:
      return copy;
  }
}

export function Habits() {
  const { data, isLoading } = useHabits(true);
  const { mutateAsync: archiveMut, isPending: archiving } = useArchiveHabit();
  const { mutateAsync: restoreMut } = useRestoreHabit();
  const { openAddHabit } = useUIStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('manual');

  const habits = data?.habits ?? [];

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(habits.map((h) => h.category))).sort((a, b) => a.localeCompare(b))],
    [habits]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return habits.filter((h) => {
      const matchSearch =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q) ||
        (h.description ?? '').toLowerCase().includes(q);
      const matchCat = categoryFilter === 'All' || h.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [habits, search, categoryFilter]);

  const sorted = useMemo(() => sortHabits(filtered, sortKey), [filtered, sortKey]);

  const handleArchive = async (habit: Habit) => {
    try {
      await archiveMut(habit.id);
      toast.undo(`Archived “${habit.name}”`, () => {
        void restoreMut(habit.id).catch(() => toast.error('Could not restore habit'));
      });
    } catch {
      toast.error('Could not archive habit', 'Check your connection and try again.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 sm:space-y-6">
      {/* Header — matches Dashboard / Today typography; no duplicate New Habit (Shell CTA) */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[clamp(24px,4vw,32px)] font-bold text-[#e6edf3] tracking-tight">Habits</h1>
        <p className="text-sm text-[#8b949e]">
          {habits.length} active habit{habits.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="flex-1 min-w-0">
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search habits…"
            leadingIcon={<SearchIcon />}
            containerClassName="sm:[&_label]:sr-only"
          />
        </div>
        <div className="w-full sm:w-56 shrink-0">
          <Select<SortKey>
            label="Sort"
            value={sortKey}
            options={SORT_OPTIONS}
            onChange={setSortKey}
            containerClassName="sm:[&_label]:sr-only"
          />
        </div>
      </div>

      {/* Category chips — horizontal scroll on narrow viewports */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategoryFilter(c)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40 ${
              categoryFilter === c
                ? 'bg-[#388bfd] text-white border-transparent'
                : 'bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] border-[#30363d]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Column headers — desktop only */}
      {!isLoading && sorted.length > 0 && (
        <div className="hidden md:grid md:grid-cols-[1fr_auto_auto_auto_auto] md:gap-4 px-4 pb-2 text-[11px] font-medium text-[#8b949e] uppercase tracking-wider border-b border-[#21262d]">
          <span>Habit</span>
          <span className="text-left">Frequency</span>
          <span className="text-center">Streak</span>
          <span className="text-center">Best</span>
          <span className="sr-only">Actions</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 md:h-14 bg-[#161b22] rounded-xl border border-[#30363d] animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card padding="lg" className="py-14 sm:py-20">
          <div className="flex flex-col items-center gap-4 text-center">
            {habits.length === 0 ? (
              <>
                <div className="text-5xl" aria-hidden="true">
                  🌱
                </div>
                <p className="text-sm text-[#8b949e] max-w-sm">
                  No habits yet. Start building consistency — use <kbd className="font-mono text-[#8b949e]">N</kbd>{' '}
                  in the header to add one.
                </p>
                <Button variant="primary" onClick={openAddHabit}>
                  Add your first habit
                </Button>
              </>
            ) : (
              <p className="text-sm text-[#8b949e]">No habits match your search or filters.</p>
            )}
          </div>
        </Card>
      ) : (
        <motion.ul
          variants={listContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2 md:space-y-1.5 list-none m-0 p-0"
          aria-label="Habit list"
        >
          {sorted.map((habit) => (
            <motion.li key={habit.id} variants={listItem}>
              <HabitRow habit={habit} onArchive={() => void handleArchive(habit)} archiveDisabled={archiving} />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}

interface HabitRowProps {
  habit: Habit;
  onArchive: () => void;
  archiveDisabled: boolean;
}

function HabitRow({ habit, onArchive, archiveDisabled }: HabitRowProps) {
  const streak = habit.current_streak ?? 0;
  const best = habit.best_streak ?? 0;
  const freq =
    FREQ_LABELS[habit.frequency_type] + (habit.interval_days ? ` (${habit.interval_days}d)` : '');

  return (
    <Card
      padding="none"
      className="group overflow-hidden transition-colors hover:border-[#484f58]"
    >
      {/* Mobile — stacked card */}
      <div className="md:hidden p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
              style={{ backgroundColor: habit.color }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[#e6edf3] truncate">
                  {habit.name}
                </span>
                {streak > 0 && <StreakBadge days={streak} size="sm" />}
              </div>
              {habit.description && (
                <p className="text-xs text-[#8b949e] truncate mt-0.5">{habit.description}</p>
              )}
              <div className="mt-2">
                <CategoryBadge category={habit.category} color={habit.color} />
              </div>
            </div>
          </div>
          <ArchiveButton onClick={onArchive} disabled={archiveDisabled} layout="mobile" />
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center border-t border-[#21262d] pt-3">
          <StatCell label="Frequency" value={freq} valueClassName="text-[#8b949e]" />
          <StatCell label="Streak" value={String(streak)} valueStyle={{ color: habit.color }} />
          <StatCell label="Best" value={String(best)} valueClassName="text-[#e6edf3]" />
        </dl>
      </div>

      {/* Desktop — table row */}
      <div className="hidden md:grid md:grid-cols-[1fr_auto_auto_auto_auto] md:gap-4 md:items-center px-4 py-3 bg-[#0d1117]/40">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: habit.color }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-[#e6edf3] truncate">{habit.name}</span>
              {streak > 0 && (
                <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity">
                  <StreakBadge days={streak} size="sm" />
                </span>
              )}
            </div>
            {habit.description && (
              <div className="text-xs text-[#8b949e] truncate">{habit.description}</div>
            )}
          </div>
          <CategoryBadge category={habit.category} color={habit.color} />
        </div>

        <span className="text-xs text-[#8b949e] font-mono whitespace-nowrap justify-self-start">{freq}</span>

        <div className="text-center justify-self-center">
          <div className="text-sm font-bold font-mono" style={{ color: habit.color }}>
            {streak}
          </div>
          <div className="text-[10px] text-[#6e7681]">streak</div>
        </div>

        <div className="text-center justify-self-center">
          <div className="text-sm font-bold font-mono text-[#e6edf3]">{best}</div>
          <div className="text-[10px] text-[#6e7681]">best</div>
        </div>

        <div className="justify-self-end opacity-100 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity">
          <ArchiveButton onClick={onArchive} disabled={archiveDisabled} layout="desktop" />
        </div>
      </div>
    </Card>
  );
}

function StatCell({
  label,
  value,
  valueClassName,
  valueStyle,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  valueStyle?: CSSProperties;
}) {
  return (
    <div>
      <dt className="text-[10px] text-[#6e7681] uppercase tracking-wide font-semibold">{label}</dt>
      <dd
        className={`text-sm font-semibold font-mono mt-0.5 truncate ${valueClassName ?? ''}`}
        style={valueStyle}
      >
        {value}
      </dd>
    </div>
  );
}

function ArchiveButton({
  onClick,
  disabled,
  layout,
}: {
  onClick: () => void;
  disabled: boolean;
  layout: 'mobile' | 'desktop';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title="Archive habit"
      aria-label="Archive habit"
      className={`rounded-lg border border-[#30363d] text-[#8b949e] hover:text-[#f85149] hover:bg-[#3d1c1c] hover:border-[#da3633]/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40 ${
        layout === 'mobile' ? 'p-2.5 touch-manipulation' : 'p-1.5'
      }`}
    >
      <ArchiveIcon />
    </button>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}
