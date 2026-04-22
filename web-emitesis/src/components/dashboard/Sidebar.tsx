"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    Settings,
    LogOut,
    ChevronRight,
    UserCircle,
    FileStack,
    FileText,
    UserPlus,
    GraduationCap,
    FlaskConical,
    Handshake,
    ScrollText,
    ShieldAlert,
    BarChart3,
    Star,
    ClipboardCheck,
    MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import { User as UserType } from "@/types/user";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import { getProfilePathForRole } from "@/lib/profile-route";

// ── Menús por rol ──────────────────────────────────────────────────────────
// Las claves deben coincidir exactamente con los valores de Role en el backend

const MENUS: Record<string, Array<{ icon: React.ElementType; label: string; href: string }>> = {
    ADMIN: [
        { icon: LayoutDashboard, label: "Tablero",               href: "/dashboard" },
        { icon: Settings,        label: "Configuración Sistema", href: "/admin/configuracion" },
        { icon: MessageSquare,   label: "Permisos de Chat",      href: "/admin/chat-config" },
        { icon: BarChart3,       label: "Salud y Métricas",      href: "/admin/salud" },
        { icon: Star,            label: "Anuncios Globales",     href: "/admin/anuncios" },
        { icon: FileText,        label: "Plantillas",             href: "/coordinador/plantillas-documentos" },
        { icon: ScrollText,      label: "Auditoría de Sistema",   href: "/admin/logs" },
        { icon: ShieldAlert,     label: "Cumplimiento LOPDP",    href: "/admin/privacidad" },
        { icon: Users,           label: "Usuarios",              href: "/admin/usuarios" },
        { icon: UserPlus,        label: "Asignaciones",          href: "/coordinador/asignacion" },
        { icon: Handshake,       label: "Convenios",             href: "/coordinador/convenios" },
        { icon: GraduationCap,   label: "Gestión Estudiantes",   href: "/coordinador/estudiantes" },
        { icon: ClipboardCheck,  label: "Evaluaciones",          href: "/coordinador/evaluaciones" },
        { icon: FileStack,       label: "Documentos",            href: "/dashboard/documentos" },
    ],
    COORDINADOR: [
        { icon: LayoutDashboard, label: "Tablero",               href: "/dashboard" },
        { icon: FileText,        label: "Plantillas",             href: "/coordinador/plantillas-documentos" },
        { icon: UserPlus,        label: "Asignaciones",          href: "/coordinador/asignacion" },
        { icon: Handshake,       label: "Convenios",             href: "/coordinador/convenios" },
        { icon: GraduationCap,   label: "Gestión Estudiantes",   href: "/coordinador/estudiantes" },
        { icon: ClipboardCheck,  label: "Evaluaciones",          href: "/coordinador/evaluaciones" },
        { icon: BarChart3,       label: "Reportes",              href: "/coordinador/reportes" },
        { icon: FileStack,       label: "Documentos",            href: "/dashboard/documentos" },
    ],
    TUTOR_ACADEMICO: [
        { icon: LayoutDashboard, label: "Tablero",               href: "/tutor-academico/dashboard" },
        { icon: GraduationCap,   label: "Mis Estudiantes",       href: "/tutor-academico/estudiantes" },
        { icon: FileStack,       label: "Documentos",            href: "/dashboard/documentos" },
        { icon: CalendarCheck,   label: "Asistencia Pasantes",   href: "/tutor-academico/asistencia" },
    ],
    TUTOR_EMPRESARIAL: [
        { icon: LayoutDashboard, label: "Tablero",               href: "/empresa/dashboard" },
        { icon: CalendarCheck,   label: "Asistencia Pasantes",   href: "/empresa/asistencia" },
        { icon: FlaskConical,    label: "Tests de Aptitud",      href: "/empresa/dashboard" },
    ],
    ESTUDIANTE: [
        { icon: LayoutDashboard, label: "Tablero",               href: "/dashboard" },
        { icon: FileStack,       label: "Mis Documentos",        href: "/dashboard/documentos" },
        { icon: CalendarCheck,   label: "Asistencia",            href: "/dashboard/asistencia" },
        { icon: Star,            label: "Mi Evaluación",         href: "/dashboard/mi-evaluacion" },
    ],
    EMPRESA: [
        { icon: LayoutDashboard, label: "Tablero",               href: "/empresa/dashboard" },
        { icon: CalendarCheck,   label: "Asistencia Pasantes",   href: "/empresa/asistencia" },
        { icon: FlaskConical,    label: "Tests de Aptitud",      href: "/empresa/dashboard" },
    ],
};

