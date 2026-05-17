import api from '@/lib/axios';

export interface Standard {
  id: string;
  standard_number: string;
  standard_name: string;
  revision?: string;
  release_year?: number;
  category: 'ISO' | 'IEC' | 'Marine IEC' | 'IP' | 'EMC' | 'Defence';
  description?: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export const standardsService = {
  getAll: async (params?: any) => {
    const response = await api.get('/api/projects/standards/', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/api/projects/standards/${id}/`);
    return response.data;
  },
  
  create: async (data: Partial<Standard>) => {
    const response = await api.post('/api/projects/standards/', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Standard>) => {
    const response = await api.patch(`/api/projects/standards/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/api/projects/standards/${id}/`);
    return response.data;
  },
  
  search: async (query: string) => {
    const response = await api.get('/api/projects/standards/', { params: { search: query } });
    return response.data;
  },

  bulkUpload: async (file: File, skipDuplicates: boolean) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('skip_duplicates', String(skipDuplicates));
    const response = await api.post('/api/projects/standards/bulk-upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadTemplate: async () => {
    const response = await api.get('/api/projects/standards/download-template/', {
      responseType: 'blob',
    });
    return response.data;
  },

  exportStandards: async (params?: any) => {
    const response = await api.get('/api/projects/standards/export/', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
