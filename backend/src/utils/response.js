// src/utils/response.js
// ─────────────────────────────────────────────────────────────────────────────
// Standardized API response envelope.
// Every route returns this shape so the frontend can rely on a contract.
//
// Success: { status: 'success', data: { ... } }
// Error:   { status: 'error', error: { code, message } }
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a successful API response.
 *
 * @param {import('express').Response} res
 * @param {object} data
 * @param {number} [statusCode=200]
 */
export function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({ status: 'success', data });
}

/**
 * Send an error API response.
 *
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=400]
 * @param {string} [code='BAD_REQUEST']
 */
export function sendError(res, message, statusCode = 400, code = 'BAD_REQUEST') {
  res.status(statusCode).json({ status: 'error', error: { code, message } });
}
