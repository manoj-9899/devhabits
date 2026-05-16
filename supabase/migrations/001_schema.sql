-- DevHabits — Supabase Postgres schema (multi-user)
-- Run once in: Supabase Dashboard → SQL → New query → Run
-- Requires: Supabase Auth enabled (Email provider is enough for Step 3)

-- ── Habits ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.habits (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name               TEXT        NOT NULL,
  description        TEXT        NOT NULL DEFAULT '',
  category           TEXT        NOT NULL DEFAULT 'General',
  color              TEXT        NOT NULL DEFAULT '#6366f1',
  frequency_type     TEXT        NOT NULL DEFAULT 'DAILY'
                     CHECK (frequency_type IN ('DAILY', 'WEEKLY', 'INTERVAL')),
  interval_days      INTEGER,
  target_days        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  skip_breaks_streak BOOLEAN     NOT NULL DEFAULT false,
  archived           BOOLEAN     NOT NULL DEFAULT false,
  sort_order         INTEGER     NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits (user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_archived ON public.habits (user_id, archived);

-- ── Logs ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id   UUID        NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date       DATE        NOT NULL,
  state      TEXT        NOT NULL CHECK (state IN ('DONE', 'SKIPPED', 'MISSED')),
  source     TEXT        NOT NULL DEFAULT 'WEB'
                     CHECK (source IN ('CLI', 'WEB', 'API', 'VSCODE')),
  metadata   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs (user_id);
CREATE INDEX IF NOT EXISTS idx_logs_habit_date ON public.logs (habit_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_logs_date ON public.logs (date);

-- ── Planned absences (per user) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planned_absences (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE        NOT NULL,
  end_date   DATE        NOT NULL,
  reason     TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_absences_user ON public.planned_absences (user_id);

-- ── Per-user settings (theme, day_boundary, etc.) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key        TEXT        NOT NULL,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

-- ── updated_at trigger for habits ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_habits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS habits_updated_at ON public.habits;
CREATE TRIGGER habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.set_habits_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Habits: users only see/edit their own rows
CREATE POLICY habits_select_own ON public.habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY habits_insert_own ON public.habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY habits_update_own ON public.habits
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY habits_delete_own ON public.habits
  FOR DELETE USING (auth.uid() = user_id);

-- Logs: own rows only
CREATE POLICY logs_select_own ON public.logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY logs_insert_own ON public.logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY logs_update_own ON public.logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY logs_delete_own ON public.logs
  FOR DELETE USING (auth.uid() = user_id);

-- Planned absences
CREATE POLICY absences_select_own ON public.planned_absences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY absences_insert_own ON public.planned_absences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY absences_update_own ON public.planned_absences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY absences_delete_own ON public.planned_absences
  FOR DELETE USING (auth.uid() = user_id);

-- User settings
CREATE POLICY user_settings_select_own ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_settings_insert_own ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_settings_update_own ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_settings_delete_own ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);
