import { api } from './auth.service';

export const agreementsService = {
  async create(formData: FormData) {
    return api.post('/agreements', formData);
  },

  async findAll(page = 1, limit = 1000) {
    return api.get(`/agreements?page=${page}&limit=${limit}`);
  }
};
