// src/lib/platform.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tiny cross-platform helpers for keyboard shortcuts. Mac uses ⌘, others Ctrl.
// ─────────────────────────────────────────────────────────────────────────────

export const IS_MAC =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || '');

export const META_KEY_LABEL = IS_MAC ? '⌘' : 'Ctrl';

/** Returns true if the event represents the platform "command" modifier
 *  (Cmd on Mac, Ctrl elsewhere). Used for cross-platform shortcuts. */
export function isMetaPressed(e: KeyboardEvent | React.KeyboardEvent): boolean {
  return IS_MAC ? e.metaKey : e.ctrlKey;
}
