// src/components/layout/Sidebar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Dual-mode navigation:
//   • Desktop (md+): inline column with collapse-to-icons mode.
//   • Mobile  (<md): off-canvas drawer with backdrop, animated slide-in.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useUIStore } from '../../store/uiStore';
import { DURATION, EASE, modalBackdrop } from '../../lib/motion';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    kbd: '1',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    path: '/today',
    label: 'Today',
    kbd: '2',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    path: '/habits',
    label: 'Habits',
    kbd: '3',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    path: '/analytics',
    label: 'Analytics',
    kbd: '4',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const { sidebarCollapsed, mobileNavOpen, closeMobileNav } = useUIStore();
  const location = useLocation();

  // Auto-close drawer when navigating between routes (mobile UX standard).
  useEffect(() => {
    closeMobileNav();
  }, [location.pathname, closeMobileNav]);

  // Escape closes drawer on mobile.
  useEffect(() => {
    if (!mobileNavOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileNav();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileNavOpen, closeMobileNav]);

  // Desktop collapse only applies at md+. Mobile drawer always shows full nav.
  const showLabels = !sidebarCollapsed;

  return (
    <>
      {/* Mobile-only backdrop */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            key="sidebar-backdrop"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeMobileNav}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer (slides in from left) */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.aside
            key="sidebar-mobile"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: DURATION.base, ease: EASE.decel }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <SidebarBody showLabels onItemClick={closeMobileNav} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop inline sidebar */}
      <aside
        className={clsx(
          'hidden md:flex h-full border-r border-[#30363d] bg-[#161b22] flex-col',
          'transition-[width] duration-200',
          sidebarCollapsed ? 'w-14' : 'w-52'
        )}
        aria-label="Primary navigation"
      >
        <SidebarBody showLabels={showLabels} />
      </aside>
    </>
  );
}

interface SidebarBodyProps {
  showLabels: boolean;
  onItemClick?: () => void;
}

function SidebarBody({ showLabels, onItemClick }: SidebarBodyProps) {
  const { openAddHabit, openShortcuts } = useUIStore();
  return (
    <>
      {/* Logo */}
      <div
        className={clsx(
          'flex items-center gap-3 px-4 py-4 border-b border-[#30363d] shrink-0',
          !showLabels && 'justify-center px-0'
        )}
      >
        <div className="w-7 h-7 bg-[#238636] rounded-md flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        {showLabels && (
          <div>
            <span className="text-sm font-semibold text-[#e6edf3]">DevHabits</span>
            <div className="text-[10px] text-[#6e7681]">local-first</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, icon, kbd }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            onClick={onItemClick}
            className={({ isActive }) =>
              clsx(
                'group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm',
                'transition-colors duration-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40',
                isActive
                  ? 'bg-[#21262d] text-[#e6edf3] font-medium'
                  : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]/60',
                !showLabels && 'justify-center px-0'
              )
            }
            title={!showLabels ? label : undefined}
          >
            <span className="shrink-0">{icon}</span>
            {showLabels && (
              <>
                <span className="flex-1">{label}</span>
                <span className="text-[10px] text-[#6e7681] font-mono opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline">
                  {kbd}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer hint — clickable affordances, not just static text */}
      <div
        className={clsx(
          'p-3 border-t border-[#30363d] shrink-0',
          !showLabels && 'flex justify-center'
        )}
      >
        {showLabels && (
          <div className="flex flex-col gap-1">
            <FooterHint
              kbd="N"
              label="new habit"
              onClick={() => {
                onItemClick?.();
                openAddHabit();
              }}
            />
            <FooterHint
              kbd="?"
              label="shortcuts"
              onClick={() => {
                onItemClick?.();
                openShortcuts();
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}

function FooterHint({
  kbd,
  label,
  onClick,
}: {
  kbd: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 rounded text-[11px] text-[#6e7681] hover:text-[#e6edf3] hover:bg-[#21262d]/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40"
    >
      <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-[#30363d] bg-[#21262d] text-[10px] font-mono text-[#8b949e]">
        {kbd}
      </kbd>
      <span>{label}</span>
    </button>
  );
}
