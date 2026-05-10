// src/models/Habit.js
// ─────────────────────────────────────────────────────────────────────────────
// Data access layer for the `habits` table.
// Uses node:sqlite StatementSync — synchronous, no async overhead.
// node:sqlite uses positional `?` params only (no @named params).
// ─────────────────────────────────────────────────────────────────────────────
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';

// ── Prepared statements ────────────────────────────────────────────────────
const findAll = db.prepare(`
  SELECT * FROM habits WHERE archived = 0 ORDER BY sort_order ASC, created_at ASC
`);

const findById = db.prepare(`SELECT * FROM habits WHERE id = ?`);

const findByCategory = db.prepare(`
  SELECT * FROM habits WHERE archived = 0 AND category = ? ORDER BY sort_order ASC
`);

const maxSortOrder = db.prepare(`
  SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM habits WHERE archived = 0
`);

const insertHabit = db.prepare(`
  INSERT INTO habits
    (id, name, description, category, color,
     frequency_type, interval_days, target_days,
     skip_breaks_streak, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateHabitStmt = db.prepare(`
  UPDATE habits SET
    name               = ?,
    description        = ?,
    category           = ?,
    color              = ?,
    frequency_type     = ?,
    interval_days      = ?,
    target_days        = ?,
    skip_breaks_streak = ?,
    sort_order         = ?
  WHERE id = ?
`);

const archiveHabitStmt = db.prepare(`UPDATE habits SET archived = 1 WHERE id = ?`);

const unarchiveHabitStmt = db.prepare(`UPDATE habits SET archived = 0 WHERE id = ?`);

// ── Public model functions ─────────────────────────────────────────────────

export function getAllHabits() {
  return findAll.all().map(deserialize);
}

export function getHabitById(id) {
  const row = findById.get(id);
  return row ? deserialize(row) : null;
}

export function getHabitsByCategory(category) {
  return findByCategory.all(category).map(deserialize);
}

export function createHabit(data) {
  const { max_order } = maxSortOrder.get();

  const id = uuidv4();
  insertHabit.run(
    id,
    data.name,
    data.description ?? '',
    data.category ?? 'General',
    data.color ?? '#6366f1',
    data.frequency_type ?? 'DAILY',
    data.interval_days ?? null,
    JSON.stringify(data.target_days ?? []),
    data.skip_breaks_streak ? 1 : 0,
    max_order + 1
  );

  return deserialize(findById.get(id));
}

export function updateHabit(id, data) {
  const existing = findById.get(id);
  if (!existing) return null;

  updateHabitStmt.run(
    data.name ?? existing.name,
    data.description ?? existing.description,
    data.category ?? existing.category,
    data.color ?? existing.color,
    data.frequency_type ?? existing.frequency_type,
    data.interval_days ?? existing.interval_days,
    JSON.stringify(data.target_days ?? JSON.parse(existing.target_days)),
    data.skip_breaks_streak !== undefined
      ? data.skip_breaks_streak
        ? 1
        : 0
      : existing.skip_breaks_streak,
    data.sort_order ?? existing.sort_order,
    id
  );

  return deserialize(findById.get(id));
}

export function archiveHabit(id) {
  const result = archiveHabitStmt.run(id);
  return result.changes > 0;
}

/** Restore an archived habit (soft-delete undo). */
export function unarchiveHabit(id) {
  const result = unarchiveHabitStmt.run(id);
  return result.changes > 0;
}

// ── Internal ───────────────────────────────────────────────────────────────
function deserialize(row) {
  return {
    ...row,
    target_days: JSON.parse(row.target_days || '[]'),
    skip_breaks_streak: Boolean(row.skip_breaks_streak),
    archived: Boolean(row.archived),
  };
}
