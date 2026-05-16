// src/api/habits.ts
import { api } from './client';
import { useCloudData } from '../lib/dataMode';
import * as sb from './supabase/habits';
import type { Habit, CreateHabitDto } from '../types';

export const habitsApi = {
  getAll: async (withStreak = false) => {
    if (await useCloudData()) return sb.sbGetAllHabits(withStreak);
    return api
      .get<{ habits: Habit[]; count: number }>('/habits', { params: { withStreak } })
      .then((r) => r.data);
  },

  getById: async (id: string) => {
    if (await useCloudData()) {
      const habit = await sb.sbGetHabitById(id);
      if (!habit) throw new Error(`Habit "${id}" not found.`);
      return habit;
    }
    return api.get<Habit>(`/habits/${id}`).then((r) => r.data);
  },

  create: async (dto: CreateHabitDto) => {
    if (await useCloudData()) return sb.sbCreateHabit(dto);
    return api.post<Habit>('/habits', dto).then((r) => r.data);
  },

  update: async (id: string, dto: Partial<CreateHabitDto>) => {
    if (await useCloudData()) {
      const habit = await sb.sbUpdateHabit(id, dto);
      if (!habit) throw new Error(`Habit "${id}" not found.`);
      return habit;
    }
    return api.put<Habit>(`/habits/${id}`, dto).then((r) => r.data);
  },

  archive: async (id: string) => {
    if (await useCloudData()) return sb.sbArchiveHabit(id);
    return api.delete(`/habits/${id}`).then((r) => r.data);
  },

  restore: async (id: string) => {
    if (await useCloudData()) return sb.sbRestoreHabit(id);
    return api.post(`/habits/${id}/restore`).then((r) => r.data);
  },
};
