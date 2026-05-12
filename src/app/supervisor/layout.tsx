'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function SupervisorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell requiredRole="SUPERVISOR">{children}</DashboardShell>;
}
