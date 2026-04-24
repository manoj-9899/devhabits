// src/db/migrate.js
// ─────────────────────────────────────────────────────────────────────────────
// Idempotent schema migration.
// Uses db.exec() to run the full DDL in one shot.
// Safe to call on every startup — all statements use IF NOT EXISTS / OR IGNORE.
// ─────────────────────────────────────────────────────────────────────────────
import db from './connection.js';

const schema = `
  CREATE TABLE IF NOT EXISTS habits (
    id                 TEXT    PRIMARY KEY,
    name               TEXT    NOT NULL,
    description        TEXT    NOT NULL DEFAULT '',
    category           TEXT    NOT NULL DEFAULT 'General',
    color              TEXT    NOT NULL DEFAULT '#6366f1',
    frequency_type     TEXT    NOT NULL DEFAULT 'DAILY'
                               CHECK (frequency_type IN ('DAILY', 'WEEKLY', 'INTERVAL')),
    interval_days      INTEGER,
    target_days        TEXT    NOT NULL DEFAULT '[]',
    skip_breaks_streak INTEGER NOT NULL DEFAULT 0,
    archived           INTEGER NOT NULL DEFAULT 0
                               CHECK (archived IN (0, 1)),
    sort_order         INTEGER NOT NULL DEFAULT 0,
    created_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TRIGGER IF NOT EXISTS habits_updated_at
  AFTER UPDATE ON habits FOR EACH ROW
  BEGIN
    UPDATE habits SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = OLD.id;
  END;

  CREATE TABLE IF NOT EXISTS logs (
    id         TEXT    PRIMARY KEY,
    habit_id   TEXT    NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date       TEXT    NOT NULL,
    state      TEXT    NOT NULL CHECK (state IN ('DONE', 'SKIPPED', 'MISSED')),
    source     TEXT    NOT NULL DEFAULT 'API'
                       CHECK (source IN ('CLI', 'WEB', 'API', 'VSCODE')),
    metadata   TEXT    NOT NULL DEFAULT '{}',
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (habit_id, date)
  );

  CREATE TABLE IF NOT EXISTS planned_absences (
    id         TEXT    PRIMARY KEY,
    start_date TEXT    NOT NULL,
    end_date   TEXT    NOT NULL,
    reason     TEXT    NOT NULL DEFAULT '',
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK (end_date >= start_date)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key        TEXT    PRIMARY KEY,
    value      TEXT    NOT NULL,
    updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TRIGGER IF NOT EXISTS settings_updated_at
  AFTER UPDATE ON settings FOR EACH ROW
  BEGIN
    UPDATE settings SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE key = OLD.key;
  END;

  CREATE INDEX IF NOT EXISTS idx_habits_archived   ON habits (archived);
  CREATE INDEX IF NOT EXISTS idx_habits_category   ON habits (category, archived);
  CREATE INDEX IF NOT EXISTS idx_logs_date         ON logs (date);
  CREATE INDEX IF NOT EXISTS idx_logs_habit_date   ON logs (habit_id, date DESC);
  CREATE INDEX IF NOT EXISTS idx_logs_date_range   ON logs (date, state);
  CREATE INDEX IF NOT EXISTS idx_absences_range    ON planned_absences (start_date, end_date);

  INSERT OR IGNORE INTO settings (key, value) VALUES
    ('theme',        'dark'),
    ('day_boundary', '04:00'),
    ('week_start',   'Mon'),
    ('db_version',   '1');
`;

try {
  db.exec(schema);
  if (!process.env.CLI_MODE) {
    console.log('[db] Schema applied successfully.');
  }
} catch (err) {
  console.error('[db] Migration failed:', err.message);
  process.exit(1);
}

export default db;
