import { api } from './auth.service';

export const agreementsService = {
  async create(formData: FormData) {
    return api.post('/agreements', formData);
  },

  async findAll() {
    return api.get('/agreements');
  }
};
