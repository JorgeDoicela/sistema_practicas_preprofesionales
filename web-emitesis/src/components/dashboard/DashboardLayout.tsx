"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/dashboard/Navbar";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { normalizeApiRoleToAppRole, type Role } from "@/constants/roles";
import { canRoleAccessPath, getHomePathForRole } from "@/lib/route-access";
import { DashboardTour } from "@/components/tour/DashboardTour";
import { useLanguage } from "@/providers/LanguageProvider";
import { useRef } from "react";


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Inactivity Timeout Configuration (Enterprise Grade)
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutos
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_LIMIT);
  };

  const handleLogout = () => {
    localStorage.clear();
    if (typeof window !== 'undefined') {
      window.location.href = "/login?sessionExpired=true";
    }
  };

  useEffect(() => {
    const handleInitialState = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    handleInitialState();

    // Eventos para detectar actividad
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Iniciar timer
    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, []);

  useEffect(() => {
    const validateSession = () => {
      console.log("[DashboardLayout] Validating session at:", pathname);
      
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      // Limpieza preventiva de valores corruptos que causan bucles
      if (token === "undefined" || token === "null" || userStr === "undefined" || userStr === "null") {
        console.warn("[DashboardLayout] Corrupted session detected, cleaning up...");
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login?error=corrupted_session";
        return;
      }

      if (!token || !userStr) {
        console.warn("[DashboardLayout] No session found, redirecting to login");
        setIsAuthorized(false);
        setIsLoading(false);
        router.replace("/login");
        return;
      }

      try {
        const parsed = JSON.parse(userStr) as { role?: string; id?: string } & Record<string, unknown>;
        console.log("[DashboardLayout] Session parsed for user:", parsed.id, "Role:", parsed.role);

        if (!parsed.role || String(parsed.role).trim() === "") {
          throw new Error("User role is missing or empty");
        }

        const role = normalizeApiRoleToAppRole(String(parsed.role));
        
        // Verificación de acceso por ruta
        if (!canRoleAccessPath(role as Role, pathname)) {
          console.warn("[DashboardLayout] Access denied for role", role, "on path", pathname);
          const redirectPath = getHomePathForRole(role as Role);
          router.replace(redirectPath);
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        console.log("[DashboardLayout] Access granted");
        setIsAuthorized(true);
        setIsLoading(false);
      } catch (err) {
        console.error("[DashboardLayout] Error validating session:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthorized(false);
        setIsLoading(false);
        window.location.href = "/login?error=session_error";
      }
    };

    // Validar sesión inicialmente
    validateSession();

    /** 
     * GUARDIÁN DE SINCRONIZACIÓN (Cross-tab Security)
     * Escucha cambios en el localStorage desde otras pestañas.
     * Si el usuario cambia de rol o cierra sesión en otra pestaña, 
     * esta pestaña se redirige automáticamente para evitar inconsistencias.
     */
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        // Si el token cambió o desapareció, forzamos re-validación total
        window.location.reload(); 
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#003366] animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.common.accessingEcosystem}</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#003366] animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.common.accessingEcosystem}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
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
    </div>
  );
}
