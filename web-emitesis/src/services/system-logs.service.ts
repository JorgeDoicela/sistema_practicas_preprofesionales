import { API_URL } from '@/lib/api-base';

export interface SystemLogRow {
  id: string;
  createdAt: string;
  level: string;
  category: string;
  message: string;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  userId: string | null;
  actorEmail: string | null;
  ip: string | null;
  durationMs: number | null;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  } | null;
}

export interface SystemLogsResponse {
  data: SystemLogRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const systemLogsService = {
  async findPage(params: {
    page?: number;
    limit?: number;
    level?: string;
    category?: string;
  }): Promise<SystemLogsResponse> {
    const token = localStorage.getItem("token");
    const sp = new URLSearchParams();
    if (params.page) sp.set("page", String(params.page));
    if (params.limit) sp.set("limit", String(params.limit));
    if (params.level) sp.set("level", params.level);
    if (params.category) sp.set("category", params.category);
    const q = sp.toString();
    const response = await fetch(`${API_URL}/system-logs${q ? `?${q}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      let message = "Error al cargar el registro de actividad";
      try {
        const err = await response.json();
        message = err.message || message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
    return response.json();
  },
};
