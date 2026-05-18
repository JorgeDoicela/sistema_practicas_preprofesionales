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
    
    // Si es 401 y hay sesión activa
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Caso 1: Si ya intentamos reintentar y volvió a dar 401, significa que el token refrescado también falló
      // → Forzar logout total inmediato para evitar bucles o quedarse atascado en /dashboard.
      if (originalRequest._retry) {
        console.error('[AuthService] Reintento falló con 401. Cerrando sesión de inmediato...');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        try {
          Cookies.remove('token', { path: '/' });
          Cookies.remove('user', { path: '/' });
          Cookies.set('token', '', { expires: -1, path: '/' });
          Cookies.set('user', '', { expires: -1, path: '/' });
        } catch (e) {
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?sessionExpired=true';
        }
        return Promise.reject(error);
      }

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

          // Extraer nuevos tokens y usuario
          const rawResult = response.data;
          // Manejar caso donde venga envuelto en { success, data }
          const result = (rawResult && typeof rawResult === 'object' && 'success' in rawResult) 
            ? rawResult.data 
            : rawResult;
          
          if (!result || (!result.accessToken && !result.access_token)) {
            throw new Error('Tokens no encontrados en la respuesta de refresco');
          }

          const newAccessToken = result.accessToken || result.access_token;
          const newRefreshToken = result.refreshToken || result.refresh_token;

          localStorage.setItem('token', newAccessToken);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          if (result.user) {
            localStorage.setItem('user', JSON.stringify(result.user));
          }

          Cookies.set('token', newAccessToken, { secure: true, sameSite: 'strict', path: '/' });
          if (result.user) {
            Cookies.set('user', JSON.stringify(result.user), { secure: true, sameSite: 'strict', path: '/' });
          }

          // Reintentar petición original
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          console.error('[AuthService] Error crítico durante el refresco de token:', refreshError);
          // Si el refresh falla, el token es inválido o expiró → Logout total
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          try {
            Cookies.remove('token', { path: '/' });
            Cookies.remove('user', { path: '/' });
            Cookies.set('token', '', { expires: -1, path: '/' });
            Cookies.set('user', '', { expires: -1, path: '/' });
          } catch (e) {
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          }
          
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?sessionExpired=true';
          }
          return Promise.reject(refreshError);
        }
      } else {
        console.warn('[AuthService] Sesión expirada y no hay refresh token disponible.');
        // No hay refresh token → Logout inmediato
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        try {
          Cookies.remove('token', { path: '/' });
          Cookies.remove('user', { path: '/' });
          Cookies.set('token', '', { expires: -1, path: '/' });
          Cookies.set('user', '', { expires: -1, path: '/' });
        } catch (e) {
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?sessionExpired=true';
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
