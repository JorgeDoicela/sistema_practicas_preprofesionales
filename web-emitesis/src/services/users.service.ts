import { api } from './auth.service';
import { User, UserProfile } from "@/types/user";

export const usersService = {
  async getProfile(): Promise<UserProfile> {
    return api.get('/users/me');
  },

  async updateMe(data: { fullName?: string; password?: string }): Promise<UserProfile> {
    return api.patch('/users/me', data);
  },

  async findAll(page = 1, limit = 10, search = '', role = '', status = '') {
    let url = `/users?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (role && role !== 'ALL') url += `&role=${role}`;
    if (status && status !== 'ALL') {
      url += `&isActive=${status === 'ACTIVE' ? 'true' : 'false'}`;
    }
    return api.get(url);
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
