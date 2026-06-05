import api from '@/lib/axios';

export type FieldType = 
  | 'text' | 'textarea' | 'number' | 'email' | 'phone' 
  | 'dropdown' | 'multi_select' | 'checkbox' | 'radio' 
  | 'date' | 'file' | 'grid' | 'boolean';

export interface FormField {
  id: number;
  section?: string; // Simple string now
  label: string;
  name: string;
  field_type: FieldType;
  placeholder?: string;
  default_value?: string;
  is_required: boolean;
  min_length?: number;
  max_length?: number;
  is_readonly: boolean;
  order: number;
  options: { label: string; value: string }[];
  configuration?: {
    columns?: string[];
    rows?: string[];
    is_dynamic?: boolean;
  };
}

export interface StageTemplate {
  id: number;
  name: string;
  code: string;
  description: string;
  order: number;
  is_mandatory: boolean;
  is_active: boolean;
  assigned_role: string;
  approval_required: boolean;
  allow_attachments: boolean;
  fields: FormField[];
  duration_high: number;
  duration_medium: number;
  duration_low: number;
}

export interface StageSubmission {
  id: number;
  submitted_by_name: string;
  data: any;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  remarks?: string;
  submitted_at: string;
}

export interface StageInstance {
  id: number;
  template_details: StageTemplate;
  status: 'Locked' | 'Unlocked' | 'In Progress' | 'Submitted' | 'Pending Approval' | 'Under Review' | 'Approved' | 'Rejected';
  order: number;
  unlocked_at: string | null;
  completed_at: string | null;
  current_submission: StageSubmission | null;
  activities: any[];
  planned_start_date: string | null;
  planned_end_date: string | null;
  duration: number | null;
  actual_completion_date: string | null;
  delay_days: number | null;
  remarks: string | null;
}

export const workflowService = {
  getTemplates: async () => {
    const response = await api.get<StageTemplate[]>('/api/workflow/templates/');
    return response.data;
  },
  
  getProjectStages: async (projectId: string | number) => {
    const response = await api.get<StageInstance[]>(`/api/workflow/instances/?project_id=${projectId}`);
    return response.data;
  },

  submitStage: async (instanceId: number, data: any, isFinal: boolean = true) => {
    const response = await api.post(`/api/workflow/instances/${instanceId}/submit/`, {
      data,
      is_final: isFinal
    });
    return response.data;
  },

  approveStage: async (instanceId: number, remarks?: string) => {
    const response = await api.post(`/api/workflow/instances/${instanceId}/approve/`, { remarks });
    return response.data;
  },

  rejectStage: async (instanceId: number, remarks: string) => {
    const response = await api.post(`/api/workflow/instances/${instanceId}/reject/`, { remarks });
    return response.data;
  },

  deleteTemplate: async (id: number) => {
    const response = await api.delete(`/api/workflow/templates/${id}/`);
    return response.data;
  },

  createTemplate: async (data: any) => {
    const response = await api.post('/api/workflow/templates/', data);
    return response.data;
  },

  updateTemplate: async (id: number, data: any) => {
    const response = await api.patch<StageTemplate>(`/api/workflow/templates/${id}/`, data);
    return response.data;
  },

  reorderTemplates: async (orders: { id: number; order: number }[]) => {
    const response = await api.post('/api/workflow/templates/reorder/', { orders });
    return response.data;
  },

  syncFields: async (stageId: number | string, fields: any[]) => {
    const response = await api.post(`/api/workflow/templates/${stageId}/sync_fields/`, { fields });
    return response.data;
  }
};

