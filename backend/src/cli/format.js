// backend/src/cli/format.js
// ─────────────────────────────────────────────────────────────────────────────
// Pure formatters that turn data structures into ANSI-colored strings.
// Nothing in this file should touch the database or perform I/O.
// ─────────────────────────────────────────────────────────────────────────────
import chalk from 'chalk';
import {
  STRIP,
  HEATMAP_CHARS,
  HEATMAP_COLORS,
  STATE_COLOR,
  STATE_ICON,
  STATE_LABEL,
  flameForStreak,
  milestoneTier,
  tint,
  isLegacyWindowsConsole,
} from './theme.js';

// ── Greeting based on local time ─────────────────────────────────────────────
const GREETING = [
  { until: 5, text: 'Burning the midnight oil', icon: '🌙' },
  { until: 12, text: 'Good morning', icon: '☀' },
  { until: 17, text: 'Good afternoon', icon: '☀' },
  { until: 21, text: 'Good evening', icon: '🌆' },
  { until: 24, text: 'Late evening', icon: '🌙' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_ABBR = MONTH_NAMES.map((m) => m.slice(0, 3));

export function greeting() {
  const now = new Date();
  const h = now.getHours();
  const slot = GREETING.find((g) => h < g.until) ?? GREETING[GREETING.length - 1];
  const user = process.env.USER || process.env.USERNAME || 'friend';
  const date = `${DAY_NAMES[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
  return `${slot.icon}  ${chalk.bold(slot.text)}, ${chalk.cyan(user)} ${chalk.gray('—')} ${chalk.gray(date)}`;
}

// ── Progress bar ─────────────────────────────────────────────────────────────
export function progressBar(pct, width = 24) {
  const safe = Math.max(0, Math.min(100, pct));
  const filled = Math.round((safe / 100) * width);
  const empty = width - filled;

  let color = chalk.gray;
  if (safe >= 100) color = chalk.green;
  else if (safe >= 67) color = chalk.greenBright;
  else if (safe >= 34) color = chalk.yellow;
  else if (safe > 0) color = chalk.redBright;

  return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

// ── Streak strip — last N days for one habit ─────────────────────────────────
/**
 * @param states   Array of state strings ('DONE' | 'SKIPPED' | 'MISSED' | 'PENDING' | null),
 *                 ordered oldest → newest.
 * @param hexColor Habit's color (hex string).
 */
export function streakStrip(states, hexColor) {
  const tinted = tint(hexColor);
  return states
    .map((s) => {
      if (s === 'DONE') return tinted(STRIP.DONE);
      if (s === 'SKIPPED') return chalk.gray(STRIP.SKIPPED);
      if (s === 'MISSED') return chalk.red(STRIP.MISSED);
      return chalk.gray.dim(STRIP.PENDING);
    })
    .join('');
}

// ── Year heatmap ─────────────────────────────────────────────────────────────
/**
 * @param dailyMap  Map<dateStr, doneCount>
 * @param days      How many days of history to render (default 365).
 */
export function yearHeatmap(dailyMap, days = 365) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  // Pad backward to the previous Sunday so week columns align.
  while (start.getDay() !== 0) start.setDate(start.getDate() - 1);

  // Build a flat list of cells, oldest → newest, padded to whole weeks.
  const cells = [];
  const cur = new Date(start);
  while (cur <= today) {
    const dateStr = cur.toISOString().split('T')[0];
    cells.push({
      date: dateStr,
      count: dailyMap.get(dateStr) ?? 0,
      day: cur.getDay(),
      month: cur.getMonth(),
      future: false,
    });
    cur.setDate(cur.getDate() + 1);
  }
  while (cells.length % 7 !== 0) {
    const last = new Date(cells[cells.length - 1].date);
    last.setDate(last.getDate() + 1);
    cells.push({
      date: last.toISOString().split('T')[0],
      count: 0,
      day: last.getDay(),
      month: last.getMonth(),
      future: true,
    });
  }

  // Group into weekly columns: weeks[w][d] (Sun-first).
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // Intensity buckets relative to the busiest day in this window.
  const maxCount = Math.max(...cells.map((c) => c.count), 1);
  const intensity = (count) => {
    if (count === 0) return 0;
    const r = count / maxCount;
    if (r < 0.25) return 1;
    if (r < 0.5) return 2;
    if (r < 0.75) return 3;
    return 4;
  };

  // Build the month label row by walking weeks left-to-right and emitting a
  // 3-letter abbreviation each time the month transitions. Suppress labels
  // that would visually collide with the previous one — months just 3-4 weeks
  // apart can otherwise smush together (e.g. "MayJun" → unreadable).
  const monthLabelChars = Array(weeks.length).fill(' ');
  let lastMonth = -1;
  let nextSafeCol = 0;
  for (let w = 0; w < weeks.length; w++) {
    const firstReal = weeks[w].find((c) => !c.future);
    if (firstReal && firstReal.month !== lastMonth) {
      lastMonth = firstReal.month;
      if (w < nextSafeCol) continue; // not enough room since the last label
      const abbr = MONTH_ABBR[firstReal.month];
      for (let k = 0; k < abbr.length && w + k < weeks.length; k++) {
        monthLabelChars[w + k] = abbr[k];
      }
      nextSafeCol = w + abbr.length + 1;
    }
  }

  const PAD = '     '; // 5 chars: 3 for "Sun" + 2 for "  "
  const monthLine = PAD + chalk.gray(monthLabelChars.join(''));

  // Day rows: 7 lines, one per day-of-week (Sun..Sat).
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // GitHub renders Mon, Wed, Fri visibly and leaves the others blank — we
  // match that here so the grid stays scannable.
  const visibleDayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  const dayLines = [];
  for (let d = 0; d < 7; d++) {
    const label = visibleDayLabels[d].padEnd(3, ' ');
    let row = chalk.gray(label) + '  ';
    for (let w = 0; w < weeks.length; w++) {
      const cell = weeks[w][d];
      if (cell.future) {
        row += ' ';
      } else {
        row += HEATMAP_COLORS[intensity(cell.count)](HEATMAP_CHARS[intensity(cell.count)]);
      }
    }
    dayLines.push(row);
  }

  // Footer legend.
  const legend = [
    chalk.gray('Less '),
    HEATMAP_COLORS[0](HEATMAP_CHARS[0]),
    HEATMAP_COLORS[1](HEATMAP_CHARS[1]),
    HEATMAP_COLORS[2](HEATMAP_CHARS[2]),
    HEATMAP_COLORS[3](HEATMAP_CHARS[3]),
    HEATMAP_COLORS[4](HEATMAP_CHARS[4]),
    chalk.gray(' More'),
  ].join('');

  const totalDone = [...dailyMap.values()].reduce((a, b) => a + b, 0);
  const activeDays = [...dailyMap.values()].filter((c) => c > 0).length;
  const summary = chalk.gray(
    `${totalDone} done · ${activeDays} active days · last ${days} days`
  );

  return [monthLine, '', ...dayLines, '', `${PAD}${legend}     ${summary}`].join('\n');
}

// ── Today header card ────────────────────────────────────────────────────────
export function todayHeaderLine(date, doneCount, totalCount) {
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const label = chalk.bold('Today');
  const meta = chalk.gray(`${date} — ${doneCount}/${totalCount} done`);
  return `${label}  ${chalk.cyan(pct + '%')}  ${progressBar(pct, 26)}  ${meta}`;
}

// ── Single-habit dashboard line (used by `habit list`) ───────────────────────
/**
 * @param habit       { name, color, today_state }
 * @param strip       Pre-built streak-strip string (already colored).
 * @param currentStreak number
 * @param bestStreak    number
 */
export function habitListLine(habit, strip, currentStreak, bestStreak) {
  const dot = tint(habit.color)('●');
  const name = habit.today_state === 'DONE'
    ? chalk.gray.strikethrough(habit.name.padEnd(22))
    : chalk.white(habit.name.padEnd(22));
  const state = STATE_COLOR[habit.today_state](
    `${STATE_ICON[habit.today_state]} ${STATE_LABEL[habit.today_state]}`.padEnd(8)
  );
  const flame = flameForStreak(currentStreak);
  const streak = `${flame} ${chalk.yellow(currentStreak + 'd')}`.padEnd(7);
  const best = chalk.gray(`best ${bestStreak}d`);
  return `  ${dot}  ${name}  ${state}  ${strip}  ${streak}  ${best}`;
}

// ── Celebration banner ───────────────────────────────────────────────────────
export function milestoneBanner(streakDays, habitName) {
  const tier = milestoneTier(streakDays);
  if (!tier) return null;

  const headline = `${tier.icon}  ${tier.label}`;
  const detail = `${habitName} · ${streakDays} days`;
  const width = Math.max(headline.length, detail.length, 32) + 6;

  const horiz = chalk.yellow('═'.repeat(width));
  const blank = chalk.yellow('║') + ' '.repeat(width) + chalk.yellow('║');
  const lineHeadline =
    chalk.yellow('║') +
    centerAnsi(chalk.bold.yellow(headline), width) +
    chalk.yellow('║');
  const lineDetail =
    chalk.yellow('║') + centerAnsi(chalk.white(detail), width) + chalk.yellow('║');

  return [
    '',
    `  ${chalk.yellow('╔')}${horiz}${chalk.yellow('╗')}`,
    `  ${blank}`,
    `  ${lineHeadline}`,
    `  ${lineDetail}`,
    `  ${blank}`,
    `  ${chalk.yellow('╚')}${horiz}${chalk.yellow('╝')}`,
    '',
  ].join('\n');
}

/** Center-pad a possibly-ANSI-styled string within `width` visible columns. */
function centerAnsi(styled, width) {
  // Visible length: strip ANSI escape codes. Lightweight regex covers the
  // codes chalk emits (\x1b[...m).
  const visibleLen = styled.replace(/\x1b\[[0-9;]*m/g, '').length;
  const pad = Math.max(0, width - visibleLen);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return ' '.repeat(left) + styled + ' '.repeat(right);
}

// ── Footer hints for `habit list` ────────────────────────────────────────────
export function atRiskHint(pendingCount, riskCount) {
  if (pendingCount === 0) {
    return chalk.green('  ✨ All habits logged for today. Keep it up.');
  }
  if (riskCount > 0) {
    const noun = riskCount === 1 ? 'streak' : 'streaks';
    return chalk.yellow(
      `  ⏳ ${riskCount} ${noun} at risk — log before midnight to keep momentum.`
    );
  }
  const noun = pendingCount === 1 ? 'habit' : 'habits';
  return chalk.gray(`  ${pendingCount} ${noun} still pending today.`);
}

export function conhostHint() {
  if (!isLegacyWindowsConsole()) return null;
  return chalk.gray.dim(
    '  tip: open Windows Terminal for full visual fidelity (some glyphs may not render here).'
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
export function emptyStateBlock() {
  const lines = [
    '',
    chalk.bold('  🌱  No habits yet.'),
    chalk.gray('  Start small. One habit. Try:'),
    '',
    '     ' + chalk.cyan('habit add ') + chalk.white('"Read 30 minutes"'),
    '     ' + chalk.cyan('habit add ') + chalk.white('"Drink water" ') + chalk.gray('-c Health'),
    '',
    chalk.gray('  Then come back tomorrow with ') + chalk.cyan('habit') + chalk.gray('.'),
    '',
  ];
  return lines.join('\n');
}

// ── Re-export tokens that callers also need (saves a second import) ──────────
export { tint, STATE_ICON, STATE_LABEL, STATE_COLOR };
