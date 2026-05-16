// src/api/supabase/logs.ts
import { supabase } from '../../lib/supabase';
import { getToday } from '../../lib/date';
import { calculateStreakForHabit } from '../../lib/streak';
import { sbGetHabitById, sbGetAllHabits } from './habits';
import type { CreateLogDto, Habit, Log, LogState, TodayHabit, TodaySummary } from '../../types';

function mapLog(row: Record<string, unknown>): Log {
  return {
    id: row.id as string,
    habit_id: row.habit_id as string,
    date: row.date as string,
    state: row.state as Log['state'],
    source: row.source as Log['source'],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
  };
}

export async function sbLogHabit(dto: CreateLogDto) {
  const logDate = dto.date ?? getToday();
  if (logDate > getToday()) throw new Error('Cannot log habits for future dates.');

  const habit = await sbGetHabitById(dto.habit_id);
  if (!habit) throw new Error(`Habit "${dto.habit_id}" not found.`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to log habits.');

  const { data, error } = await supabase
    .from('logs')
    .upsert(
      {
        user_id: user.id,
        habit_id: dto.habit_id,
        date: logDate,
        state: dto.state,
        source: dto.source ?? 'WEB',
        metadata: dto.metadata ?? {},
      },
      { onConflict: 'habit_id,date' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);

  const streaks = await calculateStreakForHabit(dto.habit_id);
  return {
    log: mapLog(data as Record<string, unknown>),
    ...streaks,
    habit_name: habit.name,
  };
}

export async function sbGetToday(date?: string) {
  const logDate = date ?? getToday();
  const { habits } = await sbGetAllHabits(false);

  const { data: logs, error } = await supabase.from('logs').select('*').eq('date', logDate);
  if (error) throw new Error(error.message);

  const logByHabit = new Map((logs ?? []).map((l) => [l.habit_id as string, l]));

  const todayHabits: TodayHabit[] = habits.map((h) => {
    const log = logByHabit.get(h.id);
    return {
      id: h.id,
      name: h.name,
      category: h.category,
      color: h.color,
      frequency_type: h.frequency_type,
      sort_order: h.sort_order,
      skip_breaks_streak: h.skip_breaks_streak,
      today_state: (log?.state as LogState | undefined) ?? 'PENDING',
      log_source: (log?.source as TodayHabit['log_source']) ?? null,
      log_metadata: (log?.metadata as Record<string, unknown>) ?? {},
      logged_at: (log?.created_at as string) ?? null,
    };
  });

  const pending = todayHabits.filter((h) => h.today_state === 'PENDING').length;
  const done = todayHabits.filter((h) => h.today_state === 'DONE').length;

  const summary: TodaySummary = {
    total: todayHabits.length,
    pending,
    done,
    skipped: todayHabits.filter((h) => h.today_state === 'SKIPPED').length,
    missed: todayHabits.filter((h) => h.today_state === 'MISSED').length,
    completion_pct: todayHabits.length > 0 ? Math.round((done / todayHabits.length) * 100) : 0,
  };

  return { date: logDate, habits: todayHabits, summary };
}

export async function sbGetHabitHistory(habitId: string) {
  const habit = await sbGetHabitById(habitId);
  if (!habit) throw new Error(`Habit "${habitId}" not found.`);

  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('habit_id', habitId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);

  const streaks = await calculateStreakForHabit(habitId);
  return {
    habit: habit as Habit,
    logs: (data ?? []).map((row) => mapLog(row as Record<string, unknown>)),
    ...streaks,
  };
}