// ── Componente Sidebar ─────────────────────────────────────────────────────

export function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<UserType | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setTimeout(() => setUser(JSON.parse(storedUser)), 0);
        }
    }, []);

    const role: string = user?.role ?? "";
    const profileHref = getProfilePathForRole(role);
    const menuItems = MENUS[role] ?? MENUS["ESTUDIANTE"];
    const isEmpresaRole = role === "EMPRESA" || role === "TUTOR_EMPRESARIAL";

    return (
        <aside data-tour="sidebar" className="w-72 bg-[#003366] text-white flex flex-col h-screen sticky top-0 border-r border-white/5 shadow-2xl z-40">
            {/* Brand Header */}
            <div className="p-8 pb-12">
                <div className="flex items-center gap-3 group">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform overflow-hidden p-1.5">
                        <Image
                            src={BRAND_LOGO_SRC}
                            alt="Emitesis"
                            width={40}
                            height={40}
                            className="object-contain w-full h-full"
                            priority
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight leading-none">EMITESIS</h1>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C5A059] mt-1">Prácticas Preprofesionales</p>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav data-tour="sidebar-navigation" className="flex-1 px-4 overflow-y-auto">
                <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">Menú Principal</p>
                <div className="space-y-1.5">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.href + item.label}
                            {...item}
                            active={pathname === item.href || pathname.startsWith(item.href + "/")}
                        />
                    ))}
                </div>

                <div className="mt-8">
                    <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">Cuenta</p>
                    <div className="space-y-1.5">
                        <SidebarItem
                            icon={UserCircle}
                            label="Mi perfil"
                            href={profileHref}
                            active={
                                pathname === profileHref ||
                                pathname.startsWith(profileHref + "/")
                            }
                        />
                        {!isEmpresaRole && (
                            <SidebarItem
                                icon={Settings}
                                label="Configuración"
                                href="/dashboard/configuracion"
                                active={pathname === "/dashboard/configuracion"}
                            />
                        )}
                    </div>
                </div>
            </nav>

            {/* User Badge + Logout */}
            <div data-tour="sidebar-footer" className="p-6">
                {user && (
                    <div className="bg-white/5 rounded-3xl p-5 border border-white/10 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#C5A059] flex items-center justify-center font-black text-[#003366] text-sm shrink-0">
                                {user.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[11px] font-black text-white truncate">{user.fullName}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-[#C5A059]">{user.role}</p>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = "/login";
                    }}
                    className="w-full flex items-center gap-4 px-5 py-4 text-white/50 hover:text-red-400 hover:bg-red-400/5 rounded-2xl transition-all group"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}

// ── SidebarItem ────────────────────────────────────────────────────────────

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    href: string;
    active: boolean;
}

function SidebarItem({ icon: Icon, label, href, active }: SidebarItemProps) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center justify-between group px-5 py-3.5 rounded-2xl transition-all relative overflow-hidden",
                active
                    ? "bg-white text-[#003366] shadow-xl shadow-indigo-900/40 translate-x-1"
                    : "text-white/60 hover:text-white hover:bg-white/5"
            )}
        >
            <div className="flex items-center gap-4 relative z-10">
                <Icon className={cn("w-5 h-5 transition-transform", active ? "scale-110" : "group-hover:scale-110")} />
                <span className="text-[11px] font-black uppercase tracking-[0.15em]">{label}</span>
            </div>
            {active ? (
                <motion.div
                    layoutId="active-indicator"
                    className="w-1.5 h-1.5 rounded-full bg-[#C5A059] relative z-10"
                />
            ) : (
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
            )}

            {active && (
                <div className="absolute inset-0 bg-gradient-to-r from-white to-white/90" />
            )}
        </Link>
    );
}
