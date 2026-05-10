// src/hooks/useHabits.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsApi } from '../api/index';
import type { CreateHabitDto } from '../types';

export const HABITS_KEY = ['habits'] as const;

export function useHabits(withStreak = false) {
  return useQuery({
    queryKey: [...HABITS_KEY, { withStreak }],
    queryFn: () => habitsApi.getAll(withStreak),
    staleTime: 30_000,
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateHabitDto) => habitsApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useArchiveHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => habitsApi.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useRestoreHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => habitsApi.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}
