"use client";

import { create } from "zustand";

export type ActiveDrawerType =
  | "TASK_DETAIL"
  | "CONTENT_DETAIL"
  | "DESIGN_REVIEW";

export interface ActiveDrawerState {
  type: ActiveDrawerType;
  id: string;
}

interface UIStoreState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  activeDrawer: ActiveDrawerState | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  openDrawer: (type: ActiveDrawerType, id: string) => void;
  closeDrawer: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  activeDrawer: null,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  openDrawer: (type, id) => set({ activeDrawer: { type, id } }),
  closeDrawer: () => set({ activeDrawer: null }),
}));
