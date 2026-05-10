// ============================================================
// YoruConnect - Auth Zustand Store
// ============================================================

import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { CastProfile, User } from '../types';

// -----------------------------------------------------------
// Store Interface
// -----------------------------------------------------------

interface AuthStore {
  session: Session | null;
  user: SupabaseUser | null;
  profile: User | null;
  castProfile: CastProfile | null;
  isLoading: boolean;

  setSession: (session: Session | null) => void;
  setUser: (user: SupabaseUser | null) => void;
  setProfile: (profile: User | null) => void;
  setCastProfile: (profile: CastProfile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
}

// -----------------------------------------------------------
// Store Implementation
// -----------------------------------------------------------

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  profile: null,
  castProfile: null,
  isLoading: false,

  setSession: (session) => set({ session }),

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  setCastProfile: (profile) => set({ castProfile: profile }),

  setLoading: (loading) => set({ isLoading: loading }),

  signOut: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      set({
        session: null,
        user: null,
        profile: null,
        castProfile: null,
        isLoading: false,
      });
    }
  },
}));
