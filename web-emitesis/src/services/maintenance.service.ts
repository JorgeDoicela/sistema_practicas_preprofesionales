import { api } from "@/services/auth.service";

export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  reclaimedMb: number;
}

export const maintenanceService = {
  cleanupOrphanedFiles: async () => {
    const response = await api.post<CleanupResult>("/maintenance/cleanup-orphaned-files");
    return response.data;
  },

  backupDatabase: async () => {
    const response = await api.post<{ success: boolean; message: string }>("/maintenance/backup-db");
    return response.data;
  },
};
