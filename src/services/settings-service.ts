import api from '@/lib/axios';

export interface CompanyProfile {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  logo?: string;
  audit_logs_enabled?: boolean;
}

export interface AuditLog {
  id: number;
  user_name: string;
  user_role: string;
  action: string;
  target: string;
  module: string;
  timestamp: string;
  status: string;
}

export const settingsService = {
  getCompanyProfile: async () => {
    const response = await api.get<CompanyProfile>('/api/auth/company-profile/');
    return response.data;
  },

  updateCompanyProfile: async (data: Partial<CompanyProfile>) => {
    const response = await api.patch<CompanyProfile>('/api/auth/company-profile/', data);
    return response.data;
  },

  getAuditLogs: async (params?: any) => {
    const response = await api.get<AuditLog[]>('/api/auth/audit-logs/', { params });
    return response.data;
  },

  updateLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.patch<CompanyProfile>('/api/auth/company-profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
