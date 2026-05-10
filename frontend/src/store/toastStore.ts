// src/store/toastStore.ts
// ─────────────────────────────────────────────────────────────────────────────
// Lightweight toast queue. Use the `toast.*` helpers anywhere — no provider.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'undo';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number; // ms; 0 = sticky
  action?: ToastAction;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const DEFAULT_DURATION = 4000;

const genId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = genId();
    const duration = t.duration ?? DEFAULT_DURATION;
    set((s) => ({ toasts: [...s.toasts, { ...t, id, duration }] }));
    if (duration > 0) {
      window.setTimeout(() => get().dismiss(id), duration);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

// Imperative helpers for ergonomic call sites (no hook needed).
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ variant: 'success', title, description }),

  error: (title: string, description?: string) =>
    useToastStore.getState().push({ variant: 'error', title, description }),

  info: (title: string, description?: string) =>
    useToastStore.getState().push({ variant: 'info', title, description }),

  undo: (title: string, onUndo: () => void, description?: string) =>
    useToastStore.getState().push({
      variant: 'undo',
      title,
      description,
      duration: 5000,
      action: { label: 'Undo', onClick: onUndo },
    }),
};
