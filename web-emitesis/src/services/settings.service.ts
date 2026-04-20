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
    const data = await api.get<SystemSetting[]>("/settings");
    return data;
  },

  update: async (key: string, value: string, description?: string) => {
    const data = await api.patch<SystemSetting>(`/settings/${key}`, {
      value,
      description,
    });
    return data;
  },

  findAllCareers: async () => {
    const data = await api.get<any[]>("/settings/careers");
    return data;
  },
};
