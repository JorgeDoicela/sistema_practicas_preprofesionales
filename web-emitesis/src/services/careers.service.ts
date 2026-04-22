import { api } from './auth.service';

export interface Career {
  id: string;
  name: string;
  faculty?: string;
  modalidad: string;
  config?: { requiredHours?: number };
  createdAt: string;
  _count?: { users: number; internships: number };
}

export const careersService = {
  async findAll(): Promise<Career[]> {
    return api.get('/careers');
  },

  async findOne(id: string): Promise<Career> {
    return api.get(`/careers/${id}`);
  },

  async create(data: { name: string; faculty?: string; modalidad?: string; requiredHours?: number }) {
    return api.post('/careers', data);
  },

  async update(id: string, data: { name?: string; faculty?: string; modalidad?: string; requiredHours?: number }) {
    return api.put(`/careers/${id}`, data);
  },

  async remove(id: string) {
    return api.delete(`/careers/${id}`);
  },
};
