import api from '@/lib/axios';

export type FeedbackStatus = 'Scheduled' | 'Pending' | 'Submitted';

export interface PerformanceFeedbackRow {
  sr_no: number;
  parameter: string;
  excellent: boolean;
  good: boolean;
  average: boolean;
  poor: boolean;
  remarks: string;
}

export interface CustomerFeedback {
  id: number;
  project: number;
  project_pid: string;
  project_name: string;
  form_no: string;
  form_revision_no: string;
  form_issue_date: string;
  customer_name: string;
  product_name: string;
  customer_drawing_no: string;
  pcepl_part_no: string;
  panel_dispatch_date: string;
  feedback_collection_date: string;
  usage_duration_months: number;
  performance_feedback: PerformanceFeedbackRow[];
  customer_rep_name: string;
  customer_rep_signature: string;
  customer_rep_date: string;
  pcepl_rep_name: string;
  pcepl_rep_signature: string;
  pcepl_rep_date: string;
  status: FeedbackStatus;
  scheduled_date: string;
  notified: boolean;
  created_at: string;
  updated_at: string;
}

export const feedbackService = {
  getAll: async () => {
    const response = await api.get<CustomerFeedback[]>('/api/projects/feedbacks/');
    return response.data;
  },
  getById: async (id: number | string) => {
    const response = await api.get<CustomerFeedback>(`/api/projects/feedbacks/${id}/`);
    return response.data;
  },
  update: async (id: number | string, data: Partial<CustomerFeedback>) => {
    const response = await api.patch<CustomerFeedback>(`/api/projects/feedbacks/${id}/`, data);
    return response.data;
  },
  generateNow: async (projectId: number) => {
    const response = await api.post<CustomerFeedback>('/api/projects/feedbacks/generate-now/', {
      project_id: projectId
    });
    return response.data;
  }
};
