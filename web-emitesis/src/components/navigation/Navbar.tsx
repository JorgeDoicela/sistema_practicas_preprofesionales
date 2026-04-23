"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Rutas donde NO debe aparecer el Navbar principal
    const hiddenRoutes = [
        "/login",
        "/admin",
        "/coordinador",
        "/tutor",
        "/estudiante",
        "/empresa",
        "/dashboard",
        "/registrarse",
        "/reset-password",
        "/olvido-password"
    ];

    // "/empresa" es el área autenticada; "/empresas" es página pública
    const isHidden = hiddenRoutes.some((route) => {
        if (!pathname) return false;
        if (route === "/empresa") {
            return pathname === "/empresa" || pathname.startsWith("/empresa/");
        }
        return pathname.startsWith(route);
    });

    if (isHidden) return null;

    const navLinks = [
        { name: "Inicio", path: "/" },
        { name: "Servicios", path: "/servicios" },
        { name: "Empresas", path: "/empresas" },
        { name: "Nosotros", path: "/nosotros" },
        { name: "Privacidad", path: "/privacidad" },
    ];

    return (
        <>
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl z-50">
                <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between border border-white/40 shadow-2xl">
                    {/* Brand */}
                    <Link href="/" className="flex items-center gap-3 group focus:outline-none" onClick={() => setMobileOpen(false)}>
                        <motion.div
                            whileHover={{ rotate: 10, scale: 1.1 }}
                            className="bg-brand-blue p-1.5 rounded-lg"
                        >
                            <Image
                                src={BRAND_LOGO_SRC}
                                alt="ISTPET"
                                width={120}
                                height={30}
                                className="h-6 w-auto brightness-0 invert"
                            />
                        </motion.div>
                        <div className="border-l border-border pl-3">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-brand-blue/50 dark:text-sky-400/70 leading-none mb-1">Tecnológico Traversari - ISTPET</span>
                            <span className="block text-sm font-black text-brand-blue dark:text-sky-300 leading-none">Emitesis</span>
                        </div>
                    </Link>

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((item) => {
                            const isActive = pathname === item.path;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.path}
                                    className={`text-[10px] font-black uppercase tracking-widest transition-all relative group ${
                                        isActive ? "text-brand-blue dark:text-sky-400" : "text-slate-500 dark:text-slate-400 hover:text-brand-blue dark:hover:text-sky-300"
                                    }`}
                                >
                                    {item.name}
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-underline"
                                            className="absolute -bottom-1 left-0 w-full h-[2px] bg-brand-gold"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link
                            href="/login"
                            className="bg-brand-blue text-white px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-brand-gold hover:scale-105 transition-all focus:outline-none"
                        >
                            Acceder
                        </Link>
                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileOpen(v => !v)}
                            className="md:hidden p-2 rounded-xl text-brand-blue dark:text-sky-400 hover:bg-brand-blue/5 dark:hover:bg-sky-400/10 transition-all"
                            aria-label="Menú"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
                        />
                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.2 }}
                            className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 md:hidden"
                        >
                            <div className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
                                <nav className="p-4 flex flex-col gap-1">
                                    {navLinks.map((item) => {
                                        const isActive = pathname === item.path;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.path}
                                                onClick={() => setMobileOpen(false)}
                                                className={`flex items-center justify-between px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                                    isActive
                                                        ? "bg-brand-blue text-white dark:bg-sky-500 dark:text-white"
                                                        : "text-slate-500 dark:text-slate-400 hover:bg-muted hover:text-brand-blue dark:hover:text-sky-300"
                                                }`}
                                            >
                                                {item.name}
                                                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />}
                                            </Link>
                                        );
                                    })}
                                </nav>
                                <div className="px-4 pb-4 flex flex-col gap-2">
                                    <div className="flex items-center justify-between px-1 pb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tema</span>
                                        <ThemeToggle />
                                    </div>
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileOpen(false)}
                                        className="block w-full text-center bg-brand-blue text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-gold transition-all"
                                    >
                                        Acceder al Sistema
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
