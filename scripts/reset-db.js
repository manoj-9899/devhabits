#!/usr/bin/env node
// scripts/reset-db.js
// ─────────────────────────────────────────────────────────────────────────────
// Locate and (with confirmation) delete the local SQLite database.
//
// Usage:
//   npm run db:reset            # interactive — prompts before deleting
//   npm run db:reset -- --yes   # non-interactive — for scripts / CI
//   npm run db:where            # just print the path, don't delete (alias)
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const C = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function dbDir() {
  if (process.env.DB_PATH) return path.dirname(process.env.DB_PATH);
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || os.homedir(), 'devhabits');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'devhabits');
  }
  return path.join(os.homedir(), '.config', 'devhabits');
}

const args = new Set(process.argv.slice(2));
const whereOnly = args.has('--where');
const autoYes = args.has('--yes') || args.has('-y') || process.env.DEVHABITS_RESET_YES === '1';

const dir = dbDir();
const target = process.env.DB_PATH ?? path.join(dir, 'habits.db');

// SQLite WAL mode creates -wal and -shm sidecars; we sweep them all up.
const candidates = [target, target + '-wal', target + '-shm', target + '-journal'];
const existing = candidates.filter((p) => fs.existsSync(p));

console.log('');
console.log('  ' + C.bold('DevHabits database location'));
console.log('  ' + C.gray('─'.repeat(40)));
console.log(`  ${C.cyan(target)}`);
if (existing.length === 0) {
  console.log(`  ${C.gray('(no database file yet — nothing to reset)')}`);
  console.log('');
  process.exit(0);
}
const totalBytes = existing.reduce((sum, p) => sum + fs.statSync(p).size, 0);
console.log(`  ${C.gray(`${existing.length} file(s), ${totalBytes} bytes total`)}`);
console.log('');

if (whereOnly) process.exit(0);

async function confirm() {
  if (autoYes) return true;
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(
    `  ${C.yellow('This will permanently delete all habits and logs.')} ` +
      `Type ${C.bold('yes')} to confirm: `
  );
  rl.close();
  return answer.trim().toLowerCase() === 'yes';
}

const ok = await confirm();
if (!ok) {
  console.log('');
  console.log(`  ${C.gray('Cancelled. Nothing was deleted.')}`);
  console.log('');
  process.exit(1);
}

let deleted = 0;
for (const p of existing) {
  try {
    fs.unlinkSync(p);
    deleted++;
  } catch (err) {
    console.error(`  ${C.red('✗')} could not delete ${p}: ${err.message}`);
  }
}

console.log('');
console.log(
  `  ${C.green('✓')} Deleted ${deleted} file(s). ` +
    C.gray('Next `habit` or `npm run dev` will recreate an empty database.')
);
console.log('');
