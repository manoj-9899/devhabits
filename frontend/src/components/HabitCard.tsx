// src/components/HabitCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The core card shown in the "Today" inbox.
// • Large tap targets (sm: inline labeled, mobile: stacked full-width)
// • Streak-at-risk amber badge for pending daily habits with live streaks
// • Animated check on DONE, relative time, smart undo toast
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { CategoryBadge } from './ui/Badge';
import { StreakBadge } from './ui/StreakBadge';
import { useLogHabit } from '../hooks/index';
import { toast } from '../store/toastStore';
import { DURATION, EASE, SPRING } from '../lib/motion';
import type { TodayHabit, LogState } from '../types';

interface HabitCardProps {
  habit: TodayHabit;
  index?: number;
  focused?: boolean;
  /** Optional streak data sourced from useStats() on the parent page. */
  currentStreak?: number;
}

const STATE_BORDER: Record<LogState, string> = {
  DONE: 'border-[#238636]/60',
  SKIPPED: 'border-[#388bfd]/40',
  MISSED: 'border-[#da3633]/40',
  PENDING: 'border-[#30363d]',
};

export function HabitCard({ habit, focused, currentStreak = 0 }: HabitCardProps) {
  const { mutate: logHabit, isPending } = useLogHabit();
  const cardRef = useRef<HTMLDivElement>(null);

  const isDone = habit.today_state === 'DONE';
  const atRisk =
    habit.today_state === 'PENDING' &&
    habit.frequency_type === 'DAILY' &&
    currentStreak > 0;

  const log = (next: 'DONE' | 'SKIPPED' | 'MISSED') => {
    if (habit.today_state === next) return; // no-op when same state clicked
    const prev = habit.today_state;

    logHabit(
      { habit_id: habit.id, state: next, source: 'WEB' },
      {
        onSuccess: (data) => {
          // Milestone celebration on streak crossing.
          const milestone = isStreakMilestone(data.current_streak);
          if (milestone && next === 'DONE') {
            toast.success(`${milestone} on ${data.habit_name}`, `Streak: ${data.current_streak} days`);
            return;
          }

          // Smart undo: only offer when restoring is possible (i.e. previous
          // state was a logged value, not PENDING — see Phase 4 notes for the
          // backend DELETE endpoint TODO).
          if (prev !== 'PENDING') {
            toast.undo(
              `${labelFor(next)}: ${data.habit_name}`,
              () => {
                logHabit({ habit_id: habit.id, state: prev as 'DONE' | 'SKIPPED' | 'MISSED', source: 'WEB' });
              }
            );
          } else if (next === 'DONE') {
            toast.success(
              `Logged: ${data.habit_name}`,
              data.current_streak > 0 ? `Streak: ${data.current_streak} day${data.current_streak === 1 ? '' : 's'}` : undefined
            );
          } else {
            toast.info(`${labelFor(next)}: ${data.habit_name}`);
          }
        },
        onError: () => toast.error('Could not log habit', 'Check your connection and retry.'),
      }
    );
  };

  useEffect(() => {
    if (focused) cardRef.current?.focus();
  }, [focused]);

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      role="group"
      aria-label={`${habit.name} — ${habit.today_state.toLowerCase()}`}
      className={clsx(
        'group relative rounded-xl border bg-[#0d1117]',
        'transition-all duration-200 outline-none',
        'hover:border-[#484f58] hover:shadow-md',
        'focus-visible:ring-2 focus-visible:ring-[#388bfd]/50',
        STATE_BORDER[habit.today_state],
        isPending && 'opacity-70 pointer-events-none'
      )}
    >
      {/* Animated success ribbon on DONE — soft green accent on the left edge */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            key="done-ribbon"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE.decel }}
            className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#3fb950] rounded-full origin-center"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4">
        {/* Left: dot + name + meta */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex flex-col items-center pt-0.5">
            <motion.div
              key={`${habit.id}-${habit.today_state}`}
              initial={{ scale: 1 }}
              animate={isDone ? { scale: [1, 1.4, 1] } : { scale: 1 }}
              transition={SPRING.bouncy}
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                backgroundColor:
                  habit.today_state === 'PENDING' ? '#30363d' : habit.color,
                boxShadow: isDone ? `0 0 10px ${habit.color}80` : undefined,
              }}
              aria-hidden="true"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={clsx(
                  'font-medium text-sm',
                  isDone ? 'text-[#8b949e] line-through' : 'text-[#e6edf3]'
                )}
              >
                {habit.name}
              </span>
              <CategoryBadge category={habit.category} color={habit.color} />
              {currentStreak > 0 && <StreakBadge days={currentStreak} atRisk={atRisk} />}
            </div>

            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#6e7681] font-mono">
              <span className="lowercase">{habit.frequency_type}</span>
              {habit.logged_at && (
                <>
                  <span className="text-[#30363d]">·</span>
                  <span title={new Date(habit.logged_at).toLocaleString()}>
                    logged {formatDistanceToNow(new Date(habit.logged_at), { addSuffix: true })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: action buttons (inline at sm+, stacked on mobile) */}
        <div
          className="grid grid-cols-3 sm:flex gap-1.5 sm:gap-2 sm:shrink-0"
          role="group"
          aria-label="Log state"
        >
          <LogActionButton
            label="Done"
            icon={<CheckIcon />}
            shortcut="D"
            active={habit.today_state === 'DONE'}
            color={{ fg: '#3fb950', bg: '#1a4a2e', border: '#238636' }}
            onClick={() => log('DONE')}
          />
          <LogActionButton
            label="Skip"
            icon={<SkipIcon />}
            shortcut="S"
            active={habit.today_state === 'SKIPPED'}
            color={{ fg: '#58a6ff', bg: '#1c2d4a', border: '#388bfd' }}
            onClick={() => log('SKIPPED')}
          />
          <LogActionButton
            label="Miss"
            icon={<CrossIcon />}
            shortcut="M"
            active={habit.today_state === 'MISSED'}
            color={{ fg: '#f85149', bg: '#3d1c1c', border: '#da3633' }}
            onClick={() => log('MISSED')}
          />
        </div>
      </div>
    </div>
  );
}

