const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const attendancesService = {
  async getTodayStatus() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/attendance/today-status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener el estado de asistencia');
    }

    return response.json();
  },

  async checkIn(coords: { lat: number, lng: number }) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(coords)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al registrar la entrada');
    }

    return response.json();
  },

  async checkOut(coords: { lat: number, lng: number }) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(coords)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al registrar la salida');
    }

    return response.json();
  },

  async findByInternship(internshipId: string, startDate?: string, endDate?: string) {
    const token = localStorage.getItem('token');
    let url = `${API_URL}/attendance/internship/${internshipId}`;
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener el historial de asistencia');
    }

    return response.json();
  },

  async getSummary(internshipId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/attendance/internship/${internshipId}/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener el resumen de asistencia');
    }

    return response.json();
  }
};
