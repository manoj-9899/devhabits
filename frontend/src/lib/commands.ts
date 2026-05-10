// src/lib/commands.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for every command exposed via the Command Palette
// (Cmd/Ctrl + K). Static commands (navigation, actions) are merged with
// dynamic per-habit commands (archive/log) at hook time.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { useHabits, useArchiveHabit, useRestoreHabit } from '../hooks/index';
import { toast } from '../store/toastStore';

export interface Command {
  id: string;
  title: string;
  subtitle?: string;
  group: 'Navigation' | 'Actions' | 'Habits';
  /** Keyboard shortcut to display next to the command (informational). */
  kbd?: string[];
  /** Extra search keywords joined with the title for fuzzy matching. */
  keywords?: string;
  perform: () => void | Promise<void>;
}

/** Live, memoised list of all commands available from the palette. */
export function useCommands(): Command[] {
  const navigate = useNavigate();
  const { openAddHabit, openShortcuts, toggleSidebar } = useUIStore();
  const { data } = useHabits(true);
  const { mutateAsync: archiveMut } = useArchiveHabit();
  const { mutateAsync: restoreMut } = useRestoreHabit();

  return useMemo(() => {
    const commands: Command[] = [
      // ── Navigation ──────────────────────────────────────────────────────
      {
        id: 'nav-dashboard',
        title: 'Go to Dashboard',
        group: 'Navigation',
        kbd: ['1'],
        keywords: 'home overview',
        perform: () => navigate('/'),
      },
      {
        id: 'nav-today',
        title: 'Go to Today',
        group: 'Navigation',
        kbd: ['2'],
        keywords: 'inbox log',
        perform: () => navigate('/today'),
      },
      {
        id: 'nav-habits',
        title: 'Go to Habits',
        group: 'Navigation',
        kbd: ['3'],
        keywords: 'manage list',
        perform: () => navigate('/habits'),
      },
      {
        id: 'nav-analytics',
        title: 'Go to Analytics',
        group: 'Navigation',
        kbd: ['4'],
        keywords: 'stats charts heatmap trends',
        perform: () => navigate('/analytics'),
      },

      // ── Actions ─────────────────────────────────────────────────────────
      {
        id: 'new-habit',
        title: 'New habit',
        group: 'Actions',
        kbd: ['N'],
        keywords: 'create add',
        perform: openAddHabit,
      },
      {
        id: 'show-shortcuts',
        title: 'Show keyboard shortcuts',
        group: 'Actions',
        kbd: ['?'],
        keywords: 'help cheatsheet',
        perform: openShortcuts,
      },
      {
        id: 'toggle-sidebar',
        title: 'Toggle sidebar',
        group: 'Actions',
        kbd: ['['],
        keywords: 'collapse expand nav',
        perform: toggleSidebar,
      },
    ];

    // ── Dynamic per-habit archive commands ────────────────────────────────
    const habits = data?.habits ?? [];
    for (const h of habits) {
      commands.push({
        id: `archive-${h.id}`,
        title: `Archive: ${h.name}`,
        subtitle: h.category,
        group: 'Habits',
        keywords: `archive remove ${h.category}`,
        perform: async () => {
          try {
            await archiveMut(h.id);
            toast.undo(`Archived "${h.name}"`, () => {
              void restoreMut(h.id).catch(() =>
                toast.error('Could not restore habit')
              );
            });
          } catch {
            toast.error('Could not archive habit');
          }
        },
      });
    }

    return commands;
  }, [navigate, openAddHabit, openShortcuts, toggleSidebar, data, archiveMut, restoreMut]);
}

// ── Fuzzy scoring ─────────────────────────────────────────────────────────────

/**
 * Score a command against a query. Higher is better; -1 means no match.
 * Heuristic ranking:
 *   exact title match  → 10000
 *   title prefix match →  5000
 *   substring match    →  1000 - position
 *   subsequence match  →   100
 */
export function scoreCommand(query: string, cmd: Command): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  const title = cmd.title.toLowerCase();
  const haystack = `${title} ${(cmd.keywords ?? '').toLowerCase()}`;

  if (title === q) return 10000;
  if (title.startsWith(q)) return 5000;
  const idx = haystack.indexOf(q);
  if (idx !== -1) return 1000 - idx;

  // Subsequence: every char of q appears in order somewhere in haystack.
  let qi = 0;
  for (let i = 0; i < haystack.length && qi < q.length; i++) {
    if (haystack[i] === q[qi]) qi++;
  }
  return qi === q.length ? 100 : -1;
}
