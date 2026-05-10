#!/usr/bin/env node
// scripts/doctor.js
// ─────────────────────────────────────────────────────────────────────────────
// Health check for a DevHabits installation.
//
// Validates:
//   1. Node.js version  (>= v22.5.0 — required for node:sqlite)
//   2. Workspace shape  (backend/ + frontend/ directories present)
//   3. Dependencies     (installed in both workspaces)
//   4. Database         (config dir writable, db file accessible)
//   5. CLI link         (`habit` resolvable on PATH)
//   6. Ports            (5173 + 4224 available, or already used by us)
//
// Exits 0 on success, 1 if any check failed. Designed to be safely re-runnable
// and never mutate state — only reports.
// ─────────────────────────────────────────────────────────────────────────────

import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

// ── Tiny color helpers (no chalk dep at root) ───────────────────────────────
const C = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const checks = [];
function record(name, ok, detail, hint) {
  checks.push({ name, ok, detail, hint });
}

// ── 1. Node version ─────────────────────────────────────────────────────────
function checkNode() {
  const v = process.versions.node;
  const [major, minor] = v.split('.').map(Number);
  const ok = major > 22 || (major === 22 && minor >= 5);
  record(
    'Node.js version',
    ok,
    `v${v}`,
    'Install Node.js v22.5.0 or newer from https://nodejs.org. node:sqlite requires it.'
  );
}

// ── 2. Workspace shape ──────────────────────────────────────────────────────
function checkWorkspace() {
  const needed = ['backend/package.json', 'frontend/package.json', 'package.json'];
  const missing = needed.filter((p) => !fs.existsSync(path.join(ROOT, p)));
  record(
    'Workspace structure',
    missing.length === 0,
    missing.length === 0 ? 'backend/ + frontend/ + root present' : `missing: ${missing.join(', ')}`,
    'Re-clone the repository. The doctor must run from the project root.'
  );
}

// ── 3. Dependencies installed ───────────────────────────────────────────────
function checkDeps() {
  const checkDir = (rel) => {
    const dir = path.join(ROOT, rel, 'node_modules');
    return fs.existsSync(dir);
  };
  const backend = checkDir('backend');
  const frontend = checkDir('frontend');
  record(
    'Dependencies installed',
    backend && frontend,
    `backend: ${backend ? 'yes' : 'no'} · frontend: ${frontend ? 'yes' : 'no'}`,
    'Run `npm run setup` (or `npm run install:all`) from the project root.'
  );
}

// ── 4. Database accessibility ───────────────────────────────────────────────
function dbConfigDir() {
  if (process.env.DB_PATH) return path.dirname(process.env.DB_PATH);
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || os.homedir(), 'devhabits');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'devhabits');
  }
  return path.join(os.homedir(), '.config', 'devhabits');
}

function checkDb() {
  const dir = dbConfigDir();
  const dbFile = path.join(dir, 'habits.db');
  let writable = false;
  let exists = fs.existsSync(dbFile);

  try {
    fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, '.doctor-probe');
    fs.writeFileSync(probe, '');
    fs.unlinkSync(probe);
    writable = true;
  } catch {
    writable = false;
  }

  const detail = exists
    ? `${dbFile} ${C.gray('(' + fs.statSync(dbFile).size + ' bytes)')}`
    : `${dir} ${C.gray('(no database yet — created on first run)')}`;
  record(
    'Database location',
    writable,
    detail,
    'Check filesystem permissions for the path above. ' +
      'You can override with the DB_PATH environment variable.'
  );
}

// ── 5. CLI link ─────────────────────────────────────────────────────────────
function checkCliLink() {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  const res = spawnSync(cmd, ['habit'], { encoding: 'utf8' });
  const linked = res.status === 0 && (res.stdout || '').trim().length > 0;

  record(
    'CLI link (`habit` on PATH)',
    linked,
    linked ? (res.stdout || '').trim().split(/\r?\n/)[0] : 'not linked',
    'Run `npm run cli:link` (or `cd backend && npm link`). On Windows you ' +
      'may need an Administrator PowerShell the first time.'
  );
}

// ── 6. Port availability ────────────────────────────────────────────────────
function checkPort(port, label) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', (err) => {
      resolve({ port, label, ok: err.code !== 'EADDRINUSE', detail: err.code });
    });
    tester.once('listening', () => {
      tester.close(() => resolve({ port, label, ok: true, detail: 'free' }));
    });
    tester.listen(port, '127.0.0.1');
  });
}

async function checkPorts() {
  const results = await Promise.all([
    checkPort(4224, 'API server'),
    checkPort(5173, 'Vite dev server'),
  ]);
  // Tailored help — finding & killing the offending process is OS-specific.
  const portKillHint = (port) => {
    if (process.platform === 'win32') {
      return [
        `Find what's bound to port ${port}:`,
        `  Get-NetTCPConnection -LocalPort ${port} | Select-Object OwningProcess`,
        `Then stop it:  Stop-Process -Id <pid>`,
      ].join('\n');
    }
    return [
      `Find what's bound to port ${port}:`,
      `  lsof -nP -iTCP:${port} -sTCP:LISTEN`,
      `Then stop it:  kill <pid>`,
    ].join('\n');
  };
  for (const r of results) {
    record(
      `Port ${r.port} (${r.label})`,
      r.ok,
      r.ok ? 'free' : 'in use — possibly an old `npm run dev` still running',
      r.ok ? '' : portKillHint(r.port)
    );
  }
}

// ── Print ────────────────────────────────────────────────────────────────────
function print() {
  console.log('');
  console.log('  ' + C.bold('DevHabits doctor'));
  console.log('  ' + C.gray('─'.repeat(40)));
  console.log('');

  for (const c of checks) {
    const icon = c.ok ? C.green('✓') : C.red('✗');
    const detail = c.detail ? '  ' + C.gray(c.detail) : '';
    console.log(`  ${icon} ${c.name}${detail}`);
    if (!c.ok && c.hint) {
      const lines = c.hint.split('\n').filter(Boolean);
      for (const [i, line] of lines.entries()) {
        const prefix = i === 0 ? `${C.yellow('→')} ` : '  ';
        console.log(`      ${prefix}${C.dim(line)}`);
      }
    }
  }

  const passed = checks.filter((c) => c.ok).length;
  const total = checks.length;

  console.log('');
  if (passed === total) {
    console.log(`  ${C.green('All checks passed.')} ${C.gray(`(${passed}/${total})`)}`);
    console.log(`  ${C.gray('Run')} ${C.cyan('npm run dev')} ${C.gray('or')} ${C.cyan('habit')} ${C.gray('to get going.')}`);
  } else {
    console.log(`  ${C.red(`${total - passed} check(s) failed.`)} ${C.gray(`(${passed}/${total} passed)`)}`);
    console.log(`  ${C.gray('Fix the issues above and re-run')} ${C.cyan('npm run doctor')}${C.gray('.')}`);
  }
  console.log('');
}

// ── Run ──────────────────────────────────────────────────────────────────────
async function main() {
  checkNode();
  checkWorkspace();
  checkDeps();
  checkDb();
  checkCliLink();
  await checkPorts();
  print();
  process.exit(checks.every((c) => c.ok) ? 0 : 1);
}

main().catch((err) => {
  console.error(C.red('doctor crashed:'), err);
  process.exit(1);
});

// (silence unused-import warning for execSync in case someone wants to extend)
void execSync;
