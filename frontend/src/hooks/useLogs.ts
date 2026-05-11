// src/hooks/useLogs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logsApi } from '../api/index';
import type { CreateLogDto, TodayHabit } from '../types';

export const TODAY_KEY = ['logs', 'today'] as const;
type TodayData = Awaited<ReturnType<typeof logsApi.getToday>>;

export function useToday(date?: string) {
  return useQuery({
    queryKey: [...TODAY_KEY, date],
    queryFn: () => logsApi.getToday(date),
    staleTime: 10_000,
    refetchInterval: 60_000,
  });
}

export function useLogHabit() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateLogDto) => logsApi.logHabit(dto),

    // Optimistic update — UI changes instantly
    onMutate: async (dto) => {
      await qc.cancelQueries({ queryKey: TODAY_KEY });
      const previous = qc.getQueryData(TODAY_KEY);

      qc.setQueryData<TodayData>(TODAY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          habits: old.habits.map((h: TodayHabit) =>
            h.id === dto.habit_id ? { ...h, today_state: dto.state } : h
          ),
        };
      });

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(TODAY_KEY, ctx.previous);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: TODAY_KEY });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
