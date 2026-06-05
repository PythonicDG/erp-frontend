import api from '@/lib/axios';
import { Project } from './project-service';

export interface DashboardData {
  stats: {
    total: number;
    closed: number;
    open: number;
    customers: number;
    ecns?: number;
    pending_ecns?: number;
    pending_ascns?: number;
    completion_rate: number;
  };
  charts: {
    type_distribution: { project_type: string; count: number }[];
    monthly_trend: { month: string; count: number }[];
    stage_distribution: { name: string; count: number }[];
  };
  recent_projects: Project[];
  system_info: {
    company: string;
    financial_year: string;
    version: string;
    last_update: string;
    server: string;
  };
}

export const dashboardService = {
  getData: async (params?: { year?: string; month?: string }) => {
    const response = await api.get<DashboardData>('/api/projects/dashboard/', { params });
    return response.data;
  }
};
