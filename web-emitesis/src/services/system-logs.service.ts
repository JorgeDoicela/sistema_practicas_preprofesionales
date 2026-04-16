import { API_URL } from '@/lib/api-base';

export interface SystemLog {
  id: string;
  createdAt: string;
  level: string; // INFO, WARN, ERROR
  category: string; // HTTP, AUTH, SYSTEM, etc
  message: string;
  method?: string;
  path?: string;
  statusCode?: number;
  userId?: string;
  actorEmail?: string;
  ip?: string;
  durationMs?: number;
  metadata?: any;
}

export interface PaginatedLogs {
  data: SystemLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const systemLogsService = {
  async getLogs(page = 1, limit = 50, filters: { level?: string; category?: string } = {}) {
    const token = localStorage.getItem('token');
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(filters.level && { level: filters.level }),
      ...(filters.category && { category: filters.category }),
    });

    const response = await fetch(`${API_URL}/system-logs?${query.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los logs del sistema');
    }
    return response.json() as Promise<PaginatedLogs>;
  }
};
