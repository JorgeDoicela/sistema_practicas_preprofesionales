import { api } from "./auth.service";

export interface EligibilityDetails {
  approvedDocsCount: number;
  totalRequiredDocs: number;
  missingDocs: string[];
  totalHours: number;
  requiredHours: number;
  hoursMet: boolean;
}

export interface EligibilityResponse {
  eligible: boolean;
  details: EligibilityDetails;
}

export const certificationService = {
  checkEligibility: async (internshipId: string): Promise<EligibilityResponse> => {
    const response = await api.get(`/certification/check/${internshipId}`);
    return response.data;
  },

  generateCertificate: async (internshipId: string): Promise<{ url: string; message: string }> => {
    const response = await api.post(`/certification/generate/${internshipId}`);
    return response.data;
  }
};
