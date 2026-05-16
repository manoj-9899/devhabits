// src/api/analytics.ts
import { api } from './client';
import { useCloudData } from '../lib/dataMode';
import * as sb from './supabase/analytics';
import type { HeatmapDay, HabitHeatmapDay, HabitStats } from '../types';

export const analyticsApi = {
  getHeatmap: async (days = 365) => {
    if (await useCloudData()) return sb.sbGetHeatmap(days);
    return api
      .get<{ from: string; to: string; data: HeatmapDay[] }>('/analytics/heatmap', {
        params: { days },
      })
      .then((r) => r.data);
  },

  getHeatmapByHabit: async (days = 90) => {
    if (await useCloudData()) return sb.sbGetHeatmapByHabit(days);
    return api
      .get<{ from: string; to: string; data: HabitHeatmapDay[] }>('/analytics/heatmap-by-habit', {
        params: { days },
      })
      .then((r) => r.data);
  },

  getStats: async () => {
    if (await useCloudData()) return sb.sbGetStats();
    return api.get<{ habits: HabitStats[] }>('/analytics/stats').then((r) => r.data);
  },
};
