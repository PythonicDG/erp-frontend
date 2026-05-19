import api from '@/lib/axios';
import { PaginatedResponse } from './project-service';

export type ECNStatus = 'Draft' | 'Submitted' | 'Reviewed' | 'Approved' | 'Rejected';

export interface DetailOfChange {
  sr_no: number;
  description: string;
  reason: string;
}

export interface ImpactAnalysisRow {
  name: string;
  selection: 'Yes' | 'No';
  remarks: string;
}

export interface ActionPlanRow {
  action: string;
  responsible: string;
  target_date: string;
  remark: string;
}

export interface ECN {
  id: number;
  ecn_number: string;
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
  ecn_date: string;
  old_revision_no: string;
  old_revision_date: string | null;
  new_revision: string;
  details_of_change: DetailOfChange[];
  impact_analysis: ImpactAnalysisRow[];
  action_plan: ActionPlanRow[];
  initiator: number | null;
  initiator_name: string;
  reviewed_by: number | null;
  reviewed_by_name: string;
  approved_by: number | null;
  approved_by_name: string;
  status: ECNStatus;
  created_at: string;
  updated_at: string;
}

export interface ECNFilters {
  page?: number;
  search?: string;
  status?: string;
  project?: string;
  project_name?: string;
  customer_name?: string;
  date?: string;
  ordering?: string;
}

export const ecnService = {
  getAll: async (filters: ECNFilters = {}) => {
    const response = await api.get<PaginatedResponse<ECN>>('/api/projects/ecns/', {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number | string) => {
    const response = await api.get<ECN>(`/api/projects/ecns/${id}/`);
    return response.data;
  },

  create: async (data: Partial<ECN>) => {
    const response = await api.post<ECN>('/api/projects/ecns/', data);
    return response.data;
  },

  update: async (id: number | string, data: Partial<ECN>) => {
    const response = await api.patch<ECN>(`/api/projects/ecns/${id}/`, data);
    return response.data;
  },

  delete: async (id: number | string) => {
    await api.delete(`/api/projects/ecns/${id}/`);
  },
};
