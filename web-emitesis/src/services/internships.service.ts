import { API_URL } from '@/lib/api-base';

export const internshipsService = {
  async create(data: Record<string, unknown>) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/internships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear la asignación');
    }

    return response.json();
  },

  async findAll() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/internships`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener las asignaciones');
    }

    return response.json();
  },

  async findByTutor(tutorId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/internships/tutor/${tutorId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener las asignaciones del tutor');
    }

    return response.json();
  },

  async findOne(id: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/internships/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener el detalle de la asignación');
    }

    return response.json();
  },

  async findByStudent(studentId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/internships/student/${studentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener las asignaciones del estudiante');
    }

    return response.json();
  },

  async findByCompany(companyId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/internships/company/${companyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener los estudiantes de la empresa');
    }

    return response.json();
  },

  /** RF-ATT-LOC: Guardar las ubicaciones permitidas para asistencia */
  async updateLocations(id: string, locations: { label: string; lat: number; lng: number; radiusM?: number }[]) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/internships/${id}/locations`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ locations }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al guardar las ubicaciones');
    }

    return response.json();
  },

  async toggleTest(id: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/internships/${id}/toggle-test`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al cambiar el estado del test');
    }

    return response.json();
  },

  async syncSigafi(id: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/internships/${id}/sync-sigafi`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al sincronizar con SIGAFI');
    }

    return response.json();
  }
};
