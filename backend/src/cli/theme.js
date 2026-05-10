// backend/src/cli/theme.js
// ─────────────────────────────────────────────────────────────────────────────
// Visual tokens shared by every CLI command. Symbols, color helpers, and
// terminal-capability detection live here so the rest of the CLI stays focused
// on business logic.
// ─────────────────────────────────────────────────────────────────────────────
import chalk from 'chalk';

// ── State icons & colors ─────────────────────────────────────────────────────
export const STATE_ICON = {
  DONE: '✓',
  PENDING: '·',
  SKIPPED: '⟶',
  MISSED: '✗',
};

export const STATE_LABEL = {
  DONE: 'DONE',
  PENDING: 'PEND',
  SKIPPED: 'SKIP',
  MISSED: 'MISS',
};

export const STATE_COLOR = {
  DONE: chalk.green,
  PENDING: chalk.gray,
  SKIPPED: chalk.blue,
  MISSED: chalk.red,
};

// ── Streak strip — one cell per day ──────────────────────────────────────────
// Used for "last N days" visualisations under each habit.
export const STRIP = {
  DONE: '█',
  SKIPPED: '▒',
  MISSED: '×',
  PENDING: '·',
  EMPTY: '·',
};

// ── Heatmap intensity (matches the web app's gradient) ───────────────────────
export const HEATMAP_CHARS = ['·', '░', '▒', '▓', '█'];
export const HEATMAP_COLORS = [
  chalk.gray,
  chalk.hex('#0e4429'),
  chalk.hex('#006d32'),
  chalk.hex('#26a641'),
  chalk.hex('#39d353'),
];

export function intensityCell(level) {
  const i = Math.max(0, Math.min(4, Math.round(level)));
  return HEATMAP_COLORS[i](HEATMAP_CHARS[i]);
}

/**
 * Tint a hex color for chalk usage. Defaults to greenBright if the input is
 * missing or malformed (so a habit with no color still renders sensibly).
 */
export function tint(hex) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return chalk.greenBright;
  }
  try {
    return chalk.hex(hex);
  } catch {
    return chalk.greenBright;
  }
}

// ── Streak flame tier ────────────────────────────────────────────────────────
/**
 * Decorative flame intensity that scales with streak length. Returns a single
 * space for streaks under 7 days so the indicator doesn't visually clash with
 * the streak strip's pending dots — the kbd-strip already shows progress, the
 * flame is reserved for milestone-class streaks.
 */
export function flameForStreak(days) {
  if (days >= 365) return '🏆';
  if (days >= 100) return '💯';
  if (days >= 30) return '🔥🔥';
  if (days >= 7) return '🔥';
  return ' ';
}

/** Friendly milestone copy used by the celebration banner. */
export function milestoneTier(days) {
  if (days === 7) return { icon: '🔥', label: 'One week strong' };
  if (days === 14) return { icon: '🔥', label: 'Two weeks down' };
  if (days === 30) return { icon: '🏆', label: '30-day milestone' };
  if (days === 100) return { icon: '💯', label: '100-day legend' };
  if (days === 365) return { icon: '🎖', label: 'A full year' };
  return null;
}

// ── Terminal capability detection ────────────────────────────────────────────
/**
 * Returns true when the CLI is running inside the legacy Windows console
 * (conhost / cmd.exe), which has poor Unicode + emoji support compared to
 * Windows Terminal. We use this to show a one-line tip pointing users at WT.
 */
export function isLegacyWindowsConsole() {
  return process.platform === 'win32' && !process.env.WT_SESSION;
}

/** Returns the terminal's column width (or 80 as a sensible fallback). */
export function terminalWidth() {
  return process.stdout.columns || 80;
}
