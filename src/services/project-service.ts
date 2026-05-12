import api from '@/lib/axios';

export type ProjectStatus = 'Draft' | 'Open' | 'In Progress' | 'Closed' | 'Rejected';

export interface Project {
  id: number;
  pid: string;
  name: string;
  customer_name: string;
  customer_part_no: string;
  pcepl_part_no: string;
  project_type: string;
  inspection_authority: string;
  applicable_standard: string;
  date_received: string;
  month_received: string;
  target_completion_date: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectFilters {
  page?: number;
  search?: string;
  status?: string;
  project_type?: string;
  ordering?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const projectService = {
  getAll: async (filters: ProjectFilters = {}) => {
    const response = await api.get<PaginatedResponse<Project>>('/api/projects/', {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Project>(`/api/projects/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Project>) => {
    const response = await api.post<Project>('/api/projects/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Project>) => {
    const response = await api.patch<Project>(`/api/projects/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/projects/${id}/`);
  },

  getStats: async () => {
    const response = await api.get('/api/projects/statistics/');
    return response.data;
  },
};
