'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, User, ChevronDown, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useAuth } from '@/hooks/use-auth';
import { NotificationDropdown } from './notification-dropdown';

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const roleColorClass = {
    SUPERADMIN: 'role-admin',
    ADMIN: 'role-admin',
    SUPERVISOR: 'role-supervisor',
    EMPLOYEE: 'role-employee',
  }[user?.role || 'EMPLOYEE'];

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button 
          className="navbar-icon-btn lg:hidden mr-4" 
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="navbar-greeting">
          {getGreeting()}, <span className="navbar-username">{user?.first_name || 'User'}</span>
        </h2>
      </div>

      <div className="navbar-right">

        {/* Notifications */}
        <NotificationDropdown />

        {/* User Dropdown */}
        <div className="navbar-user-dropdown" ref={dropdownRef}>
          <button
            className="navbar-user-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            id="user-dropdown-btn"
          >
            <div className="navbar-avatar">
              <User size={16} />
            </div>
            <div className="navbar-user-info">
              <span className="navbar-user-name">{user?.full_name || 'User'}</span>
              <span className={`navbar-user-role ${roleColorClass}`}>
                {user?.role || 'EMPLOYEE'}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`navbar-chevron ${dropdownOpen ? 'navbar-chevron-open' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <p className="dropdown-user-email">{user?.email}</p>
              </div>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item dropdown-item-danger"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                id="logout-btn"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
