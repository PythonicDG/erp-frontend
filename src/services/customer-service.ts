import api from '@/lib/axios';

export interface Customer {
  id: string;
  name: string;
  category: string;
  mobile_number: string;
  alternate_mobile_number?: string;
  email: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export const customerService = {
  getAll: async (params?: any) => {
    const response = await api.get('/api/projects/customers/', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/api/projects/customers/${id}/`);
    return response.data;
  },
  
  create: async (data: Partial<Customer>) => {
    const response = await api.post('/api/projects/customers/', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Customer>) => {
    const response = await api.patch(`/api/projects/customers/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/api/projects/customers/${id}/`);
    return response.data;
  },
  
  search: async (query: string) => {
    const response = await api.get('/api/projects/customers/', { params: { search: query } });
    return response.data;
  },

  bulkUpload: async (file: File, skipDuplicates: boolean) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('skip_duplicates', String(skipDuplicates));
    const response = await api.post('/api/projects/customers/bulk-upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadTemplate: async () => {
    const response = await api.get('/api/projects/customers/download-template/', {
      responseType: 'blob',
    });
    return response.data;
  },

  exportCustomers: async (params?: any) => {
    const response = await api.get('/api/projects/customers/export/', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
