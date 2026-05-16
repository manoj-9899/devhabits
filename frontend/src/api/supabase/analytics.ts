// src/api/supabase/analytics.ts
import { supabase } from '../../lib/supabase';
import { dateRangeFromDays } from '../../lib/date';
import { calculateStreakForHabit } from '../../lib/streak';
import { sbGetAllHabits } from './habits';
import type { HeatmapDay, HabitHeatmapDay, HabitStats } from '../../types';

export async function sbGetHeatmap(days = 365) {
  const { from, to } = dateRangeFromDays(days);

  const { data, error } = await supabase
    .from('logs')
    .select('date, state')
    .gte('date', from)
    .lte('date', to);

  if (error) throw new Error(error.message);

  const byDate = new Map<string, HeatmapDay>();

  for (const row of data ?? []) {
    const date = row.date as string;
    const state = row.state as string;
    const entry = byDate.get(date) ?? {
      date,
      done_count: 0,
      skipped_count: 0,
      missed_count: 0,
      total_logged: 0,
    };
    if (state === 'DONE') entry.done_count++;
    if (state === 'SKIPPED') entry.skipped_count++;
    if (state === 'MISSED') entry.missed_count++;
    entry.total_logged++;
    byDate.set(date, entry);
  }

  return { from, to, data: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)) };
}

export async function sbGetHeatmapByHabit(days = 90) {
  const { from, to } = dateRangeFromDays(days);
  const activeIds = new Set((await sbGetAllHabits(false)).habits.map((h) => h.id));

  const { data, error } = await supabase
    .from('logs')
    .select('habit_id, date, state')
    .gte('date', from)
    .lte('date', to);

  if (error) throw new Error(error.message);

  const rows: HabitHeatmapDay[] = [];
  for (const row of data ?? []) {
    const habit_id = row.habit_id as string;
    if (!activeIds.has(habit_id)) continue;
    rows.push({
      habit_id,
      date: row.date as string,
      done_count: row.state === 'DONE' ? 1 : 0,
      missed_count: row.state === 'MISSED' ? 1 : 0,
    });
  }

  return { from, to, data: rows };
}

export async function sbGetStats() {
  const { habits } = await sbGetAllHabits(false);

  const { data: logs, error } = await supabase.from('logs').select('habit_id, state');
  if (error) throw new Error(error.message);

  const stats: HabitStats[] = await Promise.all(
    habits.map(async (h) => {
      const habitLogs = (logs ?? []).filter((l) => l.habit_id === h.id);
      const total_done = habitLogs.filter((l) => l.state === 'DONE').length;
      const total_eligible = habitLogs.filter((l) =>
        ['DONE', 'MISSED'].includes(l.state as string)
      ).length;
      const completion_pct =
        total_eligible > 0 ? Math.round((1000 * total_done) / total_eligible) / 10 : 0;
      const streaks = await calculateStreakForHabit(h.id);
      return {
        id: h.id,
        name: h.name,
        category: h.category,
        color: h.color,
        total_done,
        total_eligible,
        completion_pct,
        ...streaks,
      };
    })
  );

  return { habits: stats.sort((a, b) => b.completion_pct - a.completion_pct) };
}
