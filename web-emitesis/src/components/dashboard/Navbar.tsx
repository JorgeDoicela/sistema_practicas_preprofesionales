"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User as UserType } from "@/types/user";
import { User, ShieldCheck, ChevronDown, LogOut, Menu } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { useLanguage } from "@/providers/LanguageProvider";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";
import { getProfilePathForRole } from "@/lib/profile-route";

export function Navbar({
    onMenuToggle,
    sidebarOpen = false
}: {
    onMenuToggle?: () => void;
    sidebarOpen?: boolean;
}) {
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
        <header data-tour="navbar" className={`sticky top-0 z-30 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-xl shadow-lg py-3" : "bg-transparent py-4 lg:py-6"
            } px-4 md:px-6 lg:px-10`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

                {/* Left Side: Mobile Menu Trigger + Welcome Greeting */}
                <div className="flex items-center gap-3 min-w-0">
                    {onMenuToggle && (
                        <button
                            onClick={onMenuToggle}
                            className={cn(
                                "p-2 rounded-xl bg-slate-50 border border-slate-100 text-[#003366] hover:bg-slate-100 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-blue/10 shrink-0",
                                sidebarOpen ? "lg:hidden" : "flex"
                            )}
                            aria-label="Abrir menú"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    )}

                    <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C5A059] mb-0.5 block truncate">
                            {t.common?.ecosystemName || "Praxis Hub"}
                        </span>
                        <h1 className="text-sm md:text-base font-black text-[#003366] tracking-tight leading-none truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none">
                            {user ? `¡Hola de nuevo, ${user.fullName.split(' ')[0]}!` : "Panel de Gestión"}
                        </h1>
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
                            <p className="text-sm font-black text-brand-blue tracking-tight leading-none mb-1">
                                {user?.fullName || "Mariana López"}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {user?.role || "Estudiante"}
                            </p>
                        </div>


                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex items-center gap-2 group focus:outline-none"
                        >
                            <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-all">
                                <span className="text-brand-blue text-sm font-black">
                                    {user?.fullName?.charAt(0) || "M"}
                                </span>
                            </div>
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
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
                                            <p className="text-xs font-bold text-brand-blue truncate">{user?.email || "usuario@istpet.edu.ec"}</p>

                                        </div>
                                        <div className="p-2">
                                            <Link
                                                href={getProfilePathForRole(user?.role)}
                                                onClick={() => setIsOpen(false)}
                                                className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 transition-colors group"
                                            >
                                                <div className="p-2 text-slate-500 group-hover:text-brand-blue transition-colors shrink-0">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">{t.sidebar.myProfile}</span>
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-red-50 transition-colors group"
                                            >
                                                <div className="p-2 text-red-500 transition-colors shrink-0">
                                                    <LogOut className="w-5 h-5" />
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
