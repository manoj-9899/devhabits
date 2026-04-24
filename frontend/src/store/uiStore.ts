// src/store/uiStore.ts
// ─────────────────────────────────────────────────────────────────────────────
// Zustand store for transient UI state only.
// Nothing in here should ever be persisted to the DB.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  addHabitOpen: boolean;
  selectedHabitId: string | null;
  commandPaletteOpen: boolean;

  toggleSidebar: () => void;
  openAddHabit: () => void;
  closeAddHabit: () => void;
  selectHabit: (id: string | null) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  addHabitOpen: false,
  selectedHabitId: null,
  commandPaletteOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openAddHabit: () => set({ addHabitOpen: true }),
  closeAddHabit: () => set({ addHabitOpen: false }),
  selectHabit: (id) => set({ selectedHabitId: id }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
}));
