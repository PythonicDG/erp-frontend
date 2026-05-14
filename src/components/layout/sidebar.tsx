'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Shield,
  UserCog,
  Briefcase,
  Layers,
} from 'lucide-react';
import type { UserRole } from '@/types/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={20} />,
    roles: ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'],
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: <FolderKanban size={20} />,
    roles: ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'],
  },
  {
    label: 'Team',
    href: '/team',
    icon: <Users size={20} />,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  {
    label: 'Workflow Design',
    href: '/workflow',
    icon: <Layers size={20} />,
    roles: ['ADMIN'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings size={20} />,
    roles: ['ADMIN'],
  },
];

const roleIcons: Record<UserRole, React.ReactNode> = {
  ADMIN: <Shield size={14} />,
  SUPERVISOR: <UserCog size={14} />,
  EMPLOYEE: <Briefcase size={14} />,
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Admin Panel',
  SUPERVISOR: 'Supervisor Panel',
  EMPLOYEE: 'Employee Portal',
};

interface SidebarProps {
  userRole: UserRole;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ userRole, isMobileOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const rolePrefix = `/${userRole.toLowerCase()}`;
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${isMobileOpen ? 'sidebar-mobile-open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <Link href={`${rolePrefix}/dashboard`} className="sidebar-logo" onClick={onClose}>
          <div className="sidebar-logo-icon">
            <Building2 size={22} strokeWidth={1.5} />
          </div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-title">ERP</span>
              <span className="sidebar-logo-subtitle">
                {roleLabels[userRole]}
              </span>
            </div>
          )}
        </Link>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="sidebar-role-badge">
          {roleIcons[userRole]}
          <span>{userRole}</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {filteredItems.map((item) => {
          const href = `${rolePrefix}${item.href}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={item.href}
              href={href}
              className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={onClose}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
              {isActive && <div className="sidebar-nav-indicator" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <p className="sidebar-version">v1.0.0</p>
        )}
      </div>
    </aside>
  );
}
