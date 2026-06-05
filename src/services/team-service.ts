import api from '@/lib/axios';

export interface TeamMember {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  username?: string;
  phone: string;
  department: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';
  admin_code?: string;
  is_active: boolean;
  remarks?: string;
  password?: string;
  allowed_tabs?: string[];
  created_at: string;
  updated_at: string;
}

export const teamService = {
  getMembers: async () => {
    const response = await api.get('/api/auth/team/');
    return response.data;
  },

  getMember: async (id: number) => {
    const response = await api.get(`/api/auth/team/${id}/`);
    return response.data;
  },

  createMember: async (data: Partial<TeamMember>) => {
    const response = await api.post('/api/auth/team/', data);
    return response.data;
  },

  updateMember: async (id: number, data: Partial<TeamMember>) => {
    const response = await api.patch(`/api/auth/team/${id}/`, data);
    return response.data;
  },

  deleteMember: async (id: number) => {
    const response = await api.delete(`/api/auth/team/${id}/`);
    return response.data;
  },

  deactivateMember: async (id: number) => {
    return teamService.updateMember(id, { is_active: false });
  },

  activateMember: async (id: number) => {
    return teamService.updateMember(id, { is_active: true });
  }
};
