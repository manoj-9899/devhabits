// src/api/supabase/habits.ts
import { supabase } from '../../lib/supabase';
import { calculateStreakForHabit } from '../../lib/streak';
import type { CreateHabitDto, Habit } from '../../types';

function mapHabit(row: Record<string, unknown>): Habit {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    category: (row.category as string) ?? 'General',
    color: (row.color as string) ?? '#6366f1',
    frequency_type: row.frequency_type as Habit['frequency_type'],
    interval_days: (row.interval_days as number | null) ?? null,
    target_days: Array.isArray(row.target_days) ? (row.target_days as string[]) : [],
    skip_breaks_streak: Boolean(row.skip_breaks_streak),
    archived: Boolean(row.archived),
    sort_order: (row.sort_order as number) ?? 0,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function sbGetAllHabits(withStreak: boolean) {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('archived', false)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  let habits = (data ?? []).map((row) => mapHabit(row as Record<string, unknown>));

  if (withStreak) {
    habits = await Promise.all(
      habits.map(async (h) => ({ ...h, ...(await calculateStreakForHabit(h.id)) }))
    );
  }

  return { habits, count: habits.length };
}

export async function sbGetHabitById(id: string) {
  const { data, error } = await supabase.from('habits').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const habit = mapHabit(data as Record<string, unknown>);
  return { ...habit, ...(await calculateStreakForHabit(id)) };
}

export async function sbCreateHabit(dto: CreateHabitDto) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to create habits.');

  const { data: maxRow } = await supabase
    .from('habits')
    .select('sort_order')
    .eq('archived', false)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = ((maxRow?.sort_order as number | undefined) ?? -1) + 1;

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name: dto.name,
      description: dto.description ?? '',
      category: dto.category ?? 'General',
      color: dto.color ?? '#6366f1',
      frequency_type: dto.frequency_type ?? 'DAILY',
      interval_days: dto.interval_days ?? null,
      target_days: dto.target_days ?? [],
      skip_breaks_streak: dto.skip_breaks_streak ?? false,
      sort_order,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapHabit(data as Record<string, unknown>);
}

export async function sbUpdateHabit(id: string, dto: Partial<CreateHabitDto>) {
  const existing = await sbGetHabitById(id);
  if (!existing) return null;

  const { data, error } = await supabase
    .from('habits')
    .update({
      name: dto.name ?? existing.name,
      description: dto.description ?? existing.description,
      category: dto.category ?? existing.category,
      color: dto.color ?? existing.color,
      frequency_type: dto.frequency_type ?? existing.frequency_type,
      interval_days: dto.interval_days ?? existing.interval_days,
      target_days: dto.target_days ?? existing.target_days,
      skip_breaks_streak: dto.skip_breaks_streak ?? existing.skip_breaks_streak,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapHabit(data as Record<string, unknown>);
}

export async function sbArchiveHabit(id: string) {
  const { data, error } = await supabase
    .from('habits')
    .update({ archived: true })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function sbRestoreHabit(id: string) {
  const { data, error } = await supabase
    .from('habits')
    .update({ archived: false })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}
