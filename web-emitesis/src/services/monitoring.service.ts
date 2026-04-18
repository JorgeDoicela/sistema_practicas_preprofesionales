import { API_URL } from '@/lib/api-base';

export interface MonitoringVisitPayload {
  internshipId: string;
  date: string;
  type: 'PRESENCIAL' | 'VIRTUAL';
  observations: string;
  evidenceUrl?: string;
}

export const monitoringService = {
  async createVisit(data: MonitoringVisitPayload) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/monitoring/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al guardar la visita');
    }

    return response.json();
  },

  async findVisitsByInternship(internshipId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/monitoring/visits/internship/${internshipId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener las visitas');
    }

    return response.json();
  },

  async deleteVisit(id: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/monitoring/visits/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar la visita');
    }

    return response.json();
  },
};
