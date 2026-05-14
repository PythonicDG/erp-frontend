'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, Moon, Sun, User, ChevronDown, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useAuth } from '@/hooks/use-auth';

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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

  // Dark mode toggle
  useEffect(() => {
    const saved = localStorage.getItem('erp-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('erp-theme', next ? 'dark' : 'light');
  };

  const roleColorClass = {
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
        {/* Theme Toggle */}
        <button
          className="navbar-icon-btn"
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          id="theme-toggle-btn"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className="navbar-icon-btn" aria-label="Notifications" id="notifications-btn">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

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
