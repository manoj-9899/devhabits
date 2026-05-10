// src/api/analytics.ts
import { api } from './client';
import type { HeatmapDay, HabitHeatmapDay, HabitStats } from '../types';

export const analyticsApi = {
  getHeatmap: (days = 365) =>
    api
      .get<{
        from: string;
        to: string;
        data: HeatmapDay[];
      }>('/analytics/heatmap', { params: { days } })
      .then((r) => r.data),

  getHeatmapByHabit: (days = 90) =>
    api
      .get<{
        from: string;
        to: string;
        data: HabitHeatmapDay[];
      }>('/analytics/heatmap-by-habit', { params: { days } })
      .then((r) => r.data),

  getStats: () => api.get<{ habits: HabitStats[] }>('/analytics/stats').then((r) => r.data),
};
