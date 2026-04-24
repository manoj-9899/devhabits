// src/routes/habits.js
// ─────────────────────────────────────────────────────────────────────────────
// Routes:
//   GET  /api/habits               → list all active habits
//   POST /api/habits               → create a new habit
//   GET  /api/habits/:id           → get a single habit by ID
//   PUT  /api/habits/:id           → update a habit
//   DELETE /api/habits/:id         → archive a habit (soft delete)
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import * as HabitModel from '../models/Habit.js';
import { calculateStreak } from '../services/streak.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';

const router = Router();

// ── Validation helpers ─────────────────────────────────────────────────────
const VALID_FREQUENCIES = ['DAILY', 'WEEKLY', 'INTERVAL'];
const VALID_COLORS = /^#[0-9A-Fa-f]{6}$/;

function validateHabitBody(body, requireName = true) {
  const { name, frequency_type, interval_days, color } = body;

  if (requireName && (!name || typeof name !== 'string' || !name.trim())) {
    throw createError(400, 'NAME_REQUIRED', 'Habit name is required and must be a non-empty string.');
  }

  if (frequency_type && !VALID_FREQUENCIES.includes(frequency_type)) {
    throw createError(400, 'INVALID_FREQUENCY',
      `frequency_type must be one of: ${VALID_FREQUENCIES.join(', ')}.`);
  }

  if (frequency_type === 'INTERVAL' && (!interval_days || interval_days < 1)) {
    throw createError(400, 'INVALID_INTERVAL',
      'interval_days is required and must be >= 1 when frequency_type is INTERVAL.');
  }

  if (color && !VALID_COLORS.test(color)) {
    throw createError(400, 'INVALID_COLOR', 'color must be a valid 6-digit hex string (e.g. #6366f1).');
  }
}

// ── GET /api/habits ──────────────────────────────────────────────────────────
// Query params:
//   ?category=Coding   → filter by category
//   ?withStreak=true   → attach current_streak and best_streak to each habit
router.get('/', asyncHandler((req, res) => {
  const { category, withStreak } = req.query;

  let habits = category
    ? HabitModel.getHabitsByCategory(category)
    : HabitModel.getAllHabits();

  if (withStreak === 'true') {
    habits = habits.map((h) => ({
      ...h,
      ...calculateStreak(h.id),
    }));
  }

  sendSuccess(res, { habits, count: habits.length });
}));

// ── GET /api/habits/:id ──────────────────────────────────────────────────────
router.get('/:id', asyncHandler((req, res) => {
  const habit = HabitModel.getHabitById(req.params.id);

  if (!habit) {
    return sendError(res, `Habit "${req.params.id}" not found.`, 404, 'NOT_FOUND');
  }

  const streaks = calculateStreak(habit.id);
  sendSuccess(res, { ...habit, ...streaks });
}));

// ── POST /api/habits ─────────────────────────────────────────────────────────
// Body: { name, description?, category?, color?, frequency_type?, interval_days?, target_days? }
router.post('/', asyncHandler((req, res) => {
  validateHabitBody(req.body, true);

  const habit = HabitModel.createHabit(req.body);
  sendSuccess(res, habit, 201);
}));

// ── PUT /api/habits/:id ──────────────────────────────────────────────────────
// Partial updates: only fields provided in the body are changed.
router.put('/:id', asyncHandler((req, res) => {
  validateHabitBody(req.body, false);

  const habit = HabitModel.updateHabit(req.params.id, req.body);

  if (!habit) {
    return sendError(res, `Habit "${req.params.id}" not found.`, 404, 'NOT_FOUND');
  }

  sendSuccess(res, habit);
}));

// ── DELETE /api/habits/:id ───────────────────────────────────────────────────
// Soft delete (archive). All logs are preserved for analytics history.
router.delete('/:id', asyncHandler((req, res) => {
  const archived = HabitModel.archiveHabit(req.params.id);

  if (!archived) {
    return sendError(res, `Habit "${req.params.id}" not found.`, 404, 'NOT_FOUND');
  }

  sendSuccess(res, { message: 'Habit archived successfully.' });
}));

export default router;
