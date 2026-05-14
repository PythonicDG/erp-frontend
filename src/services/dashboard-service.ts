import api from '@/lib/axios';
import { Project } from './project-service';

export interface DashboardData {
  stats: {
    total: number;
    closed: number;
    open: number;
    customers: number;
    completion_rate: number;
  };
  charts: {
    type_distribution: { project_type: string; count: number }[];
    monthly_trend: { month: string; count: number }[];
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
  getData: async () => {
    const response = await api.get<DashboardData>('/api/projects/dashboard/');
    return response.data;
  }
};
