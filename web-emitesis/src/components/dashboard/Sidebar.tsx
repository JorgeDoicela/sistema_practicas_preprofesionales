"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ElementType } from "react";
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
    BookOpen,
    Handshake,
    ScrollText,
    ShieldAlert,
    BarChart3,
    Star,
    ClipboardCheck,
    MessageSquare,
    CalendarOff,
    List,
    X,
} from "lucide-react";
import { motion } from "framer-motion";
import { User as UserType } from "@/types/user";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import { getProfilePathForRole } from "@/lib/profile-route";
import { useLanguage } from "@/providers/LanguageProvider";
import Cookies from "js-cookie";

// ── Menús por rol ──────────────────────────────────────────────────────────
// Las claves deben coincidir exactamente con los valores de Role en el backend

// MENUS keys now built dynamically inside the component using t.sidebar.menu
// Static href mapping only:
type SidebarMenuKey = "dashboard" | "systemConfig" | "chatConfig" | "healthMetrics" | "announcements" |
  "careers" | "templates" | "auditLogs" | "lopdp" | "users" | "assignments" | "agreementList" |
  "newAgreement" | "manageStudents" | "evaluations" | "documents" | "reports" | "absences" |
  "myStudents" | "attendanceInterns" | "pendingAbsences" | "myDocuments" | "attendance" |
  "myAbsences" | "myEvaluation";

const MENU_DEFS: Record<string, Array<{ icon: ElementType; labelKey: SidebarMenuKey; href: string }>> = {
    ADMIN: [
        { icon: LayoutDashboard, labelKey: "dashboard",       href: "/dashboard" },
        { icon: Settings,        labelKey: "systemConfig",    href: "/admin/configuracion" },
        { icon: MessageSquare,   labelKey: "chatConfig",      href: "/admin/chat-config" },
        { icon: BarChart3,       labelKey: "healthMetrics",   href: "/admin/salud" },
        { icon: Star,            labelKey: "announcements",   href: "/admin/anuncios" },
        { icon: BookOpen,        labelKey: "careers",         href: "/admin/carreras" },
        { icon: FileText,        labelKey: "templates",       href: "/coordinador/plantillas-documentos" },
        { icon: ScrollText,      labelKey: "auditLogs",       href: "/admin/logs" },
        { icon: ShieldAlert,     labelKey: "lopdp",           href: "/admin/privacidad" },
        { icon: Users,           labelKey: "users",           href: "/admin/usuarios" },
        { icon: UserPlus,        labelKey: "assignments",     href: "/coordinador/asignacion" },
        { icon: List,            labelKey: "agreementList",   href: "/coordinador/convenios/list" },
        { icon: Handshake,       labelKey: "newAgreement",    href: "/coordinador/convenios" },
        { icon: GraduationCap,   labelKey: "manageStudents",  href: "/coordinador/estudiantes" },
        { icon: ClipboardCheck,  labelKey: "evaluations",     href: "/coordinador/evaluaciones" },
        { icon: FileStack,       labelKey: "documents",       href: "/dashboard/documentos" },
    ],
    COORDINADOR: [
        { icon: LayoutDashboard, labelKey: "dashboard",       href: "/dashboard" },
        { icon: FileText,        labelKey: "templates",       href: "/coordinador/plantillas-documentos" },
        { icon: UserPlus,        labelKey: "assignments",     href: "/coordinador/asignacion" },
        { icon: List,            labelKey: "agreementList",   href: "/coordinador/convenios/list" },
        { icon: Handshake,       labelKey: "newAgreement",    href: "/coordinador/convenios" },
        { icon: CalendarOff,     labelKey: "absences",        href: "/coordinador/ausencias" },
        { icon: GraduationCap,   labelKey: "manageStudents",  href: "/coordinador/estudiantes" },
        { icon: ClipboardCheck,  labelKey: "evaluations",     href: "/coordinador/evaluaciones" },
        { icon: BarChart3,       labelKey: "reports",         href: "/coordinador/reportes" },
        { icon: FileStack,       labelKey: "documents",       href: "/dashboard/documentos" },
    ],
    TUTOR_ACADEMICO: [
        { icon: LayoutDashboard, labelKey: "dashboard",          href: "/tutor-academico/dashboard" },
        { icon: GraduationCap,   labelKey: "myStudents",          href: "/tutor-academico/estudiantes" },
        { icon: FileStack,       labelKey: "documents",           href: "/dashboard/documentos" },
        { icon: CalendarCheck,   labelKey: "attendanceInterns",   href: "/tutor-academico/asistencia" },
        { icon: CalendarOff,     labelKey: "pendingAbsences",     href: "/tutor-academico/ausencias" },
    ],

    ESTUDIANTE: [
        { icon: LayoutDashboard, labelKey: "dashboard",    href: "/dashboard" },
        { icon: FileStack,       labelKey: "myDocuments",  href: "/dashboard/documentos" },
        { icon: CalendarCheck,   labelKey: "attendance",   href: "/dashboard/asistencia" },
        { icon: CalendarOff,     labelKey: "myAbsences",   href: "/dashboard/ausencias" },
        { icon: Star,            labelKey: "myEvaluation", href: "/dashboard/mi-evaluacion" },
    ],
    EMPRESA: [
        { icon: LayoutDashboard, labelKey: "dashboard",         href: "/empresa/dashboard" },
        { icon: CalendarCheck,   labelKey: "attendanceInterns", href: "/empresa/asistencia" },
    ],
};

