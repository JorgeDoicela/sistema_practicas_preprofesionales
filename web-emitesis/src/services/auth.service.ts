"use client";

import axios from 'axios';
import { API_URL } from '@/lib/api-base';
import { toast } from 'sonner';

export const api = axios.create({
  baseURL: API_URL,
});

type RetryableConfig = {
  __retryCount?: number;
  method?: string;
};

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

// Interceptor de respuesta para manejar rate limiting y unwrap de datos
api.interceptors.response.use(
  (response) => {
    // Si la respuesta viene envuelta en el formato { success, data, timestamp }
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const config = (error.config || {}) as RetryableConfig;
    const isNetworkError = !error.response && error.code === 'ERR_NETWORK';
    const isGetRequest = (config.method || '').toLowerCase() === 'get';
    const retryCount = config.__retryCount ?? 0;

    // Reintento corto para cortes transitorios de API en modo dev (reinicios por watch).
    if (isNetworkError && isGetRequest && retryCount < 2) {
      config.__retryCount = retryCount + 1;
      return new Promise((resolve) => {
        setTimeout(() => resolve(api(config)), 350);
      });
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      toast.error('Sesión expirada', {
        description: 'Por seguridad, vuelve a iniciar sesión.',
      });
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 429) {
      toast.error('Demasiadas peticiones', {
        description: 'Has superado el límite de intentos permitidos. Por favor, espera unos minutos antes de reintentar.',
        duration: 5000,
      });
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(email: string, password: string, recaptchaToken: string) {
    try {
      const data = await api.post('/auth/login', { email, password, recaptchaToken });
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      throw new Error(message);
    }
  },

  async registerCompany(formData: Record<string, any>, recaptchaToken: string) {
    try {
      const data = await api.post('/auth/register-company', { ...formData, recaptchaToken });
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al registrar la empresa';
      throw new Error(message);
    }
  },

  async forgotPassword(email: string, recaptchaToken: string) {
    try {
      const data = await api.post('/auth/forgot-password', { email, recaptchaToken });
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al solicitar el cambio de contraseña';
      throw new Error(message);
    }
  },

  async resetPassword(token: string, password: string) {
    try {
      const data = await api.post('/auth/reset-password', { token, password });
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al restablecer la contraseña';
      throw new Error(message);
    }
  },
  
  async authenticate2FA(userId: string, code: string) {
    try {
      const data = await api.post('/auth/2fa/authenticate', { userId, code });
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Código 2FA inválido";
      throw new Error(message);
    }
  },

  async generate2FA() {
    return api.get("/auth/2fa/generate");
  },

  async turnOn2FA(code: string) {
    return api.post("/auth/2fa/turn-on", { code });
  },

  async turnOff2FA(code: string) {
    return api.post("/auth/2fa/turn-off", { code });
  },
};
