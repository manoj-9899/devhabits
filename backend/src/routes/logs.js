// src/routes/logs.js
// ─────────────────────────────────────────────────────────────────────────────
// Routes:
//   POST /api/logs                   → log a habit (Done/Skip/Miss) — UPSERT
//   GET  /api/logs/today             → get all habits with today's state
//   GET  /api/logs/habit/:habitId    → get full history for one habit
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import { upsertLogEntry, getTodayHabits, getLogsByHabit } from '../models/Log.js';
import { getHabitById } from '../models/Habit.js';
import { calculateStreak } from '../services/streak.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { getToday, validateDate } from '../utils/date.js';

const router = Router();

// ── Validation ─────────────────────────────────────────────────────────────
const VALID_STATES  = ['DONE', 'SKIPPED', 'MISSED'];
const VALID_SOURCES = ['CLI', 'WEB', 'API', 'VSCODE'];

// ── POST /api/logs ────────────────────────────────────────────────────────────
// The primary write endpoint. Called by the web UI, CLI, and external scripts.
//
// Body: {
//   habit_id: string,           (required)
//   state: "DONE"|"SKIPPED"|"MISSED",  (required)
//   date?: "YYYY-MM-DD",        (default: today with boundary logic)
//   source?: "CLI"|"WEB"|"API"|"VSCODE",
//   metadata?: { note?, commit?, minutes? }
// }
//
// Response includes recalculated streak so the UI can update instantly.
router.post('/', asyncHandler((req, res) => {
  const { habit_id, state, date, source, metadata } = req.body;

  // ── Validate input ────────────────────────────────────────────────────────
  if (!habit_id || typeof habit_id !== 'string') {
    throw createError(400, 'HABIT_ID_REQUIRED', 'habit_id is required.');
  }

  if (!state || !VALID_STATES.includes(state)) {
    throw createError(400, 'INVALID_STATE',
      `state must be one of: ${VALID_STATES.join(', ')}.`);
  }

  if (source && !VALID_SOURCES.includes(source)) {
    throw createError(400, 'INVALID_SOURCE',
      `source must be one of: ${VALID_SOURCES.join(', ')}.`);
  }

  // Resolve and validate date
  const logDate = date ? validateDate(date) : getToday();

  // Don't allow logging future dates
  if (logDate > getToday()) {
    throw createError(400, 'FUTURE_DATE', 'Cannot log habits for future dates.');
  }

  // Verify habit exists
  const habit = getHabitById(habit_id);
  if (!habit) {
    return sendError(res, `Habit "${habit_id}" not found.`, 404, 'NOT_FOUND');
  }

  // ── Write the log ─────────────────────────────────────────────────────────
  const log = upsertLogEntry({
    habit_id,
    date:     logDate,
    state,
    source:   source   ?? 'API',
    metadata: metadata ?? {},
  });

  // Recalculate streak after every write — it's cheap enough
  const streaks = calculateStreak(habit_id);

  sendSuccess(res, {
    log,
    ...streaks,
    habit_name: habit.name,
  }, 201);
}));

// ── GET /api/logs/today ───────────────────────────────────────────────────────
// Returns every active habit with its log state for today.
// This is the primary data feed for the "Today Inbox" page.
//
// Query params:
//   ?date=YYYY-MM-DD  → override the date (for retroactive editing)
router.get('/today', asyncHandler((req, res) => {
  const date = req.query.date ? validateDate(req.query.date) : getToday();
  const habits = getTodayHabits(date);

  const pending = habits.filter((h) => h.today_state === 'PENDING').length;
  const done    = habits.filter((h) => h.today_state === 'DONE').length;

  sendSuccess(res, {
    date,
    habits,
    summary: {
      total:   habits.length,
      pending,
      done,
      skipped: habits.filter((h) => h.today_state === 'SKIPPED').length,
      missed:  habits.filter((h) => h.today_state === 'MISSED').length,
      completion_pct: habits.length > 0
        ? Math.round((done / habits.length) * 100)
        : 0,
    },
  });
}));

// ── GET /api/logs/habit/:habitId ──────────────────────────────────────────────
// Returns the complete log history for one habit.
// Used by the "History" drawer/view in the UI.
router.get('/habit/:habitId', asyncHandler((req, res) => {
  const habit = getHabitById(req.params.habitId);

  if (!habit) {
    return sendError(res, `Habit "${req.params.habitId}" not found.`, 404, 'NOT_FOUND');
  }

  const logs    = getLogsByHabit(req.params.habitId);
  const streaks = calculateStreak(req.params.habitId);

  sendSuccess(res, { habit, logs, ...streaks });
}));

export default router;
