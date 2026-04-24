// src/utils/date.js
// ─────────────────────────────────────────────────────────────────────────────
// Date helpers for the "day boundary" feature.
// "Today" is extended past midnight based on the user's `day_boundary` setting
// (default: 04:00 AM). So a developer logging at 2 AM is still logging for
// the previous calendar day.
// ─────────────────────────────────────────────────────────────────────────────
import db from '../db/connection.js';

/**
 * Returns today's date as "YYYY-MM-DD", respecting the configurable
 * day boundary setting stored in the settings table.
 *
 * @returns {string} e.g. "2026-04-23"
 */
export function getToday() {
  const row = db.prepare(`SELECT value FROM settings WHERE key = 'day_boundary'`).get();
  const boundary = row?.value ?? '04:00';
  const [boundaryHour, boundaryMin] = boundary.split(':').map(Number);

  const now = new Date();
  const boundaryMs = (boundaryHour * 60 + boundaryMin) * 60 * 1000;
  const midnightMs = now.getHours() * 60 * 60 * 1000 + now.getMinutes() * 60 * 1000;

  // If current time is before boundary (e.g. it's 2 AM and boundary is 4 AM),
  // treat it as still "yesterday"
  if (midnightMs < boundaryMs) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  return now.toISOString().split('T')[0];
}

/**
 * Validates and normalizes a date string to "YYYY-MM-DD".
 * Throws a descriptive error if the format is invalid.
 *
 * @param {string} dateStr
 * @returns {string}
 */
export function validateDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Invalid date format "${dateStr}". Expected YYYY-MM-DD.`);
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date value "${dateStr}".`);
  }
  return dateStr;
}

/**
 * Returns a date string N days before a given date.
 *
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {number} n - days to subtract
 * @returns {string} "YYYY-MM-DD"
 */
export function subtractDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
