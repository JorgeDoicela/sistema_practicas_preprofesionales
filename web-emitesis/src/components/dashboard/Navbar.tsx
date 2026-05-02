"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User as UserType } from "@/types/user";
import { Search, User, ShieldCheck, ChevronDown, LogOut, Menu } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { useLanguage } from "@/providers/LanguageProvider";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function Navbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setTimeout(() => setUser(JSON.parse(savedUser)), 0);
    }

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <header data-tour="navbar" className={`sticky top-0 z-30 transition-all duration-300 ${
      scrolled ? "bg-white/80 backdrop-blur-xl shadow-lg py-3" : "bg-transparent py-4 lg:py-6"
    } px-4 md:px-6 lg:px-10`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* Left side: hamburger (móvil) + buscador (escritorio) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
            aria-label={t.sidebar.menu.dashboard}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Bar */}
          <div className="relative group hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
            </div>
            <input
              type="text"
              placeholder={t.common.search + "..."}
              className="bg-slate-100 hover:bg-slate-200/50 border-none rounded-2xl py-2.5 pl-12 pr-6 text-xs font-semibold focus:ring-2 focus:ring-[#003366]/10 w-56 lg:w-80 transition-all outline-none"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          <NotificationBell />

          {/* User Profile */}
          <div className="flex items-center gap-2 md:gap-4 pl-3 md:pl-6 border-l border-slate-100 relative">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-black text-[#003366] uppercase tracking-wider mb-0.5">
                {user?.fullName || t.dashboard.defaultUser}
              </p>
              <div className="flex items-center gap-1.5 justify-end">
                <ShieldCheck className="w-3 h-3 text-[#C5A059]" />
                <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">
                  {user?.role || "ACCESO"}
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 group focus:outline-none"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#003366] to-[#0055aa] p-[2px] shadow-lg group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-[#003366] flex items-center justify-center text-white text-sm font-black uppercase tracking-widest">
                    {user?.fullName?.charAt(0) || <User className="w-5 h-5" />}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 top-full mt-4 w-60 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-20 overflow-hidden"
                  >
                    <div className="p-6 border-b border-slate-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.sidebar.account}</p>
                      <p className="text-xs font-bold text-[#003366] truncate">{user?.email || "usuario@istpet.edu.ec"}</p>
                    </div>
                    <div className="p-2">
                       <button className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-[#003366]/5 group-hover:text-[#003366] transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">{t.sidebar.myProfile}</span>
                       </button>
                       <button 
                         onClick={handleLogout}
                         className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-red-50 transition-colors group"
                       >
                          <div className="p-2 bg-red-50 text-red-500 rounded-xl group-hover:bg-red-100 transition-colors">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-black text-red-600 uppercase tracking-wider">{t.sidebar.logout}</span>
                       </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
