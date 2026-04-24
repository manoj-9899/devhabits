// src/services/streak.js
// ─────────────────────────────────────────────────────────────────────────────
// Streak calculation engine.
//
// Core rules (matching the schema's design choices):
//  1. Only 'DONE' logs build the streak.
//  2. 'SKIPPED' logs are neutral — they don't break nor build the streak.
//  3. 'MISSED' logs break the streak.
//  4. Dates covered by a planned_absence are treated the same as SKIPPED.
//  5. "Current streak" counts backward from today/last-done-day until the
//     chain breaks (a MISSED or an un-logged, non-absence day).
//  6. "Best streak" is the longest consecutive DONE run in all history.
// ─────────────────────────────────────────────────────────────────────────────
import db from '../db/connection.js';
import { getToday, subtractDays } from '../utils/date.js';

/**
 * Returns all dates covered by any planned absence as a Set<string>.
 * This is cheap — planned absences are a small dataset.
 *
 * @returns {Set<string>}
 */
function getAbsenceDates() {
  const absences = db
    .prepare(
      `
    SELECT start_date, end_date FROM planned_absences
  `
    )
    .all();

  const absenceDates = new Set();

  for (const { start_date, end_date } of absences) {
    let current = new Date(start_date);
    const end = new Date(end_date);

    while (current <= end) {
      absenceDates.add(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  }

  return absenceDates;
}

/**
 * Calculates both current and best streak for a habit.
 *
 * Algorithm:
 *  - Fetch all logs for the habit ordered by date DESC.
 *  - Walk the list day-by-day backward from today.
 *  - DONE = advance streak counter.
 *  - SKIPPED or absence date = bridge (skip over, don't break or count).
 *  - MISSED or gap with no log = break streak.
 *
 * @param {string} habitId
 * @returns {{ current_streak: number, best_streak: number }}
 */
export function calculateStreak(habitId) {
  // All logs ordered newest → oldest
  const logs = db
    .prepare(
      `
    SELECT date, state
    FROM   logs
    WHERE  habit_id = ?
    ORDER  BY date DESC
  `
    )
    .all(habitId);

  if (logs.length === 0) {
    return { current_streak: 0, best_streak: 0 };
  }

  // Build a fast lookup map: date → state
  const logMap = new Map(logs.map((l) => [l.date, l.state]));
  const absenceDates = getAbsenceDates();
  const today = getToday();

  // ── Current Streak ─────────────────────────────────────────────────────────
  let currentStreak = 0;
  let cursor = today;
  let streakStarted = false; // Don't break immediately if today isn't logged yet

  for (let i = 0; i <= 365; i++) {
    // Hard cap: no one has a 365-day streak on day 1
    const state = logMap.get(cursor);
    const isAbsence = absenceDates.has(cursor);

    if (state === 'DONE') {
      streakStarted = true;
      currentStreak++;
    } else if (state === 'SKIPPED' || isAbsence) {
      // Neutral — bridge the gap. Only bridge if streak already started.
      if (!streakStarted && i === 0) {
        // If today is skipped, we allow bridging to look at yesterday
        cursor = subtractDays(cursor, 1);
        continue;
      }
    } else {
      // MISSED or no log at all — stop if we've already seen a DONE day
      if (streakStarted) break;
      // If today has no log yet, look at yesterday before giving up
      if (i === 0) {
        cursor = subtractDays(cursor, 1);
        continue;
      }
      break;
    }

    cursor = subtractDays(cursor, 1);
  }

  // ── Best Streak ────────────────────────────────────────────────────────────
  // Walk all logs oldest→newest and track longest consecutive DONE run
  const logsAsc = [...logs].reverse(); // oldest first
  let bestStreak = 0;
  let runStreak = 0;

  for (let i = 0; i < logsAsc.length; i++) {
    const { date, state } = logsAsc[i];

    if (state === 'DONE') {
      // Check if this date is exactly 1 day after the previous DONE date
      if (i === 0) {
        runStreak = 1;
      } else {
        const prevDoneIdx = logsAsc
          .slice(0, i)
          .reverse()
          .findIndex((l) => l.state === 'DONE');

        if (prevDoneIdx === -1) {
          runStreak = 1;
        } else {
          const prevDone = logsAsc.slice(0, i).reverse()[prevDoneIdx];
          const dayDiff = daysBetween(prevDone.date, date);

          // Count SKIPPED days + absence days between the two DONE days
          const skippedBetween = logsAsc.slice(0, i).filter((l) => {
            const d = l.date;
            return d > prevDone.date && d < date && (l.state === 'SKIPPED' || absenceDates.has(d));
          }).length;

          const effectiveGap = dayDiff - skippedBetween;

          if (effectiveGap === 1) {
            runStreak++;
          } else {
            runStreak = 1;
          }
        }
      }

      if (runStreak > bestStreak) bestStreak = runStreak;
    }
    // MISSED or SKIPPED alone doesn't reset runStreak for "best" calculation
    // (a missed day resets it; a skipped day bridges it)
    else if (state === 'MISSED') {
      runStreak = 0;
    }
  }

  if (currentStreak > bestStreak) bestStreak = currentStreak;

  return { current_streak: currentStreak, best_streak: bestStreak };
}

/**
 * Returns the number of calendar days between two date strings.
 * @param {string} a - earlier date "YYYY-MM-DD"
 * @param {string} b - later date "YYYY-MM-DD"
 * @returns {number}
 */
function daysBetween(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b) - new Date(a)) / msPerDay);
}
