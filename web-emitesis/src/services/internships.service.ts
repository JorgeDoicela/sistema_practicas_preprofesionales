import { api } from './auth.service';

export const internshipsService = {
  async create(data: Record<string, unknown>) {
    return api.post('/internships', data);
  },

  async findAll(page = 1, limit = 20, careerId?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (careerId) params.append('careerId', careerId);
    return api.get(`/internships?${params.toString()}`);
  },

  async findByTutor(tutorId: string) {
    return api.get(`/internships/tutor/${tutorId}`);
  },

  async findOne(id: string) {
    return api.get(`/internships/${id}`);
  },

  async findByStudent(studentId: string) {
    return api.get(`/internships/student/${studentId}`);
  },

  async findByCompany(companyId: string) {
    return api.get(`/internships/company/${companyId}`);
  },

  /** RF-ATT-LOC: Guardar las ubicaciones permitidas para asistencia */
  async updateLocations(id: string, locations: { label: string; lat: number; lng: number; radiusM?: number }[]) {
    return api.patch(`/internships/${id}/locations`, { locations });
  },

  async toggleTest(id: string) {
    return api.patch(`/internships/${id}/toggle-test`);
  },

  async syncSigafi(id: string) {
    return api.post(`/internships/${id}/sync-sigafi`);
  },

  async changeStatus(id: string, status: string, reason?: string) {
    return api.patch(`/internships/${id}/status`, { status, reason });
  },
};
