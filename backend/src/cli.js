#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// DevHabits CLI
// Uses direct SQLite access (WAL mode) to work simultaneously with the API.
// ─────────────────────────────────────────────────────────────────────────────

// 1. Setup environment before importing any local modules
process.env.CLI_MODE = '1';

// Suppress experimental node:sqlite warnings
const originalEmit = process.emitWarning;
process.emitWarning = function(warning, ...args) {
  const msg = typeof warning === 'string' ? warning : (warning?.message || '');
  if (msg && msg.includes('SQLite')) return;
  return originalEmit.call(process, warning, ...args);
};

// 2. Import dependencies
import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';

// 3. Import DB and models dynamically to ensure they evaluate AFTER setup
await import('./db/migrate.js');
const HabitModel = await import('./models/Habit.js');
const LogModel   = await import('./models/Log.js');
const { calculateStreak } = await import('./services/streak.js');
const { getToday }        = await import('./utils/date.js');

const program = new Command();

// ── Helper: Fuzzy find habit by name ─────────────────────────────────────────
function findHabit(query) {
  const habits = HabitModel.getAllHabits();
  const q = query.toLowerCase();
  
  const exact = habits.find(h => h.name.toLowerCase() === q || h.id === q);
  if (exact) return exact;
  
  const matches = habits.filter(h => h.name.toLowerCase().includes(q));
  
  if (matches.length === 0) {
    console.error(chalk.red(`Error: No habit found matching "${query}"`));
    process.exit(1);
  }
  
  if (matches.length > 1) {
    console.error(chalk.red(`Error: Multiple habits match "${query}":`));
    matches.forEach(m => console.error(`  - ${m.name}`));
    process.exit(1);
  }
  
  return matches[0];
}

// ── Shared action factory for log mutations ──────────────────────────────────
function logAction(state, colorFunc) {
  return (query) => {
    const habit = findHabit(query);
    const date = getToday();
    
    LogModel.upsertLogEntry({
      habit_id: habit.id,
      state: state,
      date: date,
      source: 'CLI'
    });
    
    const streaks = calculateStreak(habit.id);
    console.log(colorFunc(`✓ Marked "${habit.name}" as ${state}.`));
    console.log(chalk.gray(`  Current streak: ${streaks.current_streak} days (Best: ${streaks.best_streak})`));
  };
}

// ── Command configs ──────────────────────────────────────────────────────────

program
  .name('habit')
  .description('DevHabits CLI - Local-first developer habit tracker')
  .version('1.0.0');

program
  .command('list', { isDefault: true })
  .description('List all active habits and today\'s status (default)')
  .action(() => {
    const today = getToday();
    const habits = LogModel.getTodayHabits(today);
    
    if (habits.length === 0) {
      console.log(chalk.gray('\nNo active habits found. Use `habit add <name>` to create one.\n'));
      return;
    }
    
    const table = new Table({
      head: [
        chalk.bold.gray('Habit'), 
        chalk.bold.gray('Category'), 
        chalk.bold.gray('State'), 
        chalk.bold.gray('Streak')
      ],
      chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
         , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
         , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
         , 'right': '' , 'right-mid': '' , 'middle': '   ' },
      style: { 'padding-left': 0, 'padding-right': 0 }
    });
    
    let doneCount = 0;
    
    habits.forEach(h => {
      const streaks = calculateStreak(h.id);
      
      let stateColor = chalk.gray;
      let stateIcon = '· PENDING';
      if (h.today_state === 'DONE') { stateColor = chalk.green; stateIcon = '✓ DONE   '; doneCount++; }
      if (h.today_state === 'SKIPPED') { stateColor = chalk.blue; stateIcon = '⟶ SKIP   '; }
      if (h.today_state === 'MISSED') { stateColor = chalk.red; stateIcon = '✗ MISS   '; }
      
      table.push([
        h.today_state === 'DONE' ? chalk.gray.strikethrough(h.name) : chalk.white(h.name),
        chalk.gray(h.category),
        stateColor(stateIcon),
        chalk.yellow(`${streaks.current_streak}d`) + chalk.gray(` / ${streaks.best_streak}d`)
      ]);
    });
    
    console.log(`\n${chalk.bold('Today:')} ${chalk.gray(today)}\n`);
    console.log(table.toString());
    
    const pct = Math.round((doneCount / habits.length) * 100);
    
    let pctColor = chalk.gray;
    if (pct === 100) pctColor = chalk.green;
    else if (pct > 0) pctColor = chalk.yellow;
    
    console.log(`\nProgress: ${pctColor(pct + '%')} (${doneCount}/${habits.length})\n`);
  });

program
  .command('add <name>')
  .description('Add a new habit')
  .option('-c, --category <category>', 'Category', 'General')
  .option('-f, --freq <frequency>', 'Frequency (DAILY, WEEKLY, INTERVAL)', 'DAILY')
  .action((name, options) => {
    const habit = HabitModel.createHabit({
      name,
      category: options.category,
      frequency_type: options.freq.toUpperCase()
    });
    console.log(chalk.green(`✓ Created habit: ${chalk.bold(habit.name)}`));
  });

program
  .command('done <name>')
  .description('Mark a habit as DONE for today (fuzzy match name)')
  .action(logAction('DONE', chalk.green));

program
  .command('skip <name>')
  .description('Mark a habit as SKIPPED for today (fuzzy match name)')
  .action(logAction('SKIPPED', chalk.blue));

program
  .command('miss <name>')
  .description('Mark a habit as MISSED for today (fuzzy match name)')
  .action(logAction('MISSED', chalk.red));

program
  .command('stats')
  .description('View all-time stats for all habits')
  .action(() => {
    const stats = LogModel.getAllHabitStats();
    if (stats.length === 0) {
      console.log(chalk.gray('\nNo habits found.\n'));
      return;
    }
    
    const table = new Table({
      head: [
        chalk.bold.gray('Habit'), 
        chalk.bold.gray('Done/Elg'), 
        chalk.bold.gray('Rate'), 
        chalk.bold.gray('Current'), 
        chalk.bold.gray('Best')
      ],
      chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
         , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
         , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
         , 'right': '' , 'right-mid': '' , 'middle': '   ' },
      style: { 'padding-left': 0, 'padding-right': 0 }
    });
    
    stats.forEach(h => {
      const streaks = calculateStreak(h.id);
      
      const rate = h.completion_pct || 0;
      let rateColor = chalk.red;
      if (rate >= 80) rateColor = chalk.green;
      else if (rate >= 50) rateColor = chalk.yellow;
      
      table.push([
        chalk.white(h.name),
        chalk.gray(`${h.total_done}/${h.total_eligible}`),
        rateColor(`${rate}%`),
        chalk.yellow(`${streaks.current_streak}d`),
        chalk.yellow(`${streaks.best_streak}d`)
      ]);
    });
    
    console.log(`\n${chalk.bold('All-Time Statistics')}\n`);
    console.log(table.toString());
    console.log();
  });

// Setup fallback for missing commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s\n'), program.args.join(' '));
  program.outputHelp();
  process.exit(1);
});

program.parse(process.argv);
