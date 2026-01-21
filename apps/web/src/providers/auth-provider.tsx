'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/auth.store';
import { usersApi } from '@/lib/api/users';

/**
 * Auth Provider
 *
 * Syncs Supabase auth state with Zustand store.
 * Fetches user profile from API after authentication.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, setProfile, setLoading, setProfileLoading, logout } =
    useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setAuth(session?.user ?? null, session);

      // Fetch profile if authenticated
      if (session) {
        setProfileLoading(true);
        try {
          const profile = await usersApi.getMe();
          setProfile(profile);
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          setProfile(null);
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuth(session?.user ?? null, session);

      if (event === 'SIGNED_IN' && session) {
        // Fetch profile on sign in
        setProfileLoading(true);
        try {
          const profile = await usersApi.getMe();
          setProfile(profile);
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          setProfile(null);
        }
      } else if (event === 'SIGNED_OUT') {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, [setAuth, setProfile, setLoading, setProfileLoading, logout]);

  return <>{children}</>;
}

/**
 * Auth hook - convenience wrapper around Zustand store
 */
export function useAuth() {
  const store = useAuthStore();
  const supabase = createClient();

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message === 'Invalid login credentials') {
        throw new Error('Email hoặc mật khẩu không đúng');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.');
      }
      throw error;
    }
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user: store.user,
    session: store.session,
    profile: store.profile,
    loading: store.isLoading,
    isAuthenticated: !!store.session,
    hasRole: store.hasRole,
    isAdmin: store.isAdmin,
    isManager: store.isManager,
    signIn,
    signOut,
  };
}