// ── Componente Sidebar ─────────────────────────────────────────────────────

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [user, setUser] = useState<UserType | null>(null);
    const { t } = useLanguage();
    
    const [width, setWidth] = useState(288);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedWidth = localStorage.getItem("sidebarWidth");
        if (storedUser) {
            setTimeout(() => setUser(JSON.parse(storedUser)), 0);
        }
        if (storedWidth) setWidth(parseInt(storedWidth));
    }, []);

    useEffect(() => {
        const nav = document.getElementById("sidebar-nav");
        if (nav && user) {
            const savedScroll = sessionStorage.getItem("sidebarScroll");
            if (savedScroll) {
                // Pequeño delay para asegurar que el contenido se ha renderizado
                setTimeout(() => {
                    nav.scrollTop = parseInt(savedScroll);
                }, 0);
            }

            const handleScroll = () => {
                sessionStorage.setItem("sidebarScroll", nav.scrollTop.toString());
            };
            nav.addEventListener("scroll", handleScroll);
            return () => nav.removeEventListener("scroll", handleScroll);
        }
    }, [user]);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const stopResizing = () => setIsResizing(false);

    const resize = (e: MouseEvent) => {
        if (isResizing) {
            const newWidth = e.clientX;
            if (newWidth >= 200 && newWidth <= 480) {
                setWidth(newWidth);
                localStorage.setItem("sidebarWidth", newWidth.toString());
            }
        }
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
        }
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing]);

    const role: string = user?.role ?? "";
    const profileHref = getProfilePathForRole(role);
    const menuDefs = MENU_DEFS[role] ?? MENU_DEFS["ESTUDIANTE"];
    const menuItems = menuDefs.map(item => ({ ...item, label: t.sidebar.menu[item.labelKey] }));
    const isEmpresaRole = role === "EMPRESA";

    return (
        <>
            {/* Overlay solo en móvil */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[190] lg:hidden"
                    onClick={onClose}
                />
            )}
            <aside 
                data-tour="sidebar" 
                style={{ width: isOpen ? `${width}px` : '0px' }}
                className={cn(
                    "bg-[#003366] text-white flex flex-col h-screen border-r border-white/10 shadow-2xl transition-[transform,opacity] duration-300 ease-in-out z-[200] lg:relative lg:z-0",
                    "fixed top-0 left-0",
                    !isOpen && "-translate-x-full opacity-0",
                    isResizing && "transition-none select-none"
                )}
            >
                {/* Custom Scrollbar Styles */}
                <style jsx global>{`
                    .sidebar-scroll::-webkit-scrollbar { width: 4px; }
                    .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
                    .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                    .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(197,160,89,0.5); }
                `}</style>
 
                {/* Resize Handle */}
                <div
                    onMouseDown={startResizing}
                    className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#C5A059]/30 active:bg-[#C5A059] transition-colors z-50 group"
                />
 
            {/* Botón cerrar interno - visible en todo momento para facilitar el cierre */}
            <div className="absolute top-8 right-6 z-20">
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-white/10 text-white/50 hover:text-white hover:bg-white/20 transition-all flex items-center justify-center"
                    aria-label={t.sidebar.closeMenu}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
 
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
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C5A059] mt-1">{t.sidebar.subtitle}</p>
                    </div>
                </div>
            </div>
 
            {/* Main Navigation */}
            <nav id="sidebar-nav" data-tour="sidebar-main" className="flex-1 px-4 overflow-y-auto sidebar-scroll">
                <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">{t.sidebar.mainMenu}</p>
                <div className="space-y-1.5">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.href + item.label}
                            {...item}
                            active={
                                (item.href === "/dashboard" || item.href === "/coordinador/convenios")
                                    ? pathname === item.href 
                                    : (pathname === item.href || pathname.startsWith(item.href + "/"))
                            }
                        />
                    ))}
                </div>

                <div className="mt-8">
                    <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">{t.sidebar.account}</p>
                    <div className="space-y-1.5">
                        <SidebarItem
                            icon={UserCircle}
                            label={t.sidebar.myProfile}
                            href={profileHref}
                            active={
                                pathname === profileHref ||
                                pathname.startsWith(profileHref + "/")
                            }
                        />
                        {!isEmpresaRole && (
                            <SidebarItem
                                icon={Settings}
                                label={t.sidebar.settings}
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
                    <div className="bg-white/5 rounded-3xl p-5 border border-white/10 mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#C5A059] flex items-center justify-center font-black text-[#003366] text-sm shrink-0">
                                {user.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[11px] font-black text-white truncate">{user.fullName}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-[#C5A059]">{t.sidebar.roles[user.role as keyof typeof t.sidebar.roles] || user.role}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Badge de Seguridad Enterprise */}
                <div className="mb-4 px-2">
                    <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-green-500/10 border border-green-500/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Sesión Segura · AES-256</span>
                    </div>
                </div>

                <button
                    onClick={() => {
                        localStorage.clear();
                        Cookies.remove("token");
                        Cookies.remove("user");
                        window.location.href = "/login";
                    }}
                    className="w-full flex items-center gap-4 px-5 py-4 text-white/50 hover:text-red-400 hover:bg-red-400/5 rounded-2xl transition-all group"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t.sidebar.logout}</span>
                </button>
            </div>
        </aside>
        </>
    );
}

// ── SidebarItem ────────────────────────────────────────────────────────────

interface SidebarItemProps {
    icon: ElementType;
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
