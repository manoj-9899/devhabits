// src/server.js
// ─────────────────────────────────────────────────────────────────────────────
// Entry point.
// 1. Runs DB migrations (schema creation + seeding defaults)
// 2. Starts the Express HTTP server
// ─────────────────────────────────────────────────────────────────────────────

// Run migrations first — this is synchronous and must complete before requests
import './db/migrate.js';

import app from './app.js';

const PORT = parseInt(process.env.PORT ?? '4224', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║  DevHabits API                       ║
  ║  Listening → http://${HOST}:${PORT}   ║
  ╚══════════════════════════════════════╝
  `);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────
// Ensures SQLite WAL checkpoint is flushed before exit.
function shutdown(signal) {
  console.log(`\n[server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[server] HTTP server closed.');
    // better-sqlite3 closes automatically when the process exits,
    // but we import db to trigger the WAL checkpoint flush.
    import('./db/connection.js').then(({ default: db }) => {
      db.close();
      console.log('[db] Connection closed. Goodbye.');
      process.exit(0);
    });
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
