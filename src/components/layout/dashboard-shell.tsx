'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import type { UserRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';

interface DashboardShellProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

/**
 * Dashboard shell component that:
 * - Checks authentication status
 * - Validates the user has the required role
 * - Renders sidebar + navbar + main content
 */
export function DashboardShell({ children, requiredRole }: DashboardShellProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== requiredRole) {
      // Redirect to the user's actual dashboard
      const roleMap: Record<UserRole, string> = {
        ADMIN: '/admin/dashboard',
        SUPERVISOR: '/supervisor/dashboard',
        EMPLOYEE: '/employee/dashboard',
      };
      router.push(roleMap[user.role]);
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  if (isLoading || !user) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <Loader2 className="loading-spinner" size={40} />
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== requiredRole) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="dashboard-layout">
      <Sidebar userRole={user.role} />
      <div className="dashboard-main">
        <Navbar />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
