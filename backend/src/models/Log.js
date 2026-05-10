// src/models/Log.js
// ─────────────────────────────────────────────────────────────────────────────
// Data access layer for the `logs` table.
// All queries use positional ? params (node:sqlite StatementSync requirement).
// ─────────────────────────────────────────────────────────────────────────────
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';

// ── Prepared statements ────────────────────────────────────────────────────

const upsertLog = db.prepare(`
  INSERT INTO logs (id, habit_id, date, state, source, metadata)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT (habit_id, date)
  DO UPDATE SET
    state    = excluded.state,
    source   = excluded.source,
    metadata = excluded.metadata
`);

const findOne = db.prepare(`
  SELECT * FROM logs WHERE habit_id = ? AND date = ?
`);

const findTodayWithHabits = db.prepare(`
  SELECT
    h.id,
    h.name,
    h.category,
    h.color,
    h.frequency_type,
    h.sort_order,
    h.skip_breaks_streak,
    COALESCE(l.state, 'PENDING') AS today_state,
    l.source                     AS log_source,
    l.metadata                   AS log_metadata,
    l.created_at                 AS logged_at
  FROM habits h
  LEFT JOIN logs l
    ON  l.habit_id = h.id
    AND l.date     = ?
  WHERE h.archived = 0
  ORDER BY
    CASE COALESCE(l.state, 'PENDING')
      WHEN 'PENDING' THEN 0
      WHEN 'DONE'    THEN 1
      WHEN 'SKIPPED' THEN 2
      WHEN 'MISSED'  THEN 3
    END,
    h.sort_order ASC
`);

const findByHabit = db.prepare(`
  SELECT * FROM logs WHERE habit_id = ? ORDER BY date DESC
`);

const heatmapQuery = db.prepare(`
  SELECT
    date,
    COUNT(CASE WHEN state = 'DONE'    THEN 1 END) AS done_count,
    COUNT(CASE WHEN state = 'SKIPPED' THEN 1 END) AS skipped_count,
    COUNT(CASE WHEN state = 'MISSED'  THEN 1 END) AS missed_count,
    COUNT(*)                                        AS total_logged
  FROM logs
  WHERE date >= ? AND date <= ?
  GROUP BY date
  ORDER BY date ASC
`);

const heatmapByHabitQuery = db.prepare(`
  SELECT
    l.habit_id,
    l.date,
    COUNT(CASE WHEN l.state = 'DONE'   THEN 1 END) AS done_count,
    COUNT(CASE WHEN l.state = 'MISSED' THEN 1 END) AS missed_count
  FROM logs l
  INNER JOIN habits h ON h.id = l.habit_id
  WHERE l.date >= ? AND l.date <= ? AND h.archived = 0
  GROUP BY l.habit_id, l.date
  ORDER BY l.habit_id ASC, l.date ASC
`);

const statsAllHabits = db.prepare(`
  SELECT
    h.id,
    h.name,
    h.category,
    h.color,
    COUNT(CASE WHEN l.state = 'DONE' THEN 1 END)                    AS total_done,
    COUNT(CASE WHEN l.state IN ('DONE', 'MISSED') THEN 1 END)       AS total_eligible,
    ROUND(
      100.0 * COUNT(CASE WHEN l.state = 'DONE' THEN 1 END)
            / NULLIF(COUNT(CASE WHEN l.state IN ('DONE', 'MISSED') THEN 1 END), 0),
      1
    ) AS completion_pct
  FROM habits h
  LEFT JOIN logs l ON l.habit_id = h.id
  WHERE h.archived = 0
  GROUP BY h.id, h.name, h.category, h.color
  ORDER BY completion_pct DESC
`);

// ── Public model functions ─────────────────────────────────────────────────

/**
 * Upserts a log entry for (habit_id, date). Last write wins.
 */
export function upsertLogEntry(data) {
  upsertLog.run(
    uuidv4(),
    data.habit_id,
    data.date,
    data.state,
    data.source ?? 'API',
    JSON.stringify(data.metadata ?? {})
  );
  return deserialize(findOne.get(data.habit_id, data.date));
}

/**
 * Returns every active habit with today's log state.
 * PENDING = no log exists yet.
 */
export function getTodayHabits(date) {
  return findTodayWithHabits.all(date).map((row) => ({
    ...row,
    log_metadata: row.log_metadata ? JSON.parse(row.log_metadata) : {},
    skip_breaks_streak: Boolean(row.skip_breaks_streak),
  }));
}

/**
 * Full log history for one habit, newest first.
 */
export function getLogsByHabit(habitId) {
  return findByHabit.all(habitId).map(deserialize);
}

/**
 * Aggregated daily heatmap data between two dates.
 */
export function getHeatmapData(from, to) {
  return heatmapQuery.all(from, to);
}

/**
 * Per-habit daily heatmap data between two dates.
 * Returns rows already grouped by (habit_id, date).
 */
export function getHeatmapByHabit(from, to) {
  return heatmapByHabitQuery.all(from, to);
}

/**
 * Completion stats for all active habits (without streaks — added in route).
 */
export function getAllHabitStats() {
  return statsAllHabits.all();
}

// ── Internal ───────────────────────────────────────────────────────────────
function deserialize(row) {
  if (!row) return null;
  return { ...row, metadata: JSON.parse(row.metadata || '{}') };
}
