import { api } from "@/services/auth.service";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER';
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export const announcementsService = {
  findAll: async () => {
    const response = await api.get<Announcement[]>("/announcements");
    return response.data;
  },

  findActive: async () => {
    const response = await api.get<Announcement[]>("/announcements/active");
    return response.data;
  },

  create: async (data: Partial<Announcement>) => {
    const response = await api.post<Announcement>("/announcements", data);
    return response.data;
  },

  update: async (id: string, data: Partial<Announcement>) => {
    const response = await api.patch<Announcement>(`/announcements/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },
};
