"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, ChevronDown, User, ShieldCheck, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <header className={`sticky top-0 z-30 transition-all duration-300 ${
      scrolled ? "bg-white/80 backdrop-blur-xl shadow-lg py-3" : "bg-transparent py-6"
    } px-10`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Search Bar */}
        <div className="relative group hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar en el portal..."
            className="bg-slate-100 hover:bg-slate-200/50 border-none rounded-2xl py-2.5 pl-12 pr-6 text-xs font-semibold focus:ring-2 focus:ring-[#003366]/10 w-80 transition-all outline-none"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-8">
          
          {/* Notifications */}
          <button className="relative p-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:translate-y-[-2px] transition-all group">
            <Bell className="w-5 h-5 text-slate-500 group-hover:text-[#003366] transition-colors" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#C5A059] rounded-full border-2 border-white" />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-4 pl-8 border-l border-slate-100 relative">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-black text-[#003366] uppercase tracking-wider mb-0.5">
                {user?.fullName || "Usuario ISTPET"}
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
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cuenta</p>
                      <p className="text-xs font-bold text-[#003366] truncate">{user?.email || "usuario@istpet.edu.ec"}</p>
                    </div>
                    <div className="p-2">
                       <button className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-[#003366]/5 group-hover:text-[#003366] transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Mi Perfil</span>
                       </button>
                       <button 
                         onClick={handleLogout}
                         className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-red-50 transition-colors group"
                       >
                          <div className="p-2 bg-red-50 text-red-500 rounded-xl group-hover:bg-red-100 transition-colors">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-black text-red-600 uppercase tracking-wider">Cerrar Sesión</span>
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
