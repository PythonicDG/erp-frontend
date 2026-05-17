import api from '@/lib/axios';
import { Standard } from './standards-service';

export interface InspectionAuthority {
  id: string;
  authority_id: string;
  name: string;
  category: 'Marine' | 'Customer' | 'QA Agency' | 'Internal' | 'Defence';
  contact_person?: string;
  applicable_standard?: string; // Standard ID
  applicable_standard_details?: Standard;
  applicable_standard_name?: string;
  approval_type?: string;
  status: 'Active' | 'Inactive';
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export const inspectionAuthorityService = {
  getAll: async (params?: any) => {
    const response = await api.get('/api/projects/inspection-authorities/', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/api/projects/inspection-authorities/${id}/`);
    return response.data;
  },
  
  create: async (data: Partial<InspectionAuthority>) => {
    const response = await api.post('/api/projects/inspection-authorities/', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<InspectionAuthority>) => {
    const response = await api.patch(`/api/projects/inspection-authorities/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/api/projects/inspection-authorities/${id}/`);
    return response.data;
  },
  
  search: async (query: string) => {
    const response = await api.get('/api/projects/inspection-authorities/', { params: { search: query } });
    return response.data;
  },

  bulkUpload: async (file: File, skipDuplicates: boolean) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('skip_duplicates', String(skipDuplicates));
    const response = await api.post('/api/projects/inspection-authorities/bulk-upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadTemplate: async () => {
    const response = await api.get('/api/projects/inspection-authorities/download-template/', {
      responseType: 'blob',
    });
    return response.data;
  },

  exportAuthorities: async (params?: any) => {
    const response = await api.get('/api/projects/inspection-authorities/export/', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
