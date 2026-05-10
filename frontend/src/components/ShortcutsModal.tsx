// src/components/ShortcutsModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// A single source of truth for every keyboard shortcut in the app.
// Triggered from anywhere by `?` or by the Sidebar footer affordance.
// ─────────────────────────────────────────────────────────────────────────────
import { Modal } from './ui/Modal';
import { useUIStore } from '../store/uiStore';
import { META_KEY_LABEL } from '../lib/platform';

interface Shortcut {
  keys: string[];
  label: string;
}

interface Group {
  title: string;
  items: Shortcut[];
}

const GROUPS: Group[] = [
  {
    title: 'Navigation',
    items: [
      { keys: [META_KEY_LABEL, '/'], label: 'Open command palette' },
      { keys: ['1'], label: 'Go to Dashboard' },
      { keys: ['2'], label: 'Go to Today' },
      { keys: ['3'], label: 'Go to Habits' },
      { keys: ['4'], label: 'Go to Analytics' },
    ],
  },
  {
    title: 'Actions',
    items: [
      { keys: ['N'], label: 'New habit' },
      { keys: ['['], label: 'Toggle sidebar' },
      { keys: ['?'], label: 'Show this dialog' },
    ],
  },
  {
    title: 'Today page (when a habit is focused)',
    items: [
      { keys: ['D'], label: 'Mark as Done' },
      { keys: ['S'], label: 'Skip' },
      { keys: ['M'], label: 'Mark as Missed' },
    ],
  },
  {
    title: 'Dialogs',
    items: [
      { keys: ['Esc'], label: 'Close any open dialog' },
      { keys: ['Tab'], label: 'Move focus to next field' },
      { keys: ['Shift', 'Tab'], label: 'Move focus to previous field' },
    ],
  },
];

export function ShortcutsModal() {
  const { shortcutsOpen, closeShortcuts } = useUIStore();

  return (
    <Modal
      open={shortcutsOpen}
      onClose={closeShortcuts}
      title="Keyboard shortcuts"
      subtitle="Press anywhere outside an input field."
      size="md"
    >
      <div className="space-y-5">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] mb-2">
              {group.title}
            </h3>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-4 text-sm py-1.5"
                >
                  <span className="text-[#e6edf3]">{item.label}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {item.keys.map((k, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-[10px] text-[#6e7681]">+</span>}
                        <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded border border-[#30363d] bg-[#21262d] text-[11px] font-mono text-[#e6edf3]">
                          {k}
                        </kbd>
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
