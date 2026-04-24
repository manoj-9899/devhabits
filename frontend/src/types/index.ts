// src/types/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// All shared TypeScript interfaces — single source of truth matching the API
// ─────────────────────────────────────────────────────────────────────────────

export type FrequencyType = 'DAILY' | 'WEEKLY' | 'INTERVAL';
export type LogState = 'DONE' | 'SKIPPED' | 'MISSED' | 'PENDING';
export type LogSource = 'CLI' | 'WEB' | 'API' | 'VSCODE';

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  frequency_type: FrequencyType;
  interval_days: number | null;
  target_days: string[];
  skip_breaks_streak: boolean;
  archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Optionally attached by GET /api/habits?withStreak=true
  current_streak?: number;
  best_streak?: number;
}

export interface Log {
  id: string;
  habit_id: string;
  date: string;
  state: LogState;
  source: LogSource;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TodayHabit {
  id: string;
  name: string;
  category: string;
  color: string;
  frequency_type: FrequencyType;
  sort_order: number;
  skip_breaks_streak: boolean;
  today_state: LogState;
  log_source: LogSource | null;
  log_metadata: Record<string, unknown>;
  logged_at: string | null;
}

export interface TodaySummary {
  total: number;
  pending: number;
  done: number;
  skipped: number;
  missed: number;
  completion_pct: number;
}

export interface HeatmapDay {
  date: string;
  done_count: number;
  skipped_count: number;
  missed_count: number;
  total_logged: number;
}

export interface HabitStats {
  id: string;
  name: string;
  category: string;
  color: string;
  total_done: number;
  total_eligible: number;
  completion_pct: number;
  current_streak: number;
  best_streak: number;
}

// API response envelopes
export interface ApiSuccess<T> {
  status: 'success';
  data: T;
}
export interface ApiError {
  status: 'error';
  error: { code: string; message: string };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface CreateHabitDto {
  name: string;
  description?: string;
  category?: string;
  color?: string;
  frequency_type?: FrequencyType;
  interval_days?: number;
  target_days?: string[];
}

export interface CreateLogDto {
  habit_id: string;
  state: 'DONE' | 'SKIPPED' | 'MISSED';
  date?: string;
  source?: LogSource;
  metadata?: Record<string, unknown>;
}
