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


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleInitialState = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    handleInitialState();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.replace("/login");
      setIsAuthorized(false);
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(userStr) as { role?: string } & Record<string, unknown>;
      if (parsed.role == null || String(parsed.role).trim() === "") {
        router.replace("/login");
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }
      const role = normalizeApiRoleToAppRole(String(parsed.role));
      if (parsed.role !== role) {
        localStorage.setItem("user", JSON.stringify({ ...parsed, role }));
      }

      if (!canRoleAccessPath(role as Role, pathname)) {
        router.replace(getHomePathForRole(role as Role));
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);
    } catch {
      router.replace("/login");
      setIsAuthorized(false);
    }
    setIsLoading(false);
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

  if (!isAuthorized) return null;

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
