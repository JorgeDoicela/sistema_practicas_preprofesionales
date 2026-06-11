import { API_URL } from '@/lib/api-base';

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
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/evaluations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al guardar la evaluación');
    }

    return response.json();
  },

  async getGrade(internshipId: string): Promise<{ internshipId: string; grade: number }> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/evaluations/internship/${internshipId}/grade`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return { internshipId, grade: 0 };
    return response.json();
  },

  async findByInternship(internshipId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/evaluations/internship/${internshipId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener la evaluación');
    }

    return response.json();
  },
};
