// src/lib/motion.ts
// ─────────────────────────────────────────────────────────────────────────────
// Unified motion language. Every page uses these — never define ad-hoc timings.
// Inspired by Material/Linear: short, decelerated, restrained.
// ─────────────────────────────────────────────────────────────────────────────
import type { Variants, Transition } from 'framer-motion';

export const DURATION = {
  fast: 0.12,
  base: 0.18,
  slow: 0.28,
  deliberate: 0.4,
} as const;

// Cubic-bezier easings (cast as tuple for Framer types).
export const EASE = {
  standard: [0.2, 0, 0, 1] as [number, number, number, number],
  decel: [0, 0, 0.2, 1] as [number, number, number, number],
  accel: [0.4, 0, 1, 1] as [number, number, number, number],
};

// Springs (used for bouncy/playful transitions only — counters, badge bumps).
export const SPRING = {
  soft: { type: 'spring', stiffness: 260, damping: 24 } as Transition,
  snappy: { type: 'spring', stiffness: 380, damping: 30 } as Transition,
  bouncy: { type: 'spring', stiffness: 500, damping: 18 } as Transition,
};

// ── Variants ──────────────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.base, ease: EASE.standard } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.decel } },
  exit: { opacity: 0, y: 6, transition: { duration: DURATION.fast } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATION.base, ease: EASE.decel } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: DURATION.fast } },
};

// Used for staggered list/grid entrances (Dashboard cards, Today rows, Habits rows).
export const listContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.decel } },
};

// Modal entrance (combines backdrop fade + dialog scale).
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.fast } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

export const modalDialog: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE.decel },
  },
  exit: { opacity: 0, y: 8, scale: 0.98, transition: { duration: DURATION.fast } },
};
