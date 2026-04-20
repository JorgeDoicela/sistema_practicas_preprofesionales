import { api } from "./auth.service";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

class NotificationsService {
  async getMyNotifications(): Promise<Notification[]> {
    const data = await api.get('/notifications/my');
    return data;
  }

  async getUnreadCount(): Promise<number> {
    const data = await api.get('/notifications/unread-count');
    return data.count;
  }

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all');
  }
}

export const notificationsService = new NotificationsService();
