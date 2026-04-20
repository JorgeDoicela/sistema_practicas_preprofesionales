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
    const data = await api.get(`/reports/global-stats${q}`);
    return data;
  },

  exportGlobalExcel: async () => {
    const data = await api.get("/reports/export/global/excel", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "reporte-global.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportGlobalPdf: async () => {
    const data = await api.get("/reports/export/global/pdf", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "reporte-global.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportAttendanceExcel: async (internshipId: string) => {
    const data = await api.get(`/reports/export/attendance/${internshipId}/excel`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `asistencia-${internshipId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportMasterReport: async () => {
    const data = await api.get("/export/master-report", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reporte-maestro-emitesis-${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
