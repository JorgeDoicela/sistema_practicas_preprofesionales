import { api } from "@/services/auth.service";

export interface AdminStats {
  counters: {
    totalUsers: number;
    totalInternships: number;
    totalAgreements: number;
    logsToday: number;
    errorsToday: number;
  };
  avgResponseTime: number;
  rolesDistribution: Array<{ role: string; _count: number }>;
}

export interface HealthSeries {
  hour: string;
  total: number;
  errors: number;
  avgLatency: number;
}

export const analyticsService = {
  getStats: async () => {
    const response = await api.get<AdminStats>("/analytics/stats");
    return response.data;
  },

  getHealthSeries: async () => {
    const response = await api.get<HealthSeries[]>("/analytics/health-series");
    return response.data;
  },
};
