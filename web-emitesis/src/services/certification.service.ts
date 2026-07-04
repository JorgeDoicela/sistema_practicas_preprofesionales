"use client";

import { api } from "./auth.service";

export interface EligibilityDetails {
  approvedDocsCount: number;
  totalRequiredDocs: number;
  missingDocs: string[];
  totalHours: number;
  requiredHours: number;
  hoursMet: boolean;
  hasAcademica?: boolean;
  hasEmpresarial?: boolean;
  missingEvals?: string[];
}

export interface EligibilityResponse {
  eligible: boolean;
  details: EligibilityDetails;
}

export const certificationService = {
  checkEligibility: async (internshipId: string): Promise<EligibilityResponse> => {
    const response = await api.get<EligibilityResponse>(`/certification/check/${internshipId}`);
    return response;
  },

  generateCertificate: async (internshipId: string): Promise<{ url: string; message: string }> => {
    const response = await api.post<{ url: string; message: string }>(`/certification/generate/${internshipId}`);
    return response;
  }
};
