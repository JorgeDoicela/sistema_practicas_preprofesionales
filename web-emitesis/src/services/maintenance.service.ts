import { api } from "@/services/auth.service";

export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  reclaimedMb: number;
}

export const maintenanceService = {
  cleanupOrphanedFiles: async () => {
    return api.post<CleanupResult>("/maintenance/cleanup-orphaned-files");
  },

  backupDatabase: async () => {
    return api.post<{ success: boolean; message: string }>("/maintenance/backup-db");
  },
};
