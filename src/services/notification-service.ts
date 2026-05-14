import api from '@/lib/axios';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'approval_request' | 'approval_action';

export interface Notification {
  id: number;
  recipient: number;
  sender: number;
  sender_name: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  getAll: async () => {
    const response = await api.get('/api/auth/notifications/');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/api/auth/notifications/unread_count/');
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await api.post(`/api/auth/notifications/${id}/mark_as_read/`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/api/auth/notifications/mark_all_as_read/');
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/auth/notifications/${id}/`);
  }
};
