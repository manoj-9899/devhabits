// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useUIStore } from '../../store/uiStore';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    kbd: '1',
  },
  {
    path: '/today',
    label: 'Today',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    kbd: '2',
  },
  {
    path: '/habits',
    label: 'Habits',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    kbd: '3',
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    kbd: '4',
  },
];

export function Sidebar() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <aside
      className={clsx(
        'h-full border-r border-[#30363d] bg-[#161b22] flex flex-col transition-all duration-200',
        sidebarCollapsed ? 'w-14' : 'w-52'
      )}
    >
      {/* Logo */}
      <div
        className={clsx(
          'flex items-center gap-3 px-4 py-4 border-b border-[#30363d]',
          sidebarCollapsed && 'justify-center px-0'
        )}
      >
        <div className="w-7 h-7 bg-[#238636] rounded-md flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        {!sidebarCollapsed && (
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
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-100',
                'group relative',
                isActive
                  ? 'bg-[#21262d] text-[#e6edf3] font-medium'
                  : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]/60',
                sidebarCollapsed && 'justify-center px-0'
              )
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <span className="shrink-0">{icon}</span>
            {!sidebarCollapsed && (
              <>
                <span className="flex-1">{label}</span>
                <span className="text-[10px] text-[#6e7681] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  ⌘{kbd}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        className={clsx('p-3 border-t border-[#30363d]', sidebarCollapsed && 'flex justify-center')}
      >
        {!sidebarCollapsed && (
          <div className="px-2 py-1.5">
            <div className="text-[10px] text-[#6e7681] font-mono leading-relaxed">
              <span className="text-[#8b949e]">N</span> new habit&nbsp;&nbsp;
              <span className="text-[#8b949e]">?</span> shortcuts
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
