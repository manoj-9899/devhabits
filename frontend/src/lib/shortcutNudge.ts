// src/lib/shortcutNudge.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tracks how many times an action was triggered by mouse vs. keyboard, and
// suggests the keyboard shortcut once after a threshold of mouse uses.
// Persisted in localStorage so the suggestion is shown at most once per user.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'habit-tracker.shortcut-nudge.v1';
const DEFAULT_THRESHOLD = 3;

interface NudgeState {
  /** Mouse-click count per action id. */
  clicks: Record<string, number>;
  /** Whether the nudge for an action has already been shown (or the user
   *  already used the keyboard shortcut), in which case never nag again. */
  shown: Record<string, boolean>;
}

function load(): NudgeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { clicks: {}, shown: {} };
    const parsed = JSON.parse(raw) as Partial<NudgeState>;
    return {
      clicks: parsed.clicks ?? {},
      shown: parsed.shown ?? {},
    };
  } catch {
    return { clicks: {}, shown: {} };
  }
}

function save(state: NudgeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota / private mode — silently no-op.
  }
}

/**
 * Record a mouse-driven invocation. Returns `true` exactly once — on the
 * click that crosses the threshold — so the caller can show a one-time toast.
 */
export function trackMouseAction(actionId: string, threshold = DEFAULT_THRESHOLD): boolean {
  const state = load();
  if (state.shown[actionId]) return false;

  state.clicks[actionId] = (state.clicks[actionId] ?? 0) + 1;

  if (state.clicks[actionId] >= threshold) {
    state.shown[actionId] = true;
    save(state);
    return true;
  }
  save(state);
  return false;
}

/**
 * Mark the keyboard shortcut for `actionId` as discovered. Suppresses any
 * future nudge for that action — the user already knows the shortcut.
 */
export function markShortcutUsed(actionId: string): void {
  const state = load();
  if (state.shown[actionId]) return;
  state.shown[actionId] = true;
  save(state);
}
