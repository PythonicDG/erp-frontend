'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import type { UserRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const pathname = usePathname();

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

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const pathParts = pathname.split('/');
      const tabKey = pathParts[2]; // e.g. projects, ecn, etc.
      
      if (tabKey && tabKey !== 'dashboard' && user.role !== 'ADMIN') {
        const allowed = user.allowed_tabs || [];
        if (!allowed.includes(tabKey)) {
          toast.error(`You do not have access to ${tabKey.toUpperCase()}.`);
          const roleMap: Record<UserRole, string> = {
            ADMIN: '/admin/dashboard',
            SUPERVISOR: '/supervisor/dashboard',
            EMPLOYEE: '/employee/dashboard',
          };
          router.push(roleMap[user.role]);
        }
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
 
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
       <Sidebar 
         userRole={user.role} 
         isMobileOpen={isMobileOpen} 
         onClose={() => setIsMobileOpen(false)} 
       />
       
       {isMobileOpen && (
         <div 
           className="sidebar-overlay lg:hidden" 
           onClick={() => setIsMobileOpen(false)} 
         />
       )}
 
       <div className="dashboard-main">
         <Navbar onMenuClick={() => setIsMobileOpen(true)} />
         <main className="dashboard-content">
           {children}
         </main>
       </div>
     </div>
   );
 }
