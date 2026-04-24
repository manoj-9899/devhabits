// src/app.js
// ─────────────────────────────────────────────────────────────────────────────
// Express application setup.
// Separated from server.js so it can be imported by tests without
// starting the HTTP listener.
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express';
import cors from 'cors';

import habitsRouter from './routes/habits.js';
import logsRouter from './routes/logs.js';
import analyticsRouter from './routes/analytics.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4224'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/habits', habitsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/analytics', analyticsRouter);

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` },
  });
});

// ── Global error handler (must be last) ────────────────────────────────────
app.use(errorHandler);

export default app;
