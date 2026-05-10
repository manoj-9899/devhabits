#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// DevHabits CLI — entry point
//
// Direct SQLite access (WAL mode) so the CLI works simultaneously with the
// API server. Every visual decision lives in `cli/format.js` & `cli/theme.js`;
// this file only wires commands and data together.
// ─────────────────────────────────────────────────────────────────────────────

// 1. Setup environment before importing any local modules
process.env.CLI_MODE = '1';

// Suppress experimental node:sqlite warnings.
const originalEmit = process.emitWarning;
process.emitWarning = function (warning, ...args) {
  const msg = typeof warning === 'string' ? warning : warning?.message || '';
  if (msg && msg.includes('SQLite')) return;
  return originalEmit.call(process, warning, ...args);
};

// 2. Import deps
import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';

// 3. Dynamic imports — must happen AFTER CLI_MODE is set so the DB connection
//    initialises in CLI mode rather than server mode.
await import('./db/migrate.js');
const HabitModel = await import('./models/Habit.js');
const LogModel = await import('./models/Log.js');
const { calculateStreak } = await import('./services/streak.js');
const { getToday, subtractDays } = await import('./utils/date.js');
const fmt = await import('./cli/format.js');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Fuzzy-find a habit by id or substring of name. Errors out on ambiguity. */
function findHabit(query) {
  const habits = HabitModel.getAllHabits();
  const q = query.toLowerCase();

  const exact = habits.find((h) => h.name.toLowerCase() === q || h.id === q);
  if (exact) return exact;

  const matches = habits.filter((h) => h.name.toLowerCase().includes(q));

  if (matches.length === 0) {
    console.error(chalk.red(`Error: No habit found matching "${query}"`));
    process.exit(1);
  }

  if (matches.length > 1) {
    console.error(chalk.red(`Error: Multiple habits match "${query}":`));
    matches.forEach((m) => console.error(`  - ${m.name}`));
    process.exit(1);
  }

  return matches[0];
}

/**
 * Build a "states for the last N days" array (oldest → newest) for one habit.
 * Walks logs once instead of running N queries.
 */
function recentStates(habitId, n) {
  const logs = LogModel.getLogsByHabit(habitId);
  const map = new Map(logs.map((l) => [l.date, l.state]));
  const today = getToday();
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = subtractDays(today, i);
    result.push(map.get(date) ?? 'PENDING');
  }
  return result;
}

/** A daily habit with a live streak that hasn't been logged today is "at risk". */
function isAtRisk(habit) {
  if (habit.today_state !== 'PENDING') return false;
  if (habit.frequency_type !== 'DAILY') return false;
  const { current_streak } = calculateStreak(habit.id);
  return current_streak > 0;
}

/** Print a non-blocking footer hint after most commands. */
function printFooterHints() {
  const hint = fmt.conhostHint();
  if (hint) console.log(hint);
}

// ── First-run interactive seeding ────────────────────────────────────────────
// Three suggestions cover different motivation styles (build, health, mind).
// Each is created with a sensible default color so it shows up styled in the
// dashboard and CLI immediately.
const STARTER_HABITS = [
  { name: 'Code 1 hour',     category: 'Work',     color: '#a371f7' },
  { name: 'Drink 2L water',  category: 'Health',   color: '#3fb950' },
  { name: 'Read 30 minutes', category: 'Learning', color: '#58a6ff' },
];

