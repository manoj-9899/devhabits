// src/api/client.ts
// ─────────────────────────────────────────────────────────────────────────────
// Axios instance pre-configured for the local DevHabits API.
// All calls go to http://localhost:4224/api
// ─────────────────────────────────────────────────────────────────────────────
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:4224/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
});

// Unwrap the success envelope so callers get `data` directly
api.interceptors.response.use(
  (response) => {
    if (response.data?.status === 'success') {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.error?.message ??
      error.message ??
      'An unknown error occurred.';
    return Promise.reject(new Error(message));
  }
);
