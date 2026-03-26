const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
  }
};
