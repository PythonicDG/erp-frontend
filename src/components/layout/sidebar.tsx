'use client';

import { useState, useEffect } from 'react';
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
  BookOpen,
} from 'lucide-react';
import type { UserRole } from '@/types/auth';
import { settingsService, CompanyProfile } from '@/services/settings-service';

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
    label: 'Project Master',
    href: '/projects',
    icon: <FolderKanban size={20} />,
    roles: ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'],
  },
  {
    label: 'User Master',
    href: '/team',
    icon: <Users size={20} />,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  {
    label: 'Customer Masters',
    href: '/customers',
    icon: <Building2 size={20} />,
    roles: ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'],
  },
  {
    label: 'Standards Master',
    href: '/standards',
    icon: <BookOpen size={20} />,
    roles: ['ADMIN'],
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
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await settingsService.getCompanyProfile();
        setProfile(data);
      } catch (error) {
        // Silently fail, fallback to default ERP name
      }
    };
    fetchProfile();
  }, []);

  const rolePrefix = `/${userRole.toLowerCase()}`;
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  const logoUrl = profile?.logo 
    ? (profile.logo.startsWith('http') ? profile.logo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${profile.logo}`)
    : null;

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${isMobileOpen ? 'sidebar-mobile-open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <Link href={`${rolePrefix}/dashboard`} className="sidebar-logo" onClick={onClose}>
          <div className="sidebar-logo-icon">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-0.5" />
            ) : (
              <Building2 size={22} strokeWidth={1.5} />
            )}
          </div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-title">{profile?.name || 'ERP'}</span>
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
