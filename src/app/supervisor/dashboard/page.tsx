'use client';

import { useAuthStore } from '@/store/auth-store';
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  UserCog,
} from 'lucide-react';

export default function SupervisorDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Supervisor Dashboard</h1>
          <p className="page-description">
            Monitor your team&apos;s progress and manage assigned projects
          </p>
        </div>
        <div className="role-badge role-badge-supervisor">
          <UserCog size={14} />
          <span>Supervisor Access</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-icon-wrapper stat-icon-blue">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Team Members</p>
            <p className="stat-value">8</p>
            <p className="stat-change stat-change-up">All active</p>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon-wrapper stat-icon-purple">
            <FolderKanban size={22} />
          </div>
          <div className="stat-info">
            <p className="stat-label">My Projects</p>
            <p className="stat-value">5</p>
            <p className="stat-change stat-change-up">+1 new</p>
          </div>
        </div>

        <div className="stat-card stat-card-emerald">
          <div className="stat-icon-wrapper stat-icon-emerald">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Completed</p>
            <p className="stat-value">23</p>
            <p className="stat-change stat-change-up">+7 this week</p>
          </div>
        </div>

        <div className="stat-card stat-card-amber">
          <div className="stat-icon-wrapper stat-icon-amber">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Overdue</p>
            <p className="stat-value">2</p>
            <p className="stat-change stat-change-down">Needs attention</p>
          </div>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="welcome-card">
        <h3 className="welcome-title">Welcome to the Supervisor Panel</h3>
        <p className="welcome-text">
          As a supervisor, you can manage your team&apos;s projects and monitor task
          progress. Use the sidebar to navigate between your assigned projects and team
          members.
        </p>
        <div className="welcome-info">
          <span>Logged in as: <strong>{user?.email}</strong></span>
          <span>Role: <strong>{user?.role}</strong></span>
        </div>
      </div>
    </div>
  );
}
