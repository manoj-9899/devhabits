// src/api/logs.ts
import { api } from './client';
import type { TodayHabit, TodaySummary, Log, CreateLogDto, Habit } from '../types';

export const logsApi = {
  logHabit: (dto: CreateLogDto) =>
    api.post<{ log: Log; current_streak: number; best_streak: number; habit_name: string }>(
      '/logs', dto
    ).then(r => r.data),

  getToday: (date?: string) =>
    api.get<{ date: string; habits: TodayHabit[]; summary: TodaySummary }>(
      '/logs/today', { params: date ? { date } : {} }
    ).then(r => r.data),

  getHabitHistory: (habitId: string) =>
    api.get<{ habit: Habit; logs: Log[]; current_streak: number; best_streak: number }>(
      `/logs/habit/${habitId}`
    ).then(r => r.data),
};
