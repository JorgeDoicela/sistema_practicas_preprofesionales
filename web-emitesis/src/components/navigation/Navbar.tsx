"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import { usePathname } from "next/navigation";

export function Navbar() {
    const pathname = usePathname();

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

    // "/empresa" es el área autenticada; "/empresas" es página pública — no usar startsWith("/empresa") solo.
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
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl z-50">
            <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between border border-white/40 shadow-2xl">
                <Link href="/" className="flex items-center gap-3 group focus:outline-none">
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
                    <div className="border-l border-slate-200 pl-3">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-brand-blue/50 leading-none mb-1">Tecnológico Traversari - ISTPET</span>
                        <span className="block text-sm font-black text-brand-blue leading-none">Emitesis</span>
                    </div>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link 
                                key={item.name} 
                                href={item.path}
                                className={`text-[10px] font-black uppercase tracking-widest transition-all relative group ${
                                    isActive ? "text-brand-blue" : "text-slate-500 hover:text-brand-blue"
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

                <div className="flex items-center gap-4">
                    <Link
                        href="/login"
                        className="bg-brand-blue text-white px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-brand-gold hover:scale-105 transition-all focus:outline-none"
                    >
                        Acceder
                    </Link>
                </div>
            </div>
        </nav>
    );
}
