// backend/src/cli/quick.js
// ─────────────────────────────────────────────────────────────────────────────
// Fast multi-select logger for `habit quick`.
//
// Opens a compact Ink prompt:
//   ↑/↓ or j/k  move
//   Space       toggle selected
//   Enter       mark selected habits DONE
//   q / Esc     cancel
//
// Loaded lazily by cli.js so normal commands stay fast.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';

import * as LogModel from '../models/Log.js';
import { calculateStreak } from '../services/streak.js';
import { getToday } from '../utils/date.js';
import { STATE_ICON, STATE_LABEL } from './theme.js';

const h = React.createElement;

const STATE_COLOR_INK = {
  DONE: 'green',
  PENDING: 'gray',
  SKIPPED: 'blue',
  MISSED: 'red',
};

function loadPendingHabits() {
  const today = getToday();
  return {
    today,
    habits: LogModel.getTodayHabits(today).filter((habit) => habit.today_state !== 'DONE'),
  };
}

function QuickApp() {
  const { exit } = useApp();
  const [{ today, habits }, setData] = useState(() => loadPendingHabits());
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [done, setDone] = useState(null);

  const selectedCount = selected.size;
  const hasHabits = habits.length > 0;

  const selectedNames = useMemo(
    () => habits.filter((habit) => selected.has(habit.id)).map((habit) => habit.name),
    [habits, selected]
  );

  useInput((input, key) => {
    if (done) {
      if (input === 'q' || input === 'Q' || key.return || key.escape) exit();
      return;
    }

    if (input === 'q' || input === 'Q' || key.escape || (key.ctrl && input === 'c')) {
      exit();
      return;
    }

    if (!hasHabits) {
      if (key.return) exit();
      return;
    }

    if (key.upArrow || input === 'k' || input === 'K') {
      setIdx((current) => Math.max(0, current - 1));
    } else if (key.downArrow || input === 'j' || input === 'J') {
      setIdx((current) => Math.min(habits.length - 1, current + 1));
    } else if (input === ' ') {
      const habit = habits[idx];
      if (!habit) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(habit.id)) next.delete(habit.id);
        else next.add(habit.id);
        return next;
      });
    } else if (input === 'a' || input === 'A') {
      setSelected(new Set(habits.map((habit) => habit.id)));
    } else if (input === 'x' || input === 'X') {
      setSelected(new Set());
    } else if (key.return) {
      if (selected.size === 0) return;

      const logged = [];
      for (const habit of habits) {
        if (!selected.has(habit.id)) continue;
        LogModel.upsertLogEntry({
          habit_id: habit.id,
          state: 'DONE',
          date: today,
          source: 'CLI',
        });
        const streaks = calculateStreak(habit.id);
        logged.push({
          name: habit.name,
          current: streaks.current_streak,
        });
      }

      setData(loadPendingHabits());
      setDone(logged);
    }
  });

  if (done) {
    return h(
      Box,
      { flexDirection: 'column', padding: 1 },
      h(Text, { bold: true, color: 'green' }, `✓ Logged ${done.length} habit${done.length === 1 ? '' : 's'}`),
      h(Box, { height: 1 }),
      ...done.map((item) =>
        h(
          Text,
          { key: item.name },
          `  ✓ ${item.name}  `,
          h(Text, { color: 'yellow' }, `${item.current}d`)
        )
      ),
      h(Box, { height: 1 }),
      h(Text, { color: 'gray' }, 'Press Enter or q to exit.')
    );
  }

  if (!hasHabits) {
    return h(
      Box,
      { flexDirection: 'column', padding: 1 },
      h(Text, { bold: true, color: 'green' }, '✨ Nothing to log.'),
      h(Text, { color: 'gray' }, 'All habits are already DONE for today, or no habits exist yet.'),
      h(Box, { height: 1 }),
      h(Text, { color: 'gray' }, 'Press Enter, q, or Esc to exit.')
    );
  }

  return h(
    Box,
    { flexDirection: 'column', padding: 1 },
    h(Text, { bold: true }, 'Quick log'),
    h(Text, { color: 'gray' }, `${today} · Space to select, Enter to mark selected as DONE`),
    h(Box, { height: 1 }),
    ...habits.map((habit, i) => {
      const active = i === idx;
      const checked = selected.has(habit.id);
      const stateColor = STATE_COLOR_INK[habit.today_state];
      return h(
        Box,
        { key: habit.id, columnGap: 2 },
        h(Text, { color: active ? 'cyan' : 'gray' }, active ? '▶' : ' '),
        h(Text, { color: checked ? 'green' : 'gray' }, checked ? '☑' : '☐'),
        h(Text, { color: habit.color || 'green' }, '●'),
        h(Box, { width: 24 }, h(Text, { color: 'white' }, habit.name.length > 24 ? habit.name.slice(0, 23) + '…' : habit.name)),
        h(Text, { color: stateColor }, `${STATE_ICON[habit.today_state]} ${STATE_LABEL[habit.today_state]}`),
        h(Text, { color: 'gray' }, habit.category)
      );
    }),
    h(Box, { height: 1 }),
    h(
      Text,
      { color: selectedCount > 0 ? 'green' : 'gray' },
      selectedCount > 0
        ? `${selectedCount} selected: ${selectedNames.slice(0, 3).join(', ')}${selectedNames.length > 3 ? '…' : ''}`
        : 'Select habits with Space. Press a to select all, x to clear.'
    ),
    h(
      Text,
      { color: 'gray' },
      'j/k or ↑/↓ move · space select · a all · x clear · enter log · q cancel'
    )
  );
}

export async function runQuickLog() {
  const instance = render(h(QuickApp), { exitOnCtrlC: false });
  await instance.waitUntilExit();
}
