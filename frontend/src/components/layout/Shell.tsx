// src/components/layout/Shell.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Root layout shell: sidebar + top nav + page content area.
// Registers global keyboard shortcuts.
// ─────────────────────────────────────────────────────────────────────────────
import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { AddHabitModal } from '../AddHabitModal';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../ui/Button';

export function Shell() {
  const { toggleSidebar, sidebarCollapsed, openAddHabit } = useUIStore();
  const navigate = useNavigate();

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openAddHabit(); }
      if (e.key === '1') navigate('/');
      if (e.key === '2') navigate('/today');
      if (e.key === '3') navigate('/habits');
      if (e.key === '4') navigate('/analytics');
      if (e.key === '[') toggleSidebar();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, openAddHabit, toggleSidebar]);

  return (
    <div className="flex h-screen bg-[#0d1117] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-[#30363d] bg-[#0d1117] shrink-0">
          <button
            onClick={toggleSidebar}
            className="text-[#8b949e] hover:text-[#e6edf3] transition-colors p-1 rounded cursor-pointer"
            title="Toggle sidebar ([)"
          >
            {sidebarCollapsed
              ? <MenuIcon />
              : <MenuCloseIcon />
            }
          </button>

          <div className="flex items-center gap-2">
            {/* API status indicator */}
            <ApiStatus />
            <Button
              variant="primary"
              size="sm"
              onClick={openAddHabit}
              icon={<PlusIcon />}
            >
              New Habit
              <kbd className="ml-1.5 text-[10px] bg-[#1a4a2e]/60 px-1 rounded font-mono">N</kbd>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Modals */}
      <AddHabitModal />
    </div>
  );
}

// ── API status dot ─────────────────────────────────────────────────────────
function ApiStatus() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-[#8b949e]">
      <div className="w-1.5 h-1.5 rounded-full bg-[#238636] animate-pulse" />
      <span className="font-mono">:4224</span>
    </div>
  );
}

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const MenuCloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);
