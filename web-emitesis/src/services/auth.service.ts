import axios from 'axios';
import { API_URL } from '@/lib/api-base';
import { isJwtExpired } from '@/lib/jwt';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

export const AUTH_TOKEN_UPDATED_EVENT = 'auth:token-updated';

export function notifyTokenUpdated(token: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_TOKEN_UPDATED_EVENT, { detail: { token } }));
  }
}

function persistSessionTokens(
  accessToken: string,
  refreshToken: string,
  user?: Record<string, unknown>,
) {
  localStorage.setItem('token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  Cookies.set('token', accessToken, {
    secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    sameSite: 'strict',
    path: '/',
  });
  if (user) {
    Cookies.set('user', JSON.stringify(user), {
      secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
      sameSite: 'strict',
      path: '/',
    });
  }

  notifyTokenUpdated(accessToken);
}

/** Devuelve un access token válido, refrescándolo si hace falta. */
export async function getValidAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  const token = localStorage.getItem('token');
  if (token && !isJwtExpired(token)) return token;

  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken || isJwtExpired(refreshToken)) return null;

  try {
    const user = JSON.parse(userStr);
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      userId: user.id,
      refreshToken,
    });

    const rawResult = response.data;
    const result =
      rawResult && typeof rawResult === 'object' && 'success' in rawResult
        ? rawResult.data
        : rawResult;

    const newAccessToken = result?.accessToken || result?.access_token;
    const newRefreshToken = result?.refreshToken || result?.refresh_token;

    if (!newAccessToken || !newRefreshToken) return null;

    persistSessionTokens(newAccessToken, newRefreshToken, result?.user);
    return newAccessToken;
  } catch {
    return null;
  }
}

export const api = axios.create({
  baseURL: API_URL,
});

type RetryableConfig = import('axios').InternalAxiosRequestConfig & {
  _retry?: boolean;
  __retryCount?: number;
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
    
    // No interceptar rutas de autenticación pública (login, registro, etc.) para evitar bucles o alertas confusas
    const isAuthRoute = originalRequest.url?.includes('/auth/login') ||
                        originalRequest.url?.includes('/auth/register-company') ||
                        originalRequest.url?.includes('/auth/forgot-password') ||
                        originalRequest.url?.includes('/auth/reset-password') ||
                        originalRequest.url?.includes('/auth/2fa/authenticate');

    // Si es 401, hay sesión activa y no es una ruta de login/registro
    if (error.response?.status === 401 && typeof window !== 'undefined' && !isAuthRoute) {
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

          persistSessionTokens(newAccessToken, newRefreshToken, result.user);

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
