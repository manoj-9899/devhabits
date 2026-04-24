// src/db/connection.js
// ─────────────────────────────────────────────────────────────────────────────
// Single, shared SQLite connection using Node.js 22's built-in node:sqlite.
// Zero native compilation required — ships with Node 22+.
//
// Run with: node --experimental-sqlite src/server.js
// ─────────────────────────────────────────────────────────────────────────────
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import os from 'os';
import fs from 'fs';

// ── Resolve DB path ───────────────────────────────────────────────────────────
function resolveDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;

  let configDir;
  const platform = process.platform;

  if (platform === 'win32') {
    configDir = path.join(process.env.APPDATA || os.homedir(), 'devhabits');
  } else if (platform === 'darwin') {
    configDir = path.join(os.homedir(), 'Library', 'Application Support', 'devhabits');
  } else {
    configDir = path.join(os.homedir(), '.config', 'devhabits');
  }

  fs.mkdirSync(configDir, { recursive: true });
  return path.join(configDir, 'habits.db');
}

export const DB_PATH = resolveDbPath();

// ── Open synchronous connection ───────────────────────────────────────────────
const db = new DatabaseSync(DB_PATH);

// ── Apply PRAGMAs (must be set on every connection) ───────────────────────────
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous   = NORMAL;
  PRAGMA cache_size    = -16000;
  PRAGMA temp_store    = MEMORY;
`);

if (!process.env.CLI_MODE) {
  console.log(`[db] Connected → ${DB_PATH}`);
}

export default db;
