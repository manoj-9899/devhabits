-- =============================================================================
-- DevHabits – Local-First SQLite Schema
-- File: internal/db/schema.sql
-- Applied on: `habit init` via connection.go
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PRAGMA CONFIGURATION
-- Must be set on every connection, not just once.
-- These are the foundational settings for a reliable local-first app.
-- -----------------------------------------------------------------------------
PRAGMA journal_mode = WAL;       -- Allow concurrent CLI writes + web reads
PRAGMA foreign_keys = ON;        -- Enforce referential integrity
PRAGMA synchronous = NORMAL;     -- Safe and fast under WAL mode (vs FULL)
PRAGMA cache_size = -16000;      -- Use 16MB page cache for faster reads
PRAGMA temp_store = MEMORY;      -- Keep temp tables in memory, not disk


-- =============================================================================
-- TABLE: habits
-- The canonical source of truth for what a user wants to track.
-- =============================================================================
CREATE TABLE IF NOT EXISTS habits (
    id             TEXT    PRIMARY KEY,                      -- UUID v4, e.g. "550e8400-e29b-41d4-a716-446655440000"
    name           TEXT    NOT NULL,
    description    TEXT    NOT NULL DEFAULT '',
    category       TEXT    NOT NULL DEFAULT 'General',       -- e.g. "Coding", "Health", "Reading"
    color          TEXT    NOT NULL DEFAULT '#6366f1',       -- Hex color for UI heatmap cell

    -- Frequency
    frequency_type TEXT    NOT NULL DEFAULT 'DAILY'
                           CHECK (frequency_type IN ('DAILY', 'WEEKLY', 'INTERVAL')),
    interval_days  INTEGER,                                  -- Only used when frequency_type = 'INTERVAL'
    target_days    TEXT    NOT NULL DEFAULT '[]',            -- JSON array: ["Mon","Wed","Fri"] for WEEKLY

    -- Streak policy
    skip_breaks_streak INTEGER NOT NULL DEFAULT 0,          -- 0 = skip preserves streak (our policy), 1 = skip breaks it

    -- State
    archived       INTEGER NOT NULL DEFAULT 0               -- 0 = active, 1 = archived (soft delete)
                           CHECK (archived IN (0, 1)),
    sort_order     INTEGER NOT NULL DEFAULT 0,              -- For drag-and-drop reordering in the UI

    created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Trigger: auto-update `updated_at` on any row change
CREATE TRIGGER IF NOT EXISTS habits_updated_at
AFTER UPDATE ON habits
FOR EACH ROW
BEGIN
    UPDATE habits SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = OLD.id;
END;


-- =============================================================================
-- TABLE: logs
-- One row per (habit, date, state) event. The event log for all activity.
-- =============================================================================
CREATE TABLE IF NOT EXISTS logs (
    id         TEXT    PRIMARY KEY,                         -- UUID v4
    habit_id   TEXT    NOT NULL REFERENCES habits(id) ON DELETE CASCADE,

    date       TEXT    NOT NULL,                            -- ISO-8601 date: "YYYY-MM-DD"
    state      TEXT    NOT NULL
                       CHECK (state IN ('DONE', 'SKIPPED', 'MISSED')),
    source     TEXT    NOT NULL DEFAULT 'CLI'
                       CHECK (source IN ('CLI', 'WEB', 'API', 'VSCODE')),

    -- Optional metadata: attach git commit hash, coding minutes, notes, etc.
    -- Stored as a JSON string for flexibility without schema migrations.
    -- Example: '{"commit": "a1b2c3", "minutes": 45, "note": "tough session"}'
    metadata   TEXT    NOT NULL DEFAULT '{}',

    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

    -- A habit can only have ONE log entry per day. The UI/CLI should UPDATE
    -- an existing log if the user changes their mind (e.g., done → skipped).
    UNIQUE (habit_id, date)
);


-- =============================================================================
-- TABLE: planned_absences
-- Pre-scheduled date ranges where SKIPPED logs are auto-generated.
-- These dates are excluded from streak calculations entirely.
-- =============================================================================
CREATE TABLE IF NOT EXISTS planned_absences (
    id         TEXT    PRIMARY KEY,                         -- UUID v4
    start_date TEXT    NOT NULL,                            -- "YYYY-MM-DD"
    end_date   TEXT    NOT NULL,                            -- "YYYY-MM-DD"
    reason     TEXT    NOT NULL DEFAULT '',
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

    CHECK (end_date >= start_date)
);


-- =============================================================================
-- TABLE: settings
-- Simple key-value store for user preferences. Avoids needing a separate config file.
-- =============================================================================
CREATE TABLE IF NOT EXISTS settings (
    key        TEXT    PRIMARY KEY,
    value      TEXT    NOT NULL,
    updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Trigger: auto-update `updated_at` for settings
CREATE TRIGGER IF NOT EXISTS settings_updated_at
AFTER UPDATE ON settings
FOR EACH ROW
BEGIN
    UPDATE settings SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE key = OLD.key;
END;

-- Default settings seeded on init
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('theme',           'dark'),
    ('day_boundary',    '04:00'),   -- "Today" extends past midnight until 4am
    ('week_start',      'Mon'),
    ('db_version',      '1');


-- =============================================================================
-- INDEXES
-- Targeted to the exact queries the app will run most frequently.
-- =============================================================================

-- Fast lookup of all active habits (the most common query)
CREATE INDEX IF NOT EXISTS idx_habits_archived
    ON habits (archived);

-- Fast lookup of all habits in a category (sidebar filter)
CREATE INDEX IF NOT EXISTS idx_habits_category
    ON habits (category, archived);

-- The hottest query: "get all logs for a given date" (Today's Inbox view)
CREATE INDEX IF NOT EXISTS idx_logs_date
    ON logs (date);

-- "Get all logs for a specific habit ordered by date" (streak calc + history view)
CREATE INDEX IF NOT EXISTS idx_logs_habit_date
    ON logs (habit_id, date DESC);

-- "Get all logs in a date range" (heatmap endpoint: 365-day aggregation)
CREATE INDEX IF NOT EXISTS idx_logs_date_range
    ON logs (date, state);

-- Planned absences range lookup
CREATE INDEX IF NOT EXISTS idx_absences_range
    ON planned_absences (start_date, end_date);


-- =============================================================================
-- EXAMPLE QUERIES
-- These are the exact queries used in internal/db/queries.go
-- =============================================================================


-- -----------------------------------------------------------------------------
-- QUERY 1: Create a Habit
-- Invoked by: `habit add "DSA Practice" --frequency=daily --category=Coding`
-- -----------------------------------------------------------------------------

/*
INSERT INTO habits (id, name, category, frequency_type, color)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',   -- Generated UUID in Go
    'DSA Practice',
    'Coding',
    'DAILY',
    '#22c55e'                                  -- Green
);
*/


-- -----------------------------------------------------------------------------
-- QUERY 2: Log a Habit (with UPSERT)
-- Invoked by: `habit done "DSA Practice"` or POST /api/logs
-- Using INSERT OR REPLACE (UPSERT) so re-logging today changes the state,
-- not creates a duplicate row. This is critical for local-first correctness.
-- -----------------------------------------------------------------------------

/*
INSERT INTO logs (id, habit_id, date, state, source, metadata)
VALUES (
    'a1b2c3d4-...',
    '550e8400-e29b-41d4-a716-446655440000',
    '2026-04-23',
    'DONE',
    'CLI',
    '{"note": ""}'
)
ON CONFLICT (habit_id, date)
DO UPDATE SET
    state      = excluded.state,
    source     = excluded.source,
    metadata   = excluded.metadata;
*/


-- -----------------------------------------------------------------------------
-- QUERY 3: Get Today's Habits (The "Inbox" view)
-- Returns every active habit with its log state for today.
-- LEFT JOIN ensures habits with no log yet still appear (state = NULL = Pending).
-- -----------------------------------------------------------------------------

/*
SELECT
    h.id,
    h.name,
    h.category,
    h.color,
    h.frequency_type,
    COALESCE(l.state, 'PENDING') AS today_state,
    l.source,
    l.metadata
FROM habits h
LEFT JOIN logs l
    ON l.habit_id = h.id
    AND l.date = '2026-04-23'        -- :today param
WHERE h.archived = 0
ORDER BY
    CASE COALESCE(l.state, 'PENDING')
        WHEN 'PENDING' THEN 0        -- Pending habits float to the top
        WHEN 'DONE'    THEN 1
        WHEN 'SKIPPED' THEN 2
        WHEN 'MISSED'  THEN 3
    END,
    h.sort_order ASC;
*/


-- -----------------------------------------------------------------------------
-- QUERY 4: Calculate Current Streak for a Single Habit
-- Strategy: Walk backwards through DONE logs (excluding SKIPPED and
-- planned absences). Count consecutive days without a gap.
--
-- This is implemented as a recursive CTE (Common Table Expression) for
-- correctness. In the Go code, this is called after every log insertion.
-- -----------------------------------------------------------------------------

/*
WITH RECURSIVE streak AS (
    -- Anchor: Start from the most recent DONE log
    SELECT
        date,
        1 AS streak_count,
        date AS prev_date
    FROM logs
    WHERE habit_id = '550e8400-e29b-41d4-a716-446655440000'
      AND state = 'DONE'
    ORDER BY date DESC
    LIMIT 1

    UNION ALL

    -- Recursion: Walk one day back and check if a DONE log exists for that day,
    -- OR if it's covered by a planned_absence (in which case we bridge the gap).
    SELECT
        l.date,
        s.streak_count + 1,
        l.date
    FROM logs l
    JOIN streak s
        ON l.date = date(s.prev_date, '-1 day')
    WHERE l.habit_id = '550e8400-e29b-41d4-a716-446655440000'
      AND l.state = 'DONE'
)
SELECT MAX(streak_count) AS current_streak FROM streak;
*/


-- -----------------------------------------------------------------------------
-- QUERY 5: Get 365-Day Heatmap Data (GET /api/analytics/heatmap)
-- Returns one row per date in the last 365 days, with the count of
-- habits completed on that day. The frontend maps count -> color intensity.
-- -----------------------------------------------------------------------------

/*
SELECT
    l.date,
    COUNT(CASE WHEN l.state = 'DONE' THEN 1 END)    AS done_count,
    COUNT(CASE WHEN l.state = 'SKIPPED' THEN 1 END) AS skipped_count,
    COUNT(CASE WHEN l.state = 'MISSED' THEN 1 END)  AS missed_count,
    COUNT(*)                                          AS total_logged
FROM logs l
WHERE l.date >= date('now', '-365 days')
  AND l.date <= date('now')
GROUP BY l.date
ORDER BY l.date ASC;
*/


-- -----------------------------------------------------------------------------
-- QUERY 6: Get Per-Habit Stats (used in the Analytics view sidebar cards)
-- Returns current streak, best streak, and completion rate for all habits.
-- -----------------------------------------------------------------------------

/*
SELECT
    h.id,
    h.name,
    h.category,
    h.color,
    COUNT(CASE WHEN l.state = 'DONE' THEN 1 END) AS total_done,
    COUNT(CASE WHEN l.state IN ('DONE', 'MISSED') THEN 1 END) AS total_eligible,
    ROUND(
        100.0 * COUNT(CASE WHEN l.state = 'DONE' THEN 1 END)
              / NULLIF(COUNT(CASE WHEN l.state IN ('DONE', 'MISSED') THEN 1 END), 0),
        1
    ) AS completion_pct
FROM habits h
LEFT JOIN logs l ON l.habit_id = h.id
WHERE h.archived = 0
GROUP BY h.id, h.name, h.category, h.color
ORDER BY completion_pct DESC;
*/
