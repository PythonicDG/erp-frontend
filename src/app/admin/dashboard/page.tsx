'use client';

import { useAuthStore } from '@/store/auth-store';
import {
  Users,
  FolderKanban,
  TrendingUp,
  Clock,
  Shield,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-description">
            Overview of your organization&apos;s performance and activity
          </p>
        </div>
        <div className="role-badge role-badge-admin">
          <Shield size={14} />
          <span>Admin Access</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-icon-wrapper stat-icon-blue">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Users</p>
            <p className="stat-value">24</p>
            <p className="stat-change stat-change-up">+3 this month</p>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon-wrapper stat-icon-purple">
            <FolderKanban size={22} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Active Projects</p>
            <p className="stat-value">12</p>
            <p className="stat-change stat-change-up">+2 this week</p>
          </div>
        </div>

        <div className="stat-card stat-card-emerald">
          <div className="stat-icon-wrapper stat-icon-emerald">
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Completion Rate</p>
            <p className="stat-value">87%</p>
            <p className="stat-change stat-change-up">+5% from last month</p>
          </div>
        </div>

        <div className="stat-card stat-card-amber">
          <div className="stat-icon-wrapper stat-icon-amber">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Pending Tasks</p>
            <p className="stat-value">38</p>
            <p className="stat-change stat-change-down">-12 from yesterday</p>
          </div>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="welcome-card">
        <h3 className="welcome-title">Welcome to the Admin Panel</h3>
        <p className="welcome-text">
          As an administrator, you have full access to manage users, projects, and system
          settings. Use the sidebar navigation to explore different sections of the
          application.
        </p>
        <div className="welcome-info">
          <span>Logged in as: <strong>{user?.email}</strong></span>
          <span>Role: <strong>{user?.role}</strong></span>
        </div>
      </div>
    </div>
  );
}
