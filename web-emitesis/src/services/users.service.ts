import { api } from './auth.service';
import { User, UserProfile } from "@/types/user";

const handleError = (error: any, defaultMessage: string): never => {
  const serverMessage = error.response?.data?.message;
  const message = Array.isArray(serverMessage)
    ? serverMessage.join(', ')
    : (serverMessage || error.message || defaultMessage);
  throw new Error(message);
};

export const usersService = {
  async getProfile(): Promise<UserProfile> {
    try {
      return await api.get('/users/me');
    } catch (err) {
      return handleError(err, 'Error al obtener el perfil');
    }
  },

  async updateMe(data: { fullName?: string; password?: string }): Promise<UserProfile> {
    try {
      return await api.patch('/users/me', data);
    } catch (err) {
      return handleError(err, 'Error al actualizar tu perfil');
    }
  },

  async findAll(page = 1, limit = 10, search = '', role = '', status = '') {
    try {
      let url = `/users?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (role && role !== 'ALL') url += `&role=${role}`;
      if (status && status !== 'ALL') {
        url += `&isActive=${status === 'ACTIVE' ? 'true' : 'false'}`;
      }
      return await api.get(url);
    } catch (err) {
      return handleError(err, 'Error al listar usuarios');
    }
  },

  async create(userData: Partial<User & { password?: string }>) {
    try {
      return await api.post('/users', userData);
    } catch (err) {
      return handleError(err, 'Error al crear usuario');
    }
  },

  async update(id: string, userData: Partial<User & { password?: string }>) {
    try {
      return await api.patch(`/users/${id}`, userData);
    } catch (err) {
      return handleError(err, 'Error al actualizar usuario');
    }
  },

  async remove(id: string, twoFactorCode?: string) {
    try {
      return await api.delete(`/users/${id}`, {
        headers: {
          'x-2fa-code': twoFactorCode || '',
        },
      });
    } catch (err) {
      return handleError(err, 'Error al eliminar usuario');
    }
  },

  async bulkImport(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      return await api.post('/users/bulk-import', formData);
    } catch (err) {
      return handleError(err, 'Error al importar usuarios');
    }
  }
};
