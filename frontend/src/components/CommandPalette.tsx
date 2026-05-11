// src/components/CommandPalette.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Cmd/Ctrl+K palette — fuzzy search over every action in the app.
//
// Architecture note: this is intentionally a self-contained dialog rather than
// a wrapper around <Modal/>. The palette layout (sticky search input, scrolling
// results, sticky footer hint) is materially different from the form-style
// dialog Modal is optimised for. We share the motion variants and a11y
// primitives so the visual language stays unified.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useUIStore } from '../store/uiStore';
import { useCommands, scoreCommand, type Command } from '../lib/commands';
import { modalBackdrop, modalDialog } from '../lib/motion';

export function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette } = useUIStore();
  const allCommands = useCommands();

  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [openSnapshot, setOpenSnapshot] = useState(commandPaletteOpen);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  // Reset the palette exactly when it transitions closed → open. This is the
  // React-sanctioned "derive state during render" pattern and avoids the
  // set-state-in-effect lint rule.
  if (openSnapshot !== commandPaletteOpen) {
    setOpenSnapshot(commandPaletteOpen);
    if (commandPaletteOpen) {
      setQuery('');
      setActiveIdx(0);
    }
  }

  // ── Filtered, sorted, grouped results ───────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return allCommands;

    return allCommands
      .map((cmd) => ({ cmd, score: scoreCommand(q, cmd) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.cmd);
  }, [allCommands, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const cmd of filtered) {
      if (!map.has(cmd.group)) map.set(cmd.group, []);
      map.get(cmd.group)!.push(cmd);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // ── Lifecycle: reset state, focus input, lock body scroll ───────────────
  useEffect(() => {
    if (!commandPaletteOpen) return;

    previousActiveRef.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
      previousActiveRef.current?.focus?.();
    };
  }, [commandPaletteOpen]);

  // Keep the active item visible.
  useEffect(() => {
    if (!commandPaletteOpen) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-idx="${activeIdx}"]`
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, commandPaletteOpen]);

  // ── Action runner ───────────────────────────────────────────────────────
  const runCommand = (cmd: Command) => {
    closeCommandPalette();
    // Defer to next tick so the close animation isn't interrupted by routing.
    queueMicrotask(() => {
      void cmd.perform();
    });
  };

  // ── Keyboard navigation ────────────────────────────────────────────────
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIdx(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIdx(filtered.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[activeIdx];
      if (cmd) runCommand(cmd);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeCommandPalette();
    }
  };

  return createPortal(
    <AnimatePresence>
      {commandPaletteOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[14vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeCommandPalette}
          />

          <motion.div
            variants={modalDialog}
            initial="hidden"
            animate="visible"
            exit="exit"
            onKeyDown={onKeyDown}
            className="relative w-full max-w-xl bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl flex flex-col max-h-[70vh] overflow-hidden"
          >
            {/* Search row ───────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-3 py-3 border-b border-[#30363d] shrink-0">
              <SearchIcon />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIdx(0);
                }}
                placeholder="Type a command or search…"
                className="flex-1 bg-transparent text-sm text-[#e6edf3] placeholder-[#6e7681] focus:outline-none"
                aria-label="Search commands"
                aria-autocomplete="list"
                aria-controls="command-list"
                aria-activedescendant={
                  filtered[activeIdx] ? `cmd-${filtered[activeIdx].id}` : undefined
                }
              />
              <Kbd>esc</Kbd>
            </div>

            {/* Results ──────────────────────────────────────────────────── */}
            <ul
              ref={listRef}
              id="command-list"
              role="listbox"
              aria-label="Commands"
              className="flex-1 overflow-y-auto py-1 m-0 list-none p-0"
            >
              {filtered.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-[#8b949e]">
                  No matching commands.
                  <div className="mt-1 text-xs text-[#6e7681]">
                    Try “new”, “today”, or a habit name.
                  </div>
                </li>
              ) : (
                grouped.map(([group, items]) => (
                  <li key={group}>
                    <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#6e7681]">
                      {group}
                    </div>
                    <ul className="m-0 list-none p-0">
                      {items.map((cmd) => {
                        const idx = filtered.indexOf(cmd);
                        const active = idx === activeIdx;
                        return (
                          <li
                            key={cmd.id}
                            id={`cmd-${cmd.id}`}
                            role="option"
                            aria-selected={active}
                            data-cmd-idx={idx}
                            onMouseEnter={() => setActiveIdx(idx)}
                            onClick={() => runCommand(cmd)}
                            className={clsx(
                              'flex items-center gap-3 px-3 py-2 mx-1 rounded-md cursor-pointer text-sm',
                              'transition-colors duration-75',
                              active
                                ? 'bg-[#21262d] text-[#e6edf3]'
                                : 'text-[#c9d1d9] hover:bg-[#21262d]/60'
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{cmd.title}</div>
                              {cmd.subtitle && (
                                <div className="text-[11px] text-[#6e7681] truncate">
                                  {cmd.subtitle}
                                </div>
                              )}
                            </div>
                            {cmd.kbd && (
                              <span
                                className="flex items-center gap-1 shrink-0"
                                aria-hidden="true"
                              >
                                {cmd.kbd.map((k, i) => (
                                  <Kbd key={i}>{k}</Kbd>
                                ))}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))
              )}
            </ul>

            {/* Footer hint ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-[#30363d] text-[10px] text-[#6e7681] font-mono shrink-0">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>⏎</Kbd>
                select
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>esc</Kbd>
                close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Internals ─────────────────────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-[#30363d] bg-[#0d1117] text-[10px] font-mono text-[#8b949e]">
      {children}
    </kbd>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6e7681] shrink-0"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
