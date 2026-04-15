import { API_URL } from '@/lib/api-base';

const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

const jsonHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

export const attendancesService = {
  async getTodayStatus() {
    const res = await fetch(`${API_URL}/attendance/today-status`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al obtener estado de asistencia');
    }
    return res.json();
  },

  /** RF-13 + RF-15: Registrar entrada con coordenadas GPS y URL de foto */
  async checkIn(coords: { lat: number; lng: number; checkInPhotoUrl?: string }) {
    const res = await fetch(`${API_URL}/attendance/check-in`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(coords),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al registrar la entrada');
    }
    return res.json();
  },

  /** RF-13 + RF-15: Registrar salida con coordenadas GPS y URL de foto */
  async checkOut(coords: { lat: number; lng: number; checkOutPhotoUrl?: string }) {
    const res = await fetch(`${API_URL}/attendance/check-out`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(coords),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al registrar la salida');
    }
    return res.json();
  },

  /** RF-15: Subir foto de entrada/salida antes del check-in/out */
  async uploadPhoto(blob: Blob, filename = 'photo.jpg'): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', blob, filename);

    const res = await fetch(`${API_URL}/attendance/upload-photo`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al subir la foto');
    }
    return res.json();
  },

  /** RF-17: Subir foto de actividad del día */
  async uploadActivityPhoto(attendanceId: string, blob: Blob, caption?: string): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', blob, 'activity.jpg');
    formData.append('attendanceId', attendanceId);
    if (caption) formData.append('caption', caption);

    const res = await fetch(`${API_URL}/attendance/activity-photo`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al subir la foto de actividad');
    }
    return res.json();
  },

  /** RF-17: Obtener fotos de actividades de un registro */
  async getActivityPhotos(attendanceId: string): Promise<unknown[]> {
    const res = await fetch(`${API_URL}/attendance/activity-photos/${attendanceId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async findByInternship(internshipId: string, startDate?: string, endDate?: string) {
    let url = `${API_URL}/attendance/internship/${internshipId}`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al obtener el historial');
    }
    return res.json();
  },

  async getSummary(internshipId: string) {
    const res = await fetch(`${API_URL}/attendance/internship/${internshipId}/summary`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al obtener el resumen');
    }
    return res.json();
  },
};
