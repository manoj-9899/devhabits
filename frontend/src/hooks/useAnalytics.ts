// src/hooks/useAnalytics.ts
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/index';

export function useHeatmap(days = 365) {
  return useQuery({
    queryKey: ['analytics', 'heatmap', days],
    queryFn: () => analyticsApi.getHeatmap(days),
    staleTime: 60_000,
  });
}

export function useHeatmapByHabit(days = 90) {
  return useQuery({
    queryKey: ['analytics', 'heatmap-by-habit', days],
    queryFn: () => analyticsApi.getHeatmapByHabit(days),
    staleTime: 60_000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['analytics', 'stats'],
    queryFn: () => analyticsApi.getStats(),
    staleTime: 30_000,
  });
}
