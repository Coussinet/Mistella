// ============================================================
// YoruConnect - App-level Zustand Store
// ============================================================

import { create } from 'zustand';

// -----------------------------------------------------------
// Store Interface
// -----------------------------------------------------------

interface AppStore {
  unreadMessageCount: number;
  unreadTonightRequestCount: number;

  setUnreadMessageCount: (count: number) => void;
  setUnreadTonightRequestCount: (count: number) => void;
  incrementUnreadMessages: () => void;
  incrementUnreadTonightRequests: () => void;
  resetUnreadMessages: () => void;
  resetUnreadTonightRequests: () => void;
}

// -----------------------------------------------------------
// Store Implementation
// -----------------------------------------------------------

export const useAppStore = create<AppStore>((set, get) => ({
  unreadMessageCount: 0,
  unreadTonightRequestCount: 0,

  setUnreadMessageCount: (count) => set({ unreadMessageCount: count }),

  setUnreadTonightRequestCount: (count) =>
    set({ unreadTonightRequestCount: count }),

  incrementUnreadMessages: () =>
    set({ unreadMessageCount: get().unreadMessageCount + 1 }),

  incrementUnreadTonightRequests: () =>
    set({ unreadTonightRequestCount: get().unreadTonightRequestCount + 1 }),

  resetUnreadMessages: () => set({ unreadMessageCount: 0 }),

  resetUnreadTonightRequests: () => set({ unreadTonightRequestCount: 0 }),
}));