async function firstRunPrompt() {
  console.log(chalk.bold("  Welcome — let's start with one habit."));
  console.log(chalk.gray('  Pick a starter, or type your own:'));
  console.log('');
  STARTER_HABITS.forEach((h, i) => {
    const dot = fmt.tint(h.color)('●');
    console.log(`    ${chalk.cyan(`[${i + 1}]`)}  ${dot}  ${h.name}  ${chalk.gray(h.category)}`);
  });
  console.log(`    ${chalk.cyan('[c]')}  Custom name`);
  console.log(`    ${chalk.cyan('[s]')}  Skip for now`);
  console.log('');

  const readline = await import('node:readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const choice = (await rl.question('  > ')).trim().toLowerCase();

  let toCreate = null;
  if (choice === 's' || choice === '') {
    rl.close();
    console.log('');
    console.log(chalk.gray('  No problem. Add one anytime with: ') + chalk.cyan('habit add "Name"'));
    console.log('');
    return;
  } else if (choice === 'c') {
    const name = (await rl.question('  Habit name: ')).trim();
    if (!name) {
      rl.close();
      console.log(chalk.gray('  No name given — skipping.'));
      return;
    }
    toCreate = { name, category: 'General' };
  } else {
    const idx = parseInt(choice, 10) - 1;
    if (idx >= 0 && idx < STARTER_HABITS.length) {
      toCreate = STARTER_HABITS[idx];
    } else {
      rl.close();
      console.log(chalk.red(`  Didn't recognise "${choice}". Try again with: habit`));
      return;
    }
  }
  rl.close();

  const habit = HabitModel.createHabit(toCreate);
  console.log('');
  console.log(
    `  ${fmt.tint(habit.color)('●')}  ${chalk.green('Created')} ${chalk.bold(habit.name)}`
  );
  console.log(
    chalk.gray('  Log it whenever you finish it: ') +
      chalk.cyan(`habit done ${habit.name.split(' ')[0].toLowerCase()}`)
  );
  console.log('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Command: `list` (default) — the daily dashboard
// ─────────────────────────────────────────────────────────────────────────────
const program = new Command();

program
  .name('habit')
  .description('DevHabits CLI — local-first developer habit tracker')
  .version('1.0.0');

program
  .command('list', { isDefault: true })
  .description("List all active habits and today's status")
  .action(async () => {
    const today = getToday();
    const habits = LogModel.getTodayHabits(today);

    console.log('');
    console.log(fmt.greeting());
    console.log('');

    if (habits.length === 0) {
      // First-run: in an interactive TTY, offer to seed a starter habit so
      // brand-new users have something to log immediately. Falls back to the
      // static empty-state for piped/non-interactive contexts (CI, etc.).
      if (process.stdin.isTTY && process.stdout.isTTY) {
        await firstRunPrompt();
        return;
      }
      console.log(fmt.emptyStateBlock());
      printFooterHints();
      return;
    }

    const doneCount = habits.filter((h) => h.today_state === 'DONE').length;
    console.log('  ' + fmt.todayHeaderLine(today, doneCount, habits.length));
    console.log('');

    let riskCount = 0;
    for (const h of habits) {
      const streaks = calculateStreak(h.id);
      const states = recentStates(h.id, 7);
      const strip = fmt.streakStrip(states, h.color);
      console.log(fmt.habitListLine(h, strip, streaks.current_streak, streaks.best_streak));
      if (isAtRisk(h)) riskCount++;
    }

    const pendingCount = habits.filter((h) => h.today_state === 'PENDING').length;
    console.log('');
    console.log(fmt.atRiskHint(pendingCount, riskCount));
    console.log('');
    printFooterHints();
  });

// ─────────────────────────────────────────────────────────────────────────────
// Command: `add` — create a habit
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('add <name>')
  .description('Add a new habit')
  .option('-c, --category <category>', 'Category', 'General')
  .option('-f, --freq <frequency>', 'Frequency (DAILY, WEEKLY, INTERVAL)', 'DAILY')
  .option('--color <hex>', 'Custom hex color (e.g. #6366f1)')
  .action((name, options) => {
    const habit = HabitModel.createHabit({
      name,
      category: options.category,
      frequency_type: options.freq.toUpperCase(),
      color: options.color,
    });
    const dot = fmt.tint(habit.color)('●');
    console.log('');
    console.log(`  ${dot}  ${chalk.green('Created')} ${chalk.bold(habit.name)}`);
    console.log(
      `      ${chalk.gray('category')} ${chalk.white(habit.category)}  ` +
        `${chalk.gray('· frequency')} ${chalk.white(habit.frequency_type)}`
    );
    console.log('');
  });

// ─────────────────────────────────────────────────────────────────────────────
// Commands: `done` / `skip` / `miss` — log entry with milestone celebration
// ─────────────────────────────────────────────────────────────────────────────
function logAction(state, headline) {
  return (query) => {
    const habit = findHabit(query);
    const date = getToday();

    LogModel.upsertLogEntry({
      habit_id: habit.id,
      state,
      date,
      source: 'CLI',
    });

    const streaks = calculateStreak(habit.id);
    const stateColor = fmt.STATE_COLOR[state];
    const dot = fmt.tint(habit.color)('●');

    console.log('');
    console.log(`  ${dot}  ${stateColor(headline)} ${chalk.bold(habit.name)}`);
    console.log(
      `      ${chalk.gray('current streak')} ${chalk.yellow(streaks.current_streak + 'd')}` +
        `  ${chalk.gray('· best')} ${chalk.yellow(streaks.best_streak + 'd')}`
    );
    console.log('');

    if (state === 'DONE') {
      const banner = fmt.milestoneBanner(streaks.current_streak, habit.name);
      if (banner) console.log(banner);
    }
  };
}

program
  .command('done <name>')
  .description('Mark a habit as DONE for today')
  .action(logAction('DONE', 'Logged'));

program
  .command('skip <name>')
  .description('Mark a habit as SKIPPED (rest day, planned absence)')
  .action(logAction('SKIPPED', 'Skipped'));

program
  .command('miss <name>')
  .description('Mark a habit as MISSED for today')
  .action(logAction('MISSED', 'Missed'));

// ─────────────────────────────────────────────────────────────────────────────
// Command: `stats` — long-term completion stats
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('stats')
  .description('All-time completion rate and streaks')
  .action(() => {
    const stats = LogModel.getAllHabitStats();
    if (stats.length === 0) {
      console.log(fmt.emptyStateBlock());
      return;
    }

    const table = new Table({
      head: [
        chalk.gray.bold('Habit'),
        chalk.gray.bold('Done/Elig'),
        chalk.gray.bold('Rate'),
        chalk.gray.bold('Current'),
        chalk.gray.bold('Best'),
      ],
      chars: borderlessChars(),
      style: { 'padding-left': 0, 'padding-right': 0 },
    });

    for (const h of stats) {
      const { current_streak, best_streak } = calculateStreak(h.id);
      const rate = h.completion_pct ?? 0;
      let rateColor = chalk.red;
      if (rate >= 80) rateColor = chalk.green;
      else if (rate >= 50) rateColor = chalk.yellow;

      table.push([
        fmt.tint(h.color)('● ') + chalk.white(h.name),
        chalk.gray(`${h.total_done}/${h.total_eligible}`),
        rateColor(`${rate}%`),
        chalk.yellow(`${current_streak}d`),
        chalk.yellow(`${best_streak}d`),
      ]);
    }

    console.log('');
    console.log('  ' + chalk.bold('All-time statistics'));
    console.log('');
    console.log(table.toString());
    console.log('');
    printFooterHints();
  });

// ─────────────────────────────────────────────────────────────────────────────
// Command: `week` — 7-day grid across all habits
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('week')
  .description('7-day grid showing each habit across the past week')
  .action(() => {
    const habits = HabitModel.getAllHabits();
    if (habits.length === 0) {
      console.log(fmt.emptyStateBlock());
      return;
    }

    const today = getToday();
    const days = [];
    for (let i = 6; i >= 0; i--) days.push(subtractDays(today, i));
    const dayHeaders = days.map((d) => {
      const date = new Date(d);
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    });

    // Layout: 2 (left pad) + 1 (dot) + 2 (gap) + 20 (name) = 25 chars before cells.
    // The header pads to the same width so day labels line up with the cells below.
    const NAME_COL = 25;
    const CELL_W = 4;

    console.log('');
    console.log('  ' + chalk.bold('Last 7 days'));
    console.log('');
    console.log(
      ' '.repeat(NAME_COL) +
        dayHeaders
          .map((d, i) =>
            (i === 6 ? chalk.cyan : chalk.gray)(d.padStart(CELL_W))
          )
          .join('')
    );

    for (const habit of habits) {
      const logs = LogModel.getLogsByHabit(habit.id);
      const map = new Map(logs.map((l) => [l.date, l.state]));
      const cells = days.map((d) => map.get(d) ?? 'PENDING');

      const dot = fmt.tint(habit.color)('●');
      const truncated = habit.name.length > 20 ? habit.name.slice(0, 19) + '…' : habit.name;
      const name = chalk.white(truncated.padEnd(20));
      const cellStr = cells
        .map((s) => fmt.STATE_COLOR[s](fmt.STATE_ICON[s].padStart(CELL_W)))
        .join('');

      console.log(`  ${dot}  ${name}${cellStr}`);
    }

    console.log('');
    console.log(
      chalk.gray('  ') +
        chalk.green('✓ Done') +
        chalk.gray('   ') +
        chalk.blue('⟶ Skipped') +
        chalk.gray('   ') +
        chalk.red('✗ Missed') +
        chalk.gray('   · Pending')
    );
    console.log('');
    printFooterHints();
  });

// ─────────────────────────────────────────────────────────────────────────────
// Command: `year` — GitHub-style 365-day heatmap
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('year')
  .description('Activity heatmap for the past 365 days')
  .option('--days <n>', 'How many days back to render', '365')
  .action((options) => {
    const days = Math.max(30, Math.min(730, parseInt(options.days, 10) || 365));
    const today = getToday();
    const start = subtractDays(today, days - 1);
    const heatmap = LogModel.getHeatmapData(start, today);
    const dailyMap = new Map(heatmap.map((d) => [d.date, d.done_count]));

    console.log('');
    console.log('  ' + chalk.bold('Activity heatmap'));
    console.log('');
    console.log(fmt.yearHeatmap(dailyMap, days));
    console.log('');
    printFooterHints();
  });

// ─────────────────────────────────────────────────────────────────────────────
// Command: `chart <name>` — 30-day strip for one habit
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('chart <name>')
  .description('30-day strip for one habit (fuzzy match)')
  .option('--days <n>', 'How many days back to render', '30')
  .action((query, options) => {
    const habit = findHabit(query);
    const days = Math.max(7, Math.min(180, parseInt(options.days, 10) || 30));
    const states = recentStates(habit.id, days);
    const strip = fmt.streakStrip(states, habit.color);
    const streaks = calculateStreak(habit.id);

    const done = states.filter((s) => s === 'DONE').length;
    const eligible = states.filter((s) => s === 'DONE' || s === 'MISSED').length;
    const rate = eligible > 0 ? Math.round((done / eligible) * 100) : 0;

    console.log('');
    console.log(
      `  ${fmt.tint(habit.color)('●')}  ${chalk.bold(habit.name)}  ` +
        chalk.gray(`${habit.category} · ${habit.frequency_type}`)
    );
    console.log('');
    console.log(`  ${chalk.gray(`${days} days ago`.padEnd(Math.max(2, days - 5)))}${chalk.cyan('today')}`);
    console.log(`  ${strip}`);
    console.log('');
    console.log(
      `  ${chalk.yellow(streaks.current_streak + 'd')} ${chalk.gray('current')}` +
        `   ${chalk.yellow(streaks.best_streak + 'd')} ${chalk.gray('best')}` +
        `   ${chalk.white(`${done}/${eligible}`)} ${chalk.gray('eligible')}` +
        `   ${chalk.white(rate + '%')} ${chalk.gray('completion')}`
    );
    console.log('');
    printFooterHints();
  });

// ─────────────────────────────────────────────────────────────────────────────
// Command: `ui` — full-screen interactive TUI (Tier 3, lazy-loaded)
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('ui')
  .description('Open the interactive full-screen dashboard (q to quit)')
  .action(async () => {
    if (!process.stdout.isTTY) {
      console.error(chalk.red('Error: `habit ui` needs an interactive terminal.'));
      process.exit(1);
    }
    try {
      const { runInteractive } = await import('./cli/interactive.js');
      await runInteractive();
    } catch (err) {
      console.error(chalk.red('Failed to launch interactive UI:'));
      console.error(chalk.gray(err?.message ?? err));
      console.error(
        chalk.gray('  Tip: run `npm install --prefix backend ink react` to enable this command.')
      );
      process.exit(1);
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// Wiring
// ─────────────────────────────────────────────────────────────────────────────
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s\n'), program.args.join(' '));
  program.outputHelp();
  process.exit(1);
});

program.parse(process.argv);

// ── Internal: borderless table style (shared by `stats`) ─────────────────────
function borderlessChars() {
  return {
    top: '',
    'top-mid': '',
    'top-left': '',
    'top-right': '',
    bottom: '',
    'bottom-mid': '',
    'bottom-left': '',
    'bottom-right': '',
    left: '',
    'left-mid': '',
    mid: '',
    'mid-mid': '',
    right: '',
    'right-mid': '',
    middle: '   ',
  };
}
