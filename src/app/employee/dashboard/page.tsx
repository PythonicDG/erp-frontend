'use client';

import { useAuthStore } from '@/store/auth-store';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  ListTodo,
  Briefcase,
} from 'lucide-react';

export default function EmployeeDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-description">
            Track your tasks and project assignments
          </p>
        </div>
        <div className="role-badge role-badge-employee">
          <Briefcase size={14} />
          <span>Employee</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-icon-wrapper stat-icon-blue">
            <FolderKanban size={22} />
          </div>
          <div className="stat-info">
            <p className="stat-label">My Projects</p>
            <p className="stat-value">3</p>
            <p className="stat-change stat-change-up">Active</p>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon-wrapper stat-icon-purple">
            <ListTodo size={22} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Assigned Tasks</p>
            <p className="stat-value">14</p>
            <p className="stat-change stat-change-up">+3 new</p>
          </div>
        </div>

        <div className="stat-card stat-card-emerald">
          <div className="stat-icon-wrapper stat-icon-emerald">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Completed</p>
            <p className="stat-value">41</p>
            <p className="stat-change stat-change-up">+5 this week</p>
          </div>
        </div>

        <div className="stat-card stat-card-amber">
          <div className="stat-icon-wrapper stat-icon-amber">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Due Today</p>
            <p className="stat-value">2</p>
            <p className="stat-change stat-change-down">Focus required</p>
          </div>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="welcome-card">
        <h3 className="welcome-title">Welcome to Your Portal</h3>
        <p className="welcome-text">
          View your assigned projects and tasks from the sidebar. Keep track of deadlines
          and update your progress to stay on top of your work.
        </p>
        <div className="welcome-info">
          <span>Logged in as: <strong>{user?.email}</strong></span>
          <span>Role: <strong>{user?.role}</strong></span>
        </div>
      </div>
    </div>
  );
}
