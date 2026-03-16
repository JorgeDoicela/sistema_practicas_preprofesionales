const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const documentsService = {
  async findByInternship(internshipId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/internship/${internshipId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        throw new Error('Error al obtener los documentos');
    }
    return response.json();
  },

  async updateDates(id: string, startDate: string, dueDate: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/${id}/dates`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ startDate, dueDate }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar las fechas');
    }
    return response.json();
  }
};
