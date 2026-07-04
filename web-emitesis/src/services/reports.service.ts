import { api } from "./auth.service";

export interface GlobalStats {
  assignmentsCount: number;
  pendingDocs: number;
  approvedDocs: number;
  activeBlocks: number;
  activeInternships: number;
  completedInternships: number;
  totalStudents: number;
  totalCompletedHours: number;
  totalPlannedHours: number;
  progressPercentage: number;
}

export const reportsService = {
  getGlobalStats: async (careerId?: string): Promise<GlobalStats> => {
    const q = careerId ? `?careerId=${careerId}` : "";
    const data = await api.get<GlobalStats>(`/reports/global-stats${q}`);
    return data as unknown as GlobalStats;
  },

  exportGlobalExcel: async () => {
    // Bypass interceptor using raw axios to preserve blob data intact
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const { default: axios } = await import('axios');
    const { API_URL } = await import('@/lib/api-base');
    const response = await axios.get(`${API_URL}/reports/export/global/excel`, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reporte-global.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportGlobalPdf: async () => {
    // Bypass interceptor using raw axios to preserve blob data intact
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const { default: axios } = await import('axios');
    const { API_URL } = await import('@/lib/api-base');
    const response = await axios.get(`${API_URL}/reports/export/global/pdf`, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reporte-global.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportAttendanceExcel: async (internshipId: string) => {
    // Bypass interceptor using raw axios to preserve blob data intact
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const { default: axios } = await import('axios');
    const { API_URL } = await import('@/lib/api-base');
    const response = await axios.get(`${API_URL}/reports/export/attendance/${internshipId}/excel`, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `asistencia-${internshipId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportMasterReport: async () => {
    // Bypass interceptor using raw axios to preserve blob data intact
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const { default: axios } = await import('axios');
    const { API_URL } = await import('@/lib/api-base');
    const response = await axios.get(`${API_URL}/export/master-report`, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte-maestro-praxis-hub-${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
