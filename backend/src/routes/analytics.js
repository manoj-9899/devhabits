// src/routes/analytics.js
// ─────────────────────────────────────────────────────────────────────────────
// Routes:
//   GET /api/analytics/heatmap            → aggregated daily activity across all habits
//   GET /api/analytics/heatmap-by-habit   → per-habit per-day activity (for mini heatmaps)
//   GET /api/analytics/stats              → per-habit stats (streak, completion %)
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import * as LogModel from '../models/Log.js';
import { calculateStreak } from '../services/streak.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { validateDate } from '../utils/date.js';

const router = Router();

// ── GET /api/analytics/heatmap ────────────────────────────────────────────────
// Returns one row per active date in the last N days (default: 365).
// The frontend maps done_count → heatmap cell color intensity.
//
// Query params:
//   ?days=365     → number of days to look back (1–730)
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD → explicit date range (overrides ?days)
router.get(
  '/heatmap',
  asyncHandler((req, res) => {
    let from, to;

    if (req.query.from && req.query.to) {
      from = validateDate(req.query.from);
      to = validateDate(req.query.to);

      if (from > to) {
        throw createError(400, 'INVALID_DATE_RANGE', '"from" must be before "to".');
      }
    } else {
      const days = parseInt(req.query.days ?? '365', 10);
      if (isNaN(days) || days < 1 || days > 730) {
        throw createError(400, 'INVALID_DAYS', 'days must be a number between 1 and 730.');
      }

      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days + 1);

      to = toDate.toISOString().split('T')[0];
      from = fromDate.toISOString().split('T')[0];
    }

    const data = LogModel.getHeatmapData(from, to);

    sendSuccess(res, { from, to, data });
  })
);

// ── GET /api/analytics/heatmap-by-habit ──────────────────────────────────────
// Returns per-habit daily activity for mini sparkline-style heatmaps.
// Smaller default window (90d) since each habit gets its own visual.
//
// Query params:
//   ?days=90      → number of days to look back (1–365)
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD → explicit date range (overrides ?days)
router.get(
  '/heatmap-by-habit',
  asyncHandler((req, res) => {
    let from, to;

    if (req.query.from && req.query.to) {
      from = validateDate(req.query.from);
      to = validateDate(req.query.to);

      if (from > to) {
        throw createError(400, 'INVALID_DATE_RANGE', '"from" must be before "to".');
      }
    } else {
      const days = parseInt(req.query.days ?? '90', 10);
      if (isNaN(days) || days < 1 || days > 365) {
        throw createError(400, 'INVALID_DAYS', 'days must be a number between 1 and 365.');
      }

      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days + 1);

      to = toDate.toISOString().split('T')[0];
      from = fromDate.toISOString().split('T')[0];
    }

    const data = LogModel.getHeatmapByHabit(from, to);

    sendSuccess(res, { from, to, data });
  })
);

// ── GET /api/analytics/stats ──────────────────────────────────────────────────
// Returns per-habit stats with current/best streaks attached.
// This populates the analytics sidebar cards.
router.get(
  '/stats',
  asyncHandler((req, res) => {
    const stats = LogModel.getAllHabitStats();

    const enriched = stats.map((habit) => {
      const streaks = calculateStreak(habit.id);
      return {
        ...habit,
        ...streaks,
        completion_pct: habit.completion_pct ?? 0,
      };
    });

    sendSuccess(res, { habits: enriched });
  })
);

export default router;
