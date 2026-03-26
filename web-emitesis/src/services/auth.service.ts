"use client";

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para incluir el token en cada petición
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authService = {
  async login(email: string, password: string, recaptchaToken: string) {
    console.log('Iniciando login para:', email);
    console.log('Recaptcha Token presente:', !!recaptchaToken);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, recaptchaToken }),
    });

    let data;
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Error al parsear JSON en login. Texto recibido:', text);
      throw new Error(`Error del servidor (no JSON): ${text.substring(0, 100)}`);
    }
    console.log('Respuesta de login:', response.status, data);

    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }

    return data;
  },

  async registerCompany(formData: Record<string, any>, recaptchaToken: string) {
    console.log('Registrando empresa...', formData.companyName);
    console.log('URL de API:', `${API_URL}/auth/register-company`);

    const response = await fetch(`${API_URL}/auth/register-company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...formData, recaptchaToken }),
    });

    let data;
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Error al parsear JSON. Texto recibido:', text);
      throw new Error(`Error del servidor (no JSON): ${text.substring(0, 100)}`);
    }

    console.log('Respuesta de registro:', response.status, data);

    if (!response.ok) {
      throw new Error(data.message || 'Error al registrar la empresa');
    }

    return data;
  },

  async forgotPassword(email: string, recaptchaToken: string) {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, recaptchaToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al solicitar el cambio de contraseña');
    }

    return data;
  },

  async resetPassword(token: string, password: string) {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al restablecer la contraseña');
    }

    return data;
  },
};
