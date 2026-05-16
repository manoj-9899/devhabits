// src/lib/streak.ts — streak logic (matches backend/src/services/streak.js)
import { supabase } from './supabase';
import { getToday, subtractDays, daysBetween } from './date';

type LogRow = { date: string; state: string };

function buildAbsenceSet(
  absences: { start_date: string; end_date: string }[]
): Set<string> {
  const set = new Set<string>();
  for (const { start_date, end_date } of absences) {
    let current = new Date(start_date);
    const end = new Date(end_date);
    while (current <= end) {
      set.add(current.toISOString().split('T')[0]!);
      current.setDate(current.getDate() + 1);
    }
  }
  return set;
}

export function calculateStreakFromLogs(
  logs: LogRow[],
  absenceDates: Set<string>
): { current_streak: number; best_streak: number } {
  if (logs.length === 0) return { current_streak: 0, best_streak: 0 };

  const logMap = new Map(logs.map((l) => [l.date, l.state]));
  const today = getToday();

  let currentStreak = 0;
  let cursor = today;
  let streakStarted = false;

  for (let i = 0; i <= 365; i++) {
    const state = logMap.get(cursor);
    const isAbsence = absenceDates.has(cursor);

    if (state === 'DONE') {
      streakStarted = true;
      currentStreak++;
    } else if (state === 'SKIPPED' || isAbsence) {
      if (!streakStarted && i === 0) {
        cursor = subtractDays(cursor, 1);
        continue;
      }
    } else {
      if (streakStarted) break;
      if (i === 0) {
        cursor = subtractDays(cursor, 1);
        continue;
      }
      break;
    }
    cursor = subtractDays(cursor, 1);
  }

  const logsAsc = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  let bestStreak = 0;
  let runStreak = 0;

  for (let i = 0; i < logsAsc.length; i++) {
    const { date, state } = logsAsc[i];
    if (state === 'DONE') {
      if (i === 0) {
        runStreak = 1;
      } else {
        const prevDone = [...logsAsc.slice(0, i)].reverse().find((l) => l.state === 'DONE');
        if (!prevDone) {
          runStreak = 1;
        } else {
          const dayDiff = daysBetween(prevDone.date, date);
          const skippedBetween = logsAsc
            .slice(0, i)
            .filter(
              (l) =>
                l.date > prevDone.date &&
                l.date < date &&
                (l.state === 'SKIPPED' || absenceDates.has(l.date))
            ).length;
          runStreak = dayDiff - skippedBetween === 1 ? runStreak + 1 : 1;
        }
      }
      if (runStreak > bestStreak) bestStreak = runStreak;
    } else if (state === 'MISSED') {
      runStreak = 0;
    }
  }

  if (currentStreak > bestStreak) bestStreak = currentStreak;
  return { current_streak: currentStreak, best_streak: bestStreak };
}

export async function calculateStreakForHabit(habitId: string) {
  const [logsRes, absencesRes] = await Promise.all([
    supabase.from('logs').select('date, state').eq('habit_id', habitId).order('date', { ascending: false }),
    supabase.from('planned_absences').select('start_date, end_date'),
  ]);

  if (logsRes.error) throw new Error(logsRes.error.message);
  if (absencesRes.error) throw new Error(absencesRes.error.message);

  const absenceDates = buildAbsenceSet(absencesRes.data ?? []);
  return calculateStreakFromLogs(logsRes.data ?? [], absenceDates);
}
