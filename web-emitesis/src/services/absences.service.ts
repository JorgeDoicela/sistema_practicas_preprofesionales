import { api } from './auth.service';

export interface Absence {
  id: string;
  internshipId: string;
  date: string;
  reason: string;
  type: string;
  filePath?: string;
  status: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  reviewNotes?: string;
  reviewedBy?: { fullName: string; role: string };
  reviewedAt?: string;
  createdAt: string;
  internship?: {
    student?: { fullName: string; cedula?: string };
    tutor?: { fullName: string };
  };
}

export const absencesService = {
  async create(data: { date: string; reason: string; type?: string }, file?: File) {
    const formData = new FormData();
    formData.append('date', data.date);
    formData.append('reason', data.reason);
    if (data.type) formData.append('type', data.type);
    if (file) formData.append('file', file);
    return api.post('/absences', formData);
  },

  async findByInternship(internshipId: string): Promise<Absence[]> {
    return api.get(`/absences/internship/${internshipId}`);
  },

  async findPendingForTutor(): Promise<Absence[]> {
    return api.get('/absences/pending/tutor');
  },

  async findAll(): Promise<Absence[]> {
    return api.get('/absences/all');
  },

  async review(id: string, status: 'APROBADA' | 'RECHAZADA', reviewNotes?: string) {
    return api.patch(`/absences/${id}/review`, { status, reviewNotes });
  },
};
