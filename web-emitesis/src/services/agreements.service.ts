import { API_URL } from '@/lib/api-base';

export const agreementsService = {
  async create(formData: FormData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/agreements`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al registrar el convenio');
    }

    return response.json();
  },

  async findAll() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/agreements`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los convenios');
    }

    return response.json();
  }
};
