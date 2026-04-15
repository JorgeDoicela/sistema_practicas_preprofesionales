const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
import { User } from "@/types/user";

export const usersService = {
  async findAll() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener los usuarios');
    }

    return response.json();
  },

  async create(userData: Partial<User & { password?: string }>) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear el usuario');
    }

    return response.json();
  },

  async update(id: string, userData: Partial<User & { password?: string }>) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar el usuario');
    }

    return response.json();
  },

  async remove(id: string, twoFactorCode?: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-2fa-code': twoFactorCode || '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar el usuario');
    }

    return response.json();
  }
};
