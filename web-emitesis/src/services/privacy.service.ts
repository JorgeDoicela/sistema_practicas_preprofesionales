import { API_URL } from '@/lib/api-base';

export const privacyService = {
  async recordConsent(accepted: boolean, version: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/privacy/consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ accepted, version }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al registrar el consentimiento');
    }
    return response.json();
  },

  async requestArcoRights(type: 'ACCESO' | 'RECTIFICACION' | 'CANCELACION' | 'OPOSICION', details?: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/privacy/arco-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type, details }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al enviar la solicitud ARCO');
    }
    return response.json();
  },

  async getMyDataSummary() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/privacy/my-data`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        throw new Error('Error al obtener el resumen de sus datos');
    }
    return response.json();
  },

  async getMyRequests() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/privacy/my-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        throw new Error('Error al obtener sus solicitudes');
    }
    return response.json();
  }
};
