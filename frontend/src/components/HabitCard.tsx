// src/components/HabitCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The core card shown in the "Today" inbox.
// Supports 3-state logging with keyboard shortcuts (D/S/M).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { StateBadge, CategoryBadge } from './ui/Badge';
import { useLogHabit } from '../hooks/index';
import type { TodayHabit, LogState } from '../types';

interface HabitCardProps {
  habit: TodayHabit;
  index?: number; // for keyboard shortcut hint
  focused?: boolean;
}

const STATE_BORDER: Record<LogState, string> = {
  DONE: 'border-[#238636]/60 bg-[#0d1117]',
  SKIPPED: 'border-[#388bfd]/40 bg-[#0d1117]',
  MISSED: 'border-[#da3633]/40 bg-[#0d1117]',
  PENDING: 'border-[#30363d] bg-[#0d1117]',
};

export function HabitCard({ habit, focused }: HabitCardProps) {
  const { mutate: logHabit, isPending } = useLogHabit();
  const cardRef = useRef<HTMLDivElement>(null);

  const log = (state: 'DONE' | 'SKIPPED' | 'MISSED') => {
    // If clicking the same state, allow re-clicking (no-op visually; server handles it)
    logHabit({ habit_id: habit.id, state, source: 'WEB' });
  };

  // Auto-focus when selected
  useEffect(() => {
    if (focused) cardRef.current?.focus();
  }, [focused]);

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      className={clsx(
        'group flex items-center gap-4 p-4 rounded-lg border',
        'transition-all duration-200 outline-none',
        'hover:-translate-y-0.5 hover:shadow-md hover:border-[#484f58] focus-visible:ring-2 focus-visible:ring-[#388bfd]/50',
        STATE_BORDER[habit.today_state],
        isPending && 'opacity-70 pointer-events-none'
      )}
    >
      {/* Color dot */}
      <div
        className="w-3 h-3 rounded-full shrink-0 mt-0.5"
        style={{ backgroundColor: habit.today_state === 'PENDING' ? '#30363d' : habit.color }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={clsx(
              'font-medium text-sm',
              habit.today_state === 'DONE' ? 'text-[#8b949e] line-through' : 'text-[#e6edf3]'
            )}
          >
            {habit.name}
          </span>
          <CategoryBadge category={habit.category} color={habit.color} />
        </div>

        <div className="flex items-center gap-3 mt-1.5">
          <StateBadge state={habit.today_state} />
          <span className="text-[11px] text-[#6e7681] font-mono lowercase">
            {habit.frequency_type}
          </span>
          {habit.logged_at && (
            <span className="text-[11px] text-[#6e7681]">
              logged{' '}
              {new Date(habit.logged_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <ActionBtn
          label="Done"
          shortcut="✅"
          active={habit.today_state === 'DONE'}
          activeColor="#238636"
          activeBg="#1a4a2e"
          onClick={() => log('DONE')}
        />
        <ActionBtn
          label="Skip"
          shortcut="⏭"
          active={habit.today_state === 'SKIPPED'}
          activeColor="#388bfd"
          activeBg="#1c2d4a"
          onClick={() => log('SKIPPED')}
        />
        <ActionBtn
          label="Miss"
          shortcut="❌"
          active={habit.today_state === 'MISSED'}
          activeColor="#da3633"
          activeBg="#3d1c1c"
          onClick={() => log('MISSED')}
        />
      </div>
    </div>
  );
}

interface ActionBtnProps {
  label: string;
  shortcut: string;
  active: boolean;
  activeColor: string;
  activeBg: string;
  onClick: () => void;
}

function ActionBtn({ label, shortcut, active, activeColor, activeBg, onClick }: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      title={`${label} (keyboard)`}
      className={clsx(
        'w-7 h-7 flex items-center justify-center rounded text-sm font-medium transition-all duration-100',
        'border cursor-pointer hover:scale-110 active:scale-95',
        active
          ? 'border-transparent shadow-sm'
          : 'border-[#30363d] text-[#8b949e] bg-transparent hover:text-[#e6edf3] hover:border-[#484f58] opacity-50 hover:opacity-100'
      )}
      style={
        active
          ? {
              color: activeColor,
              backgroundColor: activeBg,
              borderColor: `${activeColor}40`,
              opacity: 1,
            }
          : undefined
      }
    >
      {shortcut}
    </button>
  );
}
