import { api } from './auth.service';

export interface EvaluationPayload {
  internshipId: string;
  type: 'EMPRESARIAL' | 'ACADEMICA';
  punctuality: number;
  teamwork: number;
  technicalSkills: number;
  proactivity: number;
  attitude: number;
  observations?: string;
}

export const evaluationsService = {
  async createOrUpdate(data: EvaluationPayload) {
    return api.post('/evaluations', data);
  },

  async getGrade(internshipId: string): Promise<{ internshipId: string; grade: number }> {
    try {
      return await api.get(`/evaluations/internship/${internshipId}/grade`);
    } catch {
      return { internshipId, grade: 0 };
    }
  },

  async findByInternship(internshipId: string) {
    try {
      return await api.get(`/evaluations/internship/${internshipId}`);
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },
};
