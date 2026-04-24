// src/api/analytics.ts
import { api } from './client';
import type { HeatmapDay, HabitStats } from '../types';

export const analyticsApi = {
  getHeatmap: (days = 365) =>
    api
      .get<{
        from: string;
        to: string;
        data: HeatmapDay[];
      }>('/analytics/heatmap', { params: { days } })
      .then((r) => r.data),

  getStats: () => api.get<{ habits: HabitStats[] }>('/analytics/stats').then((r) => r.data),
};
