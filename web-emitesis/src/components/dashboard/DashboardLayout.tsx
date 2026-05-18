"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/dashboard/Navbar";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { normalizeApiRoleToAppRole, type Role } from "@/constants/roles";
import { canRoleAccessPath, getHomePathForRole, normalizePathname } from "@/lib/route-access";
import { DashboardTour } from "@/components/tour/DashboardTour";
import { useLanguage } from "@/providers/LanguageProvider";
import { useRef } from "react";
import { AICopilot } from "./AICopilot";
import { internshipsService } from "@/services/internships.service";
import { ROLES } from "@/constants/roles";
import Cookies from "js-cookie";


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [activeInternship, setActiveInternship] = useState<any>(null);
  const [appRole, setAppRole] = useState<string | null>(null);

  // Inactivity & Session Limits (Enterprise Security)
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutos
  const ABSOLUTE_LIMIT = 4 * 60 * 60 * 1000; // 4 horas
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const securityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    // 1. Actualizar timestamp global (todas las pestañas ven esto)
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_activity', Date.now().toString());
    }
    
    // 2. Timer local para ejecución inmediata si esta es la pestaña activa
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      checkSessionSecurity();
    }, INACTIVITY_LIMIT + 1000); // Pequeño buffer para dejar que el interval actúe primero
  };

  const handleLogout = (reason: 'inactivity' | 'absolute' | 'manual' | 'sync' = 'manual') => {
    console.warn(`[Security] Logging out due to: ${reason}`);
    
    // 1. Limpiar localStorage
    localStorage.clear();

    // 2. Limpiar Cookies con todas las técnicas posibles para evitar que el Middleware intercepte
    try {
      Cookies.remove('token', { path: '/' });
      Cookies.remove('user', { path: '/' });
      Cookies.set('token', '', { expires: -1, path: '/' });
      Cookies.set('user', '', { expires: -1, path: '/' });
    } catch (e) {
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    if (typeof window !== 'undefined') {
      const errorParam = reason === 'inactivity' ? 'sessionExpired=true' : 
                         reason === 'absolute' ? 'sessionLimit=true' : 'logout=true';
      window.location.href = `/login?${errorParam}`;
    }
  };

  const checkSessionSecurity = () => {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    const lastActivity = parseInt(localStorage.getItem('last_activity') || '0');
    const sessionStart = parseInt(localStorage.getItem('session_start') || '0');
    const token = localStorage.getItem('token');

    if (!token) return; // Ya se cerró sesión

    // A. Verificar Inactividad Global (Cross-tab)
    if (lastActivity > 0 && (now - lastActivity) > INACTIVITY_LIMIT) {
      handleLogout('inactivity');
      return;
    }

    // B. Verificar Límite Absoluto
    if (sessionStart > 0 && (now - sessionStart) > ABSOLUTE_LIMIT) {
      handleLogout('absolute');
      return;
    }
  };

  useEffect(() => {
    const handleInitialState = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    handleInitialState();

    // Eventos para detectar actividad real del usuario
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Vigilante Periódico (Seguridad Activa)
    securityCheckIntervalRef.current = setInterval(checkSessionSecurity, 30000); // Cada 30 seg

    // Sincronización Inicial
    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (securityCheckIntervalRef.current) clearInterval(securityCheckIntervalRef.current);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, []);

  useEffect(() => {
    const isTokenExpired = (tok: string): boolean => {
      try {
        const parts = tok.split('.');
        if (parts.length !== 3) return true;
        const payload = JSON.parse(window.atob(parts[1]));
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          return true; // Expirado
        }
        return false;
      } catch (e) {
        return true;
      }
    };

    const validateSession = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token === "undefined" || token === "null" || userStr === "undefined" || userStr === "null") {
        handleLogout('sync');
        return;
      }

      if (!token || !userStr) {
        setIsAuthorized(false);
        setIsLoading(false);
        router.replace("/login");
        return;
      }

      // Validación de expiración proactiva (JWT):
      // Si el access token ya expiró, y no hay refresh token o el refresh token también expiró,
      // cerramos sesión de inmediato para evitar que quede atrapado en el dashboard con datos rotos.
      if (isTokenExpired(token)) {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken || isTokenExpired(refreshToken)) {
          console.warn("[Security] Token de acceso y token de refresco expirados o no disponibles.");
          handleLogout('inactivity');
          return;
        }
      }

      try {
        const parsed = JSON.parse(userStr);
        const role = normalizeApiRoleToAppRole(String(parsed.role));
        
        if (!canRoleAccessPath(role as Role, pathname)) {
          const redirectPath = getHomePathForRole(role as Role);
          // Prevenir bucle infinito si la ruta de redirección es la misma que la actual
          if (normalizePathname(redirectPath) === normalizePathname(pathname)) {
            console.error("[Security] Redirect loop detected at", pathname);
            setIsAuthorized(true); // Permitir acceso como última instancia para evitar bloqueo
          } else {
            router.replace(redirectPath);
            setIsAuthorized(false);
          }
          setIsLoading(false);
          return;
        }

        setAppRole(role);
        setUser(parsed);

        if (role === ROLES.ESTUDIANTE && parsed.id) {
          internshipsService.findByStudent(parsed.id).then(res => {
            const list = res?.items || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
            const active = list.find((i: any) => {
              const s = (i.status || "").toLowerCase();
              return s === "activo" || s === "en proceso" || s === "en_curso";
            }) || list[0];
            setActiveInternship(active);
          }).catch(err => console.error("[DashboardLayout] Internship Context Error:", err));
        }

        setIsAuthorized(true);
        setIsLoading(false);
      } catch (err) {
        handleLogout('sync');
      }
    };

    validateSession();

    /** 
     * GUARDIÁN DE SINCRONIZACIÓN (Cross-tab Security)
     * Solo recarga si el token desaparece (logout en otra pestaña)
     * Ignora actualizaciones de tokens (refrescos automáticos) para evitar "parpadeos"
     */
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (!e.newValue) {
          // Token eliminado -> Logout inmediato en esta pestaña
          handleLogout('sync');
        } else if (e.oldValue !== e.newValue) {
          // Token cambió pero existe (refresco) -> No recargamos la página, 
          // los interceptores de Axios usarán el nuevo valor automáticamente.
          console.log("[Security] Token refreshed in another tab, synchronized silently.");
        }
      }
      if (e.key === 'user' && !e.newValue) {
         handleLogout('sync');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router, pathname]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary dark:text-brand-gold animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.common.accessingEcosystem}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardTour />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(v => !v)} />
        <main data-tour="dashboard-main" className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto pb-20"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {appRole && <AICopilot user={user} internship={activeInternship} />}
    </div>
  );
}
