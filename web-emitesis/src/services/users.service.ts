import { api } from './auth.service';
import { User, UserProfile } from "@/types/user";

export const usersService = {
  async getProfile(): Promise<UserProfile> {
    return api.get('/users/me');
  },

  async updateMe(data: { fullName?: string; password?: string }): Promise<UserProfile> {
    return api.patch('/users/me', data);
  },

  async findAll() {
    return api.get('/users');
  },

  async create(userData: Partial<User & { password?: string }>) {
    return api.post('/users', userData);
  },

  async update(id: string, userData: Partial<User & { password?: string }>) {
    return api.patch(`/users/${id}`, userData);
  },

  async remove(id: string, twoFactorCode?: string) {
    return api.delete(`/users/${id}`, {
      headers: {
        'x-2fa-code': twoFactorCode || '',
      },
    });
  },

  async bulkImport(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/bulk-import', formData);
  }
};
