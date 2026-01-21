import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

/**
 * User role từ app_metadata (injected bởi custom_access_token_hook)
 */
export type UserRole =
  | 'admin'
  | 'manager'
  | 'ck_staff'
  | 'store_staff'
  | 'coordinator';

/**
 * User profile từ public.users table
 */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
  storeId: number | null;
  store: { id: number; name: string } | null;
  isActive: boolean;
}

/**
 * Auth state interface
 */
interface AuthState {
  // Supabase auth data
  user: User | null;
  session: Session | null;

  // User profile from API
  profile: UserProfile | null;

  // Loading states
  isLoading: boolean;
  isProfileLoading: boolean;

  // Computed helpers
  isAuthenticated: boolean;
  accessToken: string | null;

  // Actions
  setAuth: (user: User | null, session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setProfileLoading: (loading: boolean) => void;
  logout: () => void;

  // Role helpers
  hasRole: (...roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
}

/**
 * Auth Store - Zustand Singleton
 *
 * Single source of truth for authentication state.
 * Persists session to localStorage for faster rehydration.
 *
 * USAGE:
 * ```tsx
 * const { user, profile, isAuthenticated, hasRole } = useAuthStore();
 *
 * if (!isAuthenticated) return <LoginPage />;
 * if (!hasRole('admin', 'manager')) return <AccessDenied />;
 * ```
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      isProfileLoading: false,

      // Computed (derived from state)
      get isAuthenticated() {
        return !!get().session;
      },
      get accessToken() {
        return get().session?.access_token ?? null;
      },

      // Actions
      setAuth: (user, session) => {
        set({
          user,
          session,
          isLoading: false,
          // Clear profile when logging out
          ...(session === null ? { profile: null } : {}),
        });
      },

      setProfile: (profile) => {
        set({ profile, isProfileLoading: false });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setProfileLoading: (isProfileLoading) => {
        set({ isProfileLoading });
      },

      logout: () => {
        set({
          user: null,
          session: null,
          profile: null,
          isLoading: false,
          isProfileLoading: false,
        });
      },

      // Role helpers
      hasRole: (...roles) => {
        const profile = get().profile;
        if (!profile) return false;
        return roles.includes(profile.role);
      },

      isAdmin: () => get().hasRole('admin'),
      isManager: () => get().hasRole('admin', 'manager'),
    }),
    {
      name: 'auth-storage',
      // Only persist session for faster rehydration
      partialize: (state) => ({
        session: state.session,
        user: state.user,
      }),
    },
  ),
);

/**
 * Helper hook to get role from store
 */
export const useUserRole = (): UserRole | null => {
  return useAuthStore((state) => state.profile?.role ?? null);
};

/**
 * Helper hook to check authentication
 */
export const useIsAuthenticated = (): boolean => {
  return useAuthStore((state) => !!state.session);
};
