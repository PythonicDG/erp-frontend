import api from '@/lib/axios';
import { PaginatedResponse } from './project-service';

export type ASCNStatus = 'Draft' | 'Submitted' | 'Reviewed' | 'Approved' | 'Rejected';

export interface DetailOfChange {
  sr_no: number;
  description: string;
  reason: string;
}

export interface ASCN {
  id: number;
  ascn_number: string;
  project: number;
  project_pid: string;
  project_name: string;
  customer_name: string;
  product_name: string;
  customer_part_no: string;
  pcepl_part_no: string;
  applicable_standard: string;
  inspection_authority: string;
  raised_department: string;
  change_initiated_by: string;
  ascn_date: string;
  old_revision_no: string;
  old_revision_date: string | null;
  new_revision: string;
  details_of_change: DetailOfChange[];
  initiator: number | null;
  initiator_name: string;
  reviewed_by: number | null;
  reviewed_by_name: string;
  approved_by: number | null;
  approved_by_name: string;
  status: ASCNStatus;
  attachments?: Array<{ name: string; type: string; base64: string }>;
  created_at: string;
  updated_at: string;
}

export interface ASCNFilters {
  page?: number;
  search?: string;
  status?: string;
  project?: string;
  project_name?: string;
  customer_name?: string;
  date?: string;
  ordering?: string;
}

export const ascnService = {
  getAll: async (filters: ASCNFilters = {}) => {
    const response = await api.get<PaginatedResponse<ASCN>>('/api/projects/ascns/', {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number | string) => {
    const response = await api.get<ASCN>(`/api/projects/ascns/${id}/`);
    return response.data;
  },

  create: async (data: Partial<ASCN>) => {
    const response = await api.post<ASCN>('/api/projects/ascns/', data);
    return response.data;
  },

  update: async (id: number | string, data: Partial<ASCN>) => {
    const response = await api.patch<ASCN>(`/api/projects/ascns/${id}/`, data);
    return response.data;
  },

  delete: async (id: number | string) => {
    await api.delete(`/api/projects/ascns/${id}/`);
  },
};
