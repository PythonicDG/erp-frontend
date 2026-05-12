'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { ROLE_DASHBOARD_MAP } from '@/types/auth';
import { Loader2 } from 'lucide-react';

/**
 * Root page — redirects based on auth state:
 * - Authenticated: redirect to role-based dashboard
 * - Not authenticated: redirect to /login
 */
export default function RootPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        router.push(ROLE_DASHBOARD_MAP[user.role]);
      } else {
        router.push('/login');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <Loader2 className="loading-spinner" size={40} />
        <p className="loading-text">Loading...</p>
      </div>
    </div>
  );
}
