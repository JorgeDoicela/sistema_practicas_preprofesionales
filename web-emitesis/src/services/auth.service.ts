import axios from 'axios';
import { API_URL } from '@/lib/api-base';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

export const api = axios.create({
  baseURL: API_URL,
});

type RetryableConfig = {
  _retry?: boolean;
  __retryCount?: number;
  method?: string;
  headers?: any;
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

// Interceptor de respuesta para manejar refresh token y errores
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config as RetryableConfig;
    
    // Si es 401 y no hemos reintentado ya
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      const userStr = localStorage.getItem('user');

      if (refreshToken && userStr) {
        try {
          const user = JSON.parse(userStr);
          // Llamada directa con axios para evitar el interceptor infinito
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            userId: user.id,
            refreshToken
          });

          // Extraer nuevos tokens (vienen en data.data por el envoltorio del backend)
          const tokens = response.data.data;
          
          localStorage.setItem('token', tokens.accessToken);
          localStorage.setItem('refresh_token', tokens.refreshToken);
          Cookies.set('token', tokens.accessToken, { secure: true, sameSite: 'strict' });

          // Reintentar petición original
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          // Si el refresh falla, el token es inválido o expiró → Logout total
          localStorage.clear();
          Cookies.remove('token');
          Cookies.remove('user');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?sessionExpired=true';
          }
          return Promise.reject(refreshError);
        }
      }
    }

    const isNetworkError = !error.response && error.code === 'ERR_NETWORK';
    const isGetRequest = (originalRequest.method || '').toLowerCase() === 'get';
    const retryCount = originalRequest.__retryCount ?? 0;

    if (isNetworkError && isGetRequest && retryCount < 2) {
      originalRequest.__retryCount = retryCount + 1;
      return new Promise((resolve) => {
        setTimeout(() => resolve(api(originalRequest)), 350);
      });
    }

    if (error.response?.status === 429) {
      toast.error('Demasiadas peticiones', {
        description: 'Has superado el límite. Por favor, espera unos minutos.',
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
