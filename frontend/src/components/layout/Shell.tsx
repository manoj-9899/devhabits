// src/components/layout/Shell.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Root layout shell: sidebar + top nav + page content area.
// Registers global keyboard shortcuts and the Toaster.
// ─────────────────────────────────────────────────────────────────────────────
import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { AddHabitModal } from '../AddHabitModal';
import { ShortcutsModal } from '../ShortcutsModal';
import { CommandPalette } from '../CommandPalette';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../ui/Button';
import { Toaster } from '../ui/Toaster';
import { isMetaPressed, META_KEY_LABEL } from '../../lib/platform';
import { trackMouseAction, markShortcutUsed } from '../../lib/shortcutNudge';
import { toast } from '../../store/toastStore';

const MOBILE_QUERY = '(max-width: 767px)';

export function Shell() {
  const {
    toggleSidebar,
    sidebarCollapsed,
    openMobileNav,
    openAddHabit,
    openShortcuts,
    openCommandPalette,
  } = useUIStore();
  const navigate = useNavigate();

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      const editable = target.isContentEditable;
      const inField =
        editable || tag === 'input' || tag === 'textarea' || tag === 'select';

      // Command palette — works EVEN inside text fields (universal opener).
      //
      // Two keys accepted:
      //   1. Cmd/Ctrl + /  → primary, advertised. Not claimed by any browser.
      //   2. Cmd/Ctrl + K  → secondary fallback. Chromium on Windows hijacks
      //                      this for the omnibox and preventDefault() can't
      //                      override it, but it works in plenty of other
      //                      browsers, so we keep it registered silently.
      if (
        isMetaPressed(e) &&
        (e.key === '/' || e.key === 'k' || e.key === 'K')
      ) {
        e.preventDefault();
        openCommandPalette();
        return;
      }

      // From here on, ignore typing inside fields, and ignore other modifier
      // combos so we don't hijack browser/OS shortcuts.
      if (inField) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // `?` — most layouts produce it via Shift+/, so accept either signal.
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        openShortcuts();
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        markShortcutUsed('new-habit');
        openAddHabit();
        return;
      }
      if (e.key === '1') navigate('/');
      if (e.key === '2') navigate('/today');
      if (e.key === '3') navigate('/habits');
      if (e.key === '4') navigate('/analytics');
      if (e.key === '[') toggleSidebar();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, openAddHabit, openShortcuts, openCommandPalette, toggleSidebar]);

  // Click handler for the New-Habit button — opens the modal AND tracks the
  // mouse usage so we can nudge the user toward `N` after a few clicks.
  const handleNewHabitClick = () => {
    const shouldNudge = trackMouseAction('new-habit');
    openAddHabit();
    if (shouldNudge) {
      toast.info('Tip: press N to add habits faster.');
    }
  };

  // Hamburger does the right thing per viewport.
  const handleMenuClick = () => {
    if (window.matchMedia(MOBILE_QUERY).matches) {
      openMobileNav();
    } else {
      toggleSidebar();
    }
  };

  return (
    <div className="flex h-screen bg-[#0d1117] overflow-hidden">
      {/* Skip-to-content link — visible only when keyboard-focused. */}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#30363d] bg-[#0d1117] shrink-0 gap-2">
          <button
            onClick={handleMenuClick}
            className="text-[#8b949e] hover:text-[#e6edf3] transition-colors p-1.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40 -ml-1"
            aria-label="Toggle navigation"
            title="Toggle sidebar ([)"
          >
            {sidebarCollapsed ? <MenuIcon /> : <MenuCloseIcon />}
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <ApiStatus />
            <CommandPaletteTrigger onClick={openCommandPalette} />
            <Button
              variant="primary"
              size="sm"
              onClick={handleNewHabitClick}
              icon={<PlusIcon />}
              aria-label="New habit"
            >
              <span className="hidden sm:inline">New Habit</span>
              <kbd className="ml-1.5 text-[10px] bg-[#1a4a2e]/60 px-1 rounded font-mono hidden md:inline">
                N
              </kbd>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          tabIndex={-1}
          aria-label="Page content"
          className="flex-1 overflow-y-auto focus:outline-none"
        >
          <Outlet />
        </main>
      </div>

      {/* Modals & overlays */}
      <AddHabitModal />
      <ShortcutsModal />
      <CommandPalette />
      <Toaster />
    </div>
  );
}

// ── API status dot ─────────────────────────────────────────────────────────
function ApiStatus() {
  return (
    <div
      className="hidden sm:flex items-center gap-1.5 text-xs text-[#8b949e]"
      aria-label="API connected"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-[#238636] animate-pulse" aria-hidden="true" />
      <span className="font-mono">:4224</span>
    </div>
  );
}

// ── Command palette trigger ─────────────────────────────────────────────────
// Mouse affordance for the Cmd/Ctrl+K palette. Mimics the search-bar pattern
// used by Linear/Vercel: looks like an input but is just a button.
function CommandPaletteTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open command palette"
      title={`Search commands (${META_KEY_LABEL}+/)`}
      className="hidden sm:inline-flex items-center gap-2 h-8 pl-2.5 pr-1.5 rounded-md border border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40"
    >
      <SearchIcon />
      <span className="text-xs hidden md:inline">Search…</span>
      <kbd className="text-[10px] font-mono bg-[#21262d] border border-[#30363d] px-1 py-0.5 rounded leading-none">
        {META_KEY_LABEL}+/
      </kbd>
    </button>
  );
}

const SearchIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const MenuCloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="14" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);
