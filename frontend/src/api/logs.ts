// src/api/logs.ts
import { api } from './client';
import { useCloudData } from '../lib/dataMode';
import * as sb from './supabase/logs';
import type { TodayHabit, TodaySummary, Log, CreateLogDto, Habit } from '../types';

export const logsApi = {
  logHabit: async (dto: CreateLogDto) => {
    if (await useCloudData()) return sb.sbLogHabit(dto);
    return api
      .post<{
        log: Log;
        current_streak: number;
        best_streak: number;
        habit_name: string;
      }>('/logs', dto)
      .then((r) => r.data);
  },

  getToday: async (date?: string) => {
    if (await useCloudData()) return sb.sbGetToday(date);
    return api
      .get<{
        date: string;
        habits: TodayHabit[];
        summary: TodaySummary;
      }>('/logs/today', { params: date ? { date } : {} })
      .then((r) => r.data);
  },

  getHabitHistory: async (habitId: string) => {
    if (await useCloudData()) return sb.sbGetHabitHistory(habitId);
    return api
      .get<{
        habit: Habit;
        logs: Log[];
        current_streak: number;
        best_streak: number;
      }>(`/logs/habit/${habitId}`)
      .then((r) => r.data);
  },
};
