// src/middleware/errorHandler.js
// ─────────────────────────────────────────────────────────────────────────────
// Global error handling middleware.
// Catches anything thrown in routes or async handlers.
// Must be registered LAST in app.js (after all routes).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Async route wrapper — eliminates try/catch boilerplate in every route.
 * Usage:  router.get('/path', asyncHandler(async (req, res) => { ... }))
 *
 * @param {Function} fn - async route handler
 * @returns {Function}
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global Express error handler.
 * Registered via: app.use(errorHandler)
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Function} next
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(`[error] ${req.method} ${req.path} →`, err.message);

  // SQLite constraint violations (e.g. CHECK constraint on state field)
  if (err.message?.includes('SQLITE_CONSTRAINT')) {
    return res.status(400).json({
      status: 'error',
      error: {
        code: 'CONSTRAINT_VIOLATION',
        message: 'Database constraint violation: ' + err.message,
      },
    });
  }

  // Validation errors thrown explicitly with a 4xx status
  if (err.statusCode && err.statusCode < 500) {
    return res.status(err.statusCode).json({
      status: 'error',
      error: { code: err.code ?? 'VALIDATION_ERROR', message: err.message },
    });
  }

  // Catch-all 500
  res.status(500).json({
    status: 'error',
    error: {
      code:    'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An internal error occurred.'
        : err.message,
    },
  });
}

/**
 * Creates a validation error with a 4xx status code attached.
 * Usage: throw createError(400, 'NAME_REQUIRED', 'Habit name is required.')
 *
 * @param {number} statusCode
 * @param {string} code
 * @param {string} message
 * @returns {Error}
 */
export function createError(statusCode, code, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}