// ── Internals ────────────────────────────────────────────────────────────────

interface LogActionButtonProps {
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  active: boolean;
  color: { fg: string; bg: string; border: string };
  onClick: () => void;
}

function LogActionButton({ label, icon, shortcut, active, color, onClick }: LogActionButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -1 }}
      transition={SPRING.snappy}
      title={`${label} (${shortcut} when focused)`}
      aria-label={`Mark as ${label}`}
      aria-pressed={active}
      aria-keyshortcuts={shortcut.toLowerCase()}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5',
        // Mobile: full-width, taller tap target. Tablet+: pill shape.
        'h-10 sm:h-9 px-2.5 sm:px-3 rounded-lg text-xs font-medium',
        'transition-colors duration-150 cursor-pointer border',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40'
      )}
      style={
        active
          ? {
              color: color.fg,
              backgroundColor: color.bg,
              borderColor: `${color.fg}60`,
            }
          : {
              color: '#8b949e',
              backgroundColor: 'transparent',
              borderColor: '#30363d',
            }
      }
    >
      <span className="shrink-0" style={active ? { color: color.fg } : undefined}>
        {icon}
      </span>
      <span>{label}</span>
      {/* Inline kbd hint — visible on tablet+, hidden on mobile (no keyboard). */}
      <kbd
        className={clsx(
          'hidden sm:inline-flex items-center justify-center',
          'h-[14px] min-w-[14px] px-1 ml-0.5 rounded',
          'text-[9px] font-mono leading-none',
          'border border-current/20'
        )}
        style={{
          opacity: active ? 0.7 : 0.45,
          borderColor: active ? `${color.fg}40` : '#30363d',
        }}
        aria-hidden="true"
      >
        {shortcut}
      </kbd>
    </motion.button>
  );
}

function isStreakMilestone(days: number): string | null {
  if (days === 7) return '🔥 1-week streak';
  if (days === 30) return '🏆 30-day streak';
  if (days === 100) return '💯 100 days';
  if (days === 365) return '🎖 365 days';
  return null;
}

function labelFor(state: 'DONE' | 'SKIPPED' | 'MISSED'): string {
  return state === 'DONE' ? 'Logged' : state === 'SKIPPED' ? 'Skipped' : 'Missed';
}

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const SkipIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

const CrossIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
