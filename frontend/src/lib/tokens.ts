// src/lib/tokens.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for design tokens consumed in `style={{}}` and JS.
// Tailwind classes mirror these values via @theme in index.css.
// ─────────────────────────────────────────────────────────────────────────────

export const COLORS = {
  bg: {
    canvas: '#0d1117',
    subtle: '#161b22',
    subtleAlpha: 'rgba(22, 27, 34, 0.8)',
    inset: '#0a0e13',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  border: {
    default: '#30363d',
    muted: '#21262d',
    strong: '#484f58',
  },
  fg: {
    default: '#e6edf3',
    muted: '#8b949e',
    subtle: '#6e7681',
    placeholder: '#484f58',
  },
  accent: {
    fg: '#58a6ff',
    emphasis: '#1f6feb',
    bg: '#1c2d4a',
  },
  status: {
    done: { fg: '#3fb950', emphasis: '#238636', bg: '#1a4a2e' },
    skipped: { fg: '#58a6ff', emphasis: '#388bfd', bg: '#1c2d4a' },
    missed: { fg: '#f85149', emphasis: '#da3633', bg: '#3d1c1c' },
    pending: { fg: '#8b949e', emphasis: '#30363d', bg: '#161b22' },
    warning: { fg: '#d29922', bg: '#3d2e0d' },
  },
} as const;

export const RADII = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const Z = {
  base: 0,
  sticky: 10,
  dropdown: 30,
  modal: 50,
  toast: 60,
  tooltip: 70,
} as const;
