// backend/src/cli/interactive.js
// ─────────────────────────────────────────────────────────────────────────────
// Full-screen interactive TUI for `habit ui`.
//
// Built with ink (React-for-the-CLI) using `React.createElement` directly so
// the project doesn't need a JSX build step. Loaded lazily by `cli.js` so
// the rest of the CLI doesn't pay ink's startup cost.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';

import * as HabitModel from '../models/Habit.js';
import * as LogModel from '../models/Log.js';
import { calculateStreak } from '../services/streak.js';
import { getToday, subtractDays } from '../utils/date.js';
import {
  STATE_ICON,
  STATE_LABEL,
  STRIP,
  flameForStreak,
} from './theme.js';

const h = React.createElement;

const STATE_COLOR_INK = {
  DONE: 'green',
  PENDING: 'gray',
  SKIPPED: 'blue',
  MISSED: 'red',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function greetingText() {
  const now = new Date();
  const h = now.getHours();
  let label;
  let icon;
  if (h < 5) { label = 'Burning the midnight oil'; icon = '🌙'; }
  else if (h < 12) { label = 'Good morning'; icon = '☀'; }
  else if (h < 17) { label = 'Good afternoon'; icon = '☀'; }
  else if (h < 21) { label = 'Good evening'; icon = '🌆'; }
  else { label = 'Late evening'; icon = '🌙'; }
  const user = process.env.USER || process.env.USERNAME || 'friend';
  const date = `${DAY_NAMES[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
  return { label, icon, user, date };
}

// ── Data layer (sync, fast — node:sqlite is synchronous) ─────────────────────
function loadAll() {
  const today = getToday();
  const habits = LogModel.getTodayHabits(today);

  return {
    today,
    habits: habits.map((hb) => {
      const logs = LogModel.getLogsByHabit(hb.id);
      const map = new Map(logs.map((l) => [l.date, l.state]));
      const strip = [];
      for (let i = 6; i >= 0; i--) {
        strip.push(map.get(subtractDays(today, i)) ?? 'PENDING');
      }
      return {
        ...hb,
        strip,
        streaks: calculateStreak(hb.id),
      };
    }),
  };
}

// ── Components ───────────────────────────────────────────────────────────────
function StreakStrip({ states, color }) {
  return h(
    Box,
    null,
    states.map((s, i) => {
      if (s === 'DONE') return h(Text, { key: i, color: color || '#39d353' }, STRIP.DONE);
      if (s === 'SKIPPED') return h(Text, { key: i, color: 'gray' }, STRIP.SKIPPED);
      if (s === 'MISSED') return h(Text, { key: i, color: 'red' }, STRIP.MISSED);
      return h(Text, { key: i, color: 'gray', dimColor: true }, STRIP.PENDING);
    })
  );
}

function ProgressBar({ pct, width = 26 }) {
  const safe = Math.max(0, Math.min(100, pct));
  const filled = Math.round((safe / 100) * width);
  let color = 'gray';
  if (safe >= 100) color = 'green';
  else if (safe >= 67) color = 'greenBright';
  else if (safe >= 34) color = 'yellow';
  else if (safe > 0) color = 'redBright';

  return h(
    Box,
    null,
    h(Text, { color }, '█'.repeat(filled)),
    h(Text, { color: 'gray' }, '░'.repeat(width - filled))
  );
}

function HabitRow({ habit, selected }) {
  const cs = habit.streaks.current_streak;
  const bs = habit.streaks.best_streak;
  const flame = flameForStreak(cs);
  const stateColor = STATE_COLOR_INK[habit.today_state];

  const truncated = habit.name.length > 22 ? habit.name.slice(0, 21) + '…' : habit.name;
  const nameProps = habit.today_state === 'DONE'
    ? { color: 'gray', strikethrough: true }
    : { color: 'white' };

  return h(
    Box,
    { flexDirection: 'row', columnGap: 2 },
    h(Text, { color: selected ? 'cyan' : 'gray' }, selected ? '▶' : ' '),
    h(Text, { color: habit.color || 'green' }, '●'),
    h(Box, { width: 22 }, h(Text, nameProps, truncated.padEnd(22))),
    h(
      Box,
      { width: 8 },
      h(Text, { color: stateColor }, `${STATE_ICON[habit.today_state]} ${STATE_LABEL[habit.today_state]}`)
    ),
    h(StreakStrip, { states: habit.strip, color: habit.color }),
    h(Text, { color: 'yellow' }, `  ${flame} ${cs}d`),
    h(Text, { color: 'gray' }, `  best ${bs}d`)
  );
}

function HelpOverlay() {
  const items = [
    ['j  /  ↓', 'next habit'],
    ['k  /  ↑', 'previous habit'],
    ['d', 'mark Done'],
    ['s', 'mark Skipped'],
    ['m', 'mark Missed'],
    ['r', 'refresh from disk'],
    ['?', 'toggle this help'],
    ['q  /  esc', 'quit'],
  ];
  return h(
    Box,
    { flexDirection: 'column', borderStyle: 'round', borderColor: 'cyan', paddingX: 2, paddingY: 1, marginTop: 1 },
    h(Text, { bold: true, color: 'cyan' }, 'Keyboard shortcuts'),
    h(Box, { height: 1 }),
    ...items.map(([k, label]) =>
      h(
        Box,
        { key: k, columnGap: 2 },
        h(Box, { width: 12 }, h(Text, { color: 'yellow' }, k)),
        h(Text, { color: 'white' }, label)
      )
    ),
    h(Box, { height: 1 }),
    h(Text, { color: 'gray' }, 'press ? or esc to close')
  );
}

function App() {
  const { exit } = useApp();
  const [data, setData] = useState(() => loadAll());
  const [idx, setIdx] = useState(0);
  const [help, setHelp] = useState(false);
  const [flash, setFlash] = useState(null);
  const flashTimer = useRef(null);

  // Cleanup the flash timer when the app unmounts.
  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const refresh = useCallback(() => {
    setData(loadAll());
  }, []);

  const flashMsg = useCallback((text, color = 'green') => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ text, color });
    flashTimer.current = setTimeout(() => setFlash(null), 1800);
  }, []);

  const log = useCallback(
    (state) => {
      const habit = data.habits[idx];
      if (!habit) return;
      LogModel.upsertLogEntry({
        habit_id: habit.id,
        state,
        date: data.today,
        source: 'CLI',
      });
      const next = loadAll();
      setData(next);
      const fresh = next.habits[idx];
      const cs = fresh?.streaks.current_streak ?? 0;
      flashMsg(`${state}: ${habit.name} — ${cs}d`, STATE_COLOR_INK[state]);
    },
    [data, idx, flashMsg]
  );

  useInput((input, key) => {
    if (help) {
      if (input === '?' || key.escape) setHelp(false);
      else if (input === 'q' || input === 'Q') exit();
      return;
    }
    if (input === 'q' || input === 'Q' || key.escape || (key.ctrl && (input === 'c' || input === 'C'))) {
      exit();
      return;
    }
    if (key.upArrow || input === 'k' || input === 'K') {
      setIdx((i) => Math.max(0, i - 1));
    } else if (key.downArrow || input === 'j' || input === 'J') {
      setIdx((i) => Math.min(data.habits.length - 1, i + 1));
    } else if (input === 'd' || input === 'D') {
      log('DONE');
    } else if (input === 's' || input === 'S') {
      log('SKIPPED');
    } else if (input === 'm' || input === 'M') {
      log('MISSED');
    } else if (input === 'r' || input === 'R') {
      refresh();
      flashMsg('Refreshed', 'cyan');
    } else if (input === '?') {
      setHelp(true);
    }
  });

  const greet = useMemo(() => greetingText(), []);
  const total = data.habits.length;
  const doneCount = data.habits.filter((hb) => hb.today_state === 'DONE').length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return h(
    Box,
    { flexDirection: 'column', padding: 1 },
    // Greeting row
    h(
      Box,
      { columnGap: 1 },
      h(Text, null, greet.icon),
      h(Text, { bold: true }, greet.label + ','),
      h(Text, { color: 'cyan' }, greet.user),
      h(Text, { color: 'gray' }, '— ' + greet.date)
    ),
    // Today header / progress
    h(Box, { height: 1 }),
    h(
      Box,
      { columnGap: 2 },
      h(Text, { bold: true }, 'Today'),
      h(Text, { color: 'cyan' }, pct + '%'),
      h(ProgressBar, { pct }),
      h(Text, { color: 'gray' }, `${doneCount}/${total} done`)
    ),
    h(Box, { height: 1 }),

    // Habit list (or empty state)
    total === 0
      ? h(
          Box,
          { flexDirection: 'column', borderStyle: 'round', borderColor: 'gray', paddingX: 2, paddingY: 1 },
          h(Text, { bold: true }, '🌱  No habits yet.'),
          h(Text, { color: 'gray' }, 'Quit (q), then run: habit add "Read 30 minutes"')
        )
      : h(
          Box,
          { flexDirection: 'column' },
          ...data.habits.map((hb, i) =>
            h(HabitRow, { key: hb.id, habit: hb, selected: i === idx })
          )
        ),

    // Flash message line (always reserves a row to prevent layout jumps)
    h(Box, { height: 1 }),
    h(
      Box,
      null,
      flash
        ? h(Text, { color: flash.color }, '  ' + flash.text)
        : h(Text, { color: 'gray', dimColor: true }, ' ')
    ),

    // Footer: keymap hint
    h(Box, { height: 1 }),
    h(
      Box,
      { columnGap: 2, flexWrap: 'wrap' },
      h(KeymapHint, { k: 'd', label: 'done' }),
      h(KeymapHint, { k: 's', label: 'skip' }),
      h(KeymapHint, { k: 'm', label: 'miss' }),
      h(KeymapHint, { k: 'j/k', label: 'move' }),
      h(KeymapHint, { k: 'r', label: 'refresh' }),
      h(KeymapHint, { k: '?', label: 'help' }),
      h(KeymapHint, { k: 'q', label: 'quit' })
    ),

    help ? h(HelpOverlay) : null
  );
}

function KeymapHint({ k, label }) {
  return h(
    Box,
    null,
    h(Text, { color: 'yellow' }, k),
    h(Text, { color: 'gray' }, ' ' + label)
  );
}

// ── Entry ────────────────────────────────────────────────────────────────────
export async function runInteractive() {
  const instance = render(h(App), { exitOnCtrlC: false });
  await instance.waitUntilExit();
}
