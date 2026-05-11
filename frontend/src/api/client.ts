// src/api/client.ts
// ─────────────────────────────────────────────────────────────────────────────
// Axios instance pre-configured for the DevHabits API.
// Locally this defaults to http://localhost:4224/api.
// In production, set VITE_API_BASE_URL to your hosted backend URL.
// ─────────────────────────────────────────────────────────────────────────────
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4224/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
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
      error.response?.data?.error?.message ?? error.message ?? 'An unknown error occurred.';
    return Promise.reject(new Error(message));
  }
);
