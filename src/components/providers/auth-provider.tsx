'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useAuth } from '@/hooks/use-auth';

/**
 * AuthProvider handles initial hydration of auth state from cookies.
 * Place this in the root layout to auto-restore sessions on page load.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { hydrate, isAuthenticated, accessToken } = useAuthStore();
  const { fetchUser } = useAuth();
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      hydrate();
    }
  }, [hydrate]);

  // Fetch user data when tokens are available after hydration
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchUser();
    }
  }, [isAuthenticated, accessToken, fetchUser]);

  return <>{children}</>;
}
