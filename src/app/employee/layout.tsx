'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function EmployeeDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell requiredRole="EMPLOYEE">{children}</DashboardShell>;
}
