import api from '@/lib/axios';

export type ProjectStatus = 'Draft' | 'Open' | 'In Progress' | 'Closed' | 'Rejected' | 'Pending Approval';
export type StageStatus = 'Locked' | 'Unlocked' | 'Completed';

export interface WorkflowStage {
  id: number;
  name: string;
  order: number;
  status: StageStatus;
  unlocked_at: string | null;
  completed_at: string | null;
}

export interface ActivityLog {
  id: number;
  action: string;
  details: any;
  timestamp: string;
  user_name: string;
}

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
  created_by_name: string;
  stages?: WorkflowStage[];
  activities?: ActivityLog[];
  current_stage?: string;
  customer?: number | string;
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

  getById: async (id: number | string) => {
    const response = await api.get<Project>(`/api/projects/${id}/`);
    return response.data;
  },

  getFullReport: async (id: number | string) => {
    const response = await api.get(`/api/projects/${id}/full_report/`);
    return response.data;
  },

  create: async (data: Partial<Project>) => {
    const response = await api.post<Project>('/api/projects/', data);
    return response.data;
  },

  update: async (id: number | string, data: Partial<Project>) => {
    const response = await api.patch<Project>(`/api/projects/${id}/`, data);
    return response.data;
  },

  delete: async (id: number | string) => {
    await api.delete(`/api/projects/${id}/`);
  },

  getStats: async () => {
    const response = await api.get('/api/projects/statistics/');
    return response.data;
  },

  bulkUpload: async (file: File, skipDuplicates: boolean) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('skip_duplicates', String(skipDuplicates));
    const response = await api.post('/api/projects/bulk-upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadTemplate: async () => {
    const response = await api.get('/api/projects/download-template/', {
      responseType: 'blob',
    });
    return response.data;
  },
};
