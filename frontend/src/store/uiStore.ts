// src/store/uiStore.ts
// ─────────────────────────────────────────────────────────────────────────────
// Zustand store for transient UI state only.
// Nothing in here should ever be persisted to the DB.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';

interface UIState {
  // Desktop: icon-only sidebar mode
  sidebarCollapsed: boolean;
  // Mobile: off-canvas drawer open
  mobileNavOpen: boolean;
  addHabitOpen: boolean;
  shortcutsOpen: boolean;
  selectedHabitId: string | null;
  commandPaletteOpen: boolean;

  toggleSidebar: () => void;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  openAddHabit: () => void;
  closeAddHabit: () => void;
  openShortcuts: () => void;
  closeShortcuts: () => void;
  selectHabit: (id: string | null) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  addHabitOpen: false,
  shortcutsOpen: false,
  selectedHabitId: null,
  commandPaletteOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  openAddHabit: () => set({ addHabitOpen: true }),
  closeAddHabit: () => set({ addHabitOpen: false }),
  openShortcuts: () => set({ shortcutsOpen: true }),
  closeShortcuts: () => set({ shortcutsOpen: false }),
  selectHabit: (id) => set({ selectedHabitId: id }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
}));
