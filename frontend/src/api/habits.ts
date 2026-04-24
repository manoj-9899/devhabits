// src/api/habits.ts
import { api } from './client';
import type { Habit, CreateHabitDto } from '../types';

export const habitsApi = {
  getAll: (withStreak = false) =>
    api.get<{ habits: Habit[]; count: number }>('/habits', { params: { withStreak } })
      .then(r => r.data),

  getById: (id: string) =>
    api.get<Habit>(`/habits/${id}`).then(r => r.data),

  create: (dto: CreateHabitDto) =>
    api.post<Habit>('/habits', dto).then(r => r.data),

  update: (id: string, dto: Partial<CreateHabitDto>) =>
    api.put<Habit>(`/habits/${id}`, dto).then(r => r.data),

  archive: (id: string) =>
    api.delete(`/habits/${id}`).then(r => r.data),
};
