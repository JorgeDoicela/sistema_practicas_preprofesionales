import { api } from "@/services/auth.service";

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  updatedAt: string;
}

export const settingsService = {
  findAll: async () => {
    const response = await api.get<SystemSetting[]>("/settings");
    return response.data;
  },

  update: async (key: string, value: string, description?: string) => {
    const response = await api.patch<SystemSetting>(`/settings/${key}`, {
      value,
      description,
    });
    return response.data;
  },

  findAllCareers: async () => {
    const response = await api.get<any[]>("/settings/careers");
    return response.data;
  },
};
