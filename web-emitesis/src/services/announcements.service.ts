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
    const data = await api.get<Announcement[]>("/announcements");
    return data;
  },

  findActive: async () => {
    const data = await api.get<Announcement[]>("/announcements/active");
    return data;
  },

  create: async (data: Partial<Announcement>) => {
    const result = await api.post<Announcement>("/announcements", data);
    return result;
  },

  update: async (id: string, data: Partial<Announcement>) => {
    const result = await api.patch<Announcement>(`/announcements/${id}`, data);
    return result;
  },

  remove: async (id: string) => {
    const result = await api.delete(`/announcements/${id}`);
    return result;
  },
};
