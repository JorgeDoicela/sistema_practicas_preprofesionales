import { api } from './auth.service';

export const attendancesService = {
  async getTodayStatus() {
    return api.get('/attendance/today-status');
  },

  /** RF-13 + RF-15: Registrar entrada con coordenadas GPS y URL de foto */
  async checkIn(coords: { lat: number; lng: number; checkInPhotoUrl?: string }) {
    return api.post('/attendance/check-in', coords);
  },

  /** RF-13 + RF-15: Registrar salida con coordenadas GPS y URL de foto */
  async checkOut(coords: { lat: number; lng: number; checkOutPhotoUrl?: string; activityDescription?: string }) {
    return api.post('/attendance/check-out', coords);
  },

  /** RF-15: Subir foto de entrada/salida antes del check-in/out */
  async uploadPhoto(blob: Blob, filename = 'photo.jpg'): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', blob, filename);
    return api.post('/attendance/upload-photo', formData);
  },

  /** RF-17: Subir foto de actividad del día */
  async uploadActivityPhoto(attendanceId: string, blob: Blob, caption?: string): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', blob, 'activity.jpg');
    formData.append('attendanceId', attendanceId);
    if (caption) formData.append('caption', caption);

    return api.post('/attendance/activity-photo', formData);
  },

  /** RF-17: Obtener fotos de actividades de un registro */
  async getActivityPhotos(attendanceId: string): Promise<unknown[]> {
    return api.get(`/attendance/activity-photos/${attendanceId}`);
  },

  async findByInternship(internshipId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const q = params.toString() ? `?${params.toString()}` : "";
    return api.get(`/attendance/internship/${internshipId}${q}`);
  },

  async getSummary(internshipId: string) {
    return api.get(`/attendance/internship/${internshipId}/summary`);
  },
};
