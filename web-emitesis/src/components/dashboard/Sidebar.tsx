"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  CalendarCheck, 
  Award, 
  Settings, 
  LogOut,
  ChevronRight,
  Briefcase,
  FileStack,
  UserPlus
} from "lucide-react";
import { motion } from "framer-motion";
import { User as UserType } from "@/types/user";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import { ROLES, canManageSystem, hasRole } from "@/constants/roles";

const menuItems = [
  { icon: LayoutDashboard, label: "Tablero", href: "/dashboard" },
  { icon: Users, label: "Pasantes", href: "/dashboard/pasantes" },
  { icon: Building2, label: "Empresas", href: "/dashboard/empresas" },
  { icon: FileText, label: "Convenios", href: "/coordinador/convenios" },
  { icon: FileStack, label: "Documentos", href: "/dashboard/documentos" },
  { icon: CalendarCheck, label: "Asistencia", href: "/dashboard/asistencia" },
  { icon: Award, label: "Certificaciones", href: "/dashboard/certificaciones" },
];

const secondaryItems = [
  { icon: Settings, label: "Configuración", href: "/dashboard/configuracion" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setTimeout(() => setUser(JSON.parse(storedUser)), 0);
    }
  }, []);

  const isManager = canManageSystem(user?.role);
  const isCoordinador = hasRole(user?.role, ROLES.COORDINADOR);

  const allMenuItems = [
    ...menuItems,
    ...(hasRole(user?.role, ROLES.ADMIN) ? [{ icon: Users, label: "Usuarios", href: "/admin/usuarios" }] : []),
    ...(isCoordinador ? [{ icon: Users, label: "Gestión Estudiantes", href: "/coordinador/estudiantes" }] : []),
    ...(isManager ? [{ icon: UserPlus, label: "Asignación", href: "/coordinador/asignacion" }] : [])
  ];

  return (
    <aside className="w-72 bg-[#003366] text-white flex flex-col h-screen sticky top-0 border-r border-white/5 shadow-2xl z-40">
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
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C5A059] mt-1">Socio Estratégico</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto">
        <div>
          <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Menú Principal</p>
          <div className="space-y-1.5">
            {allMenuItems.map((item) => (
              <SidebarItem 
                key={item.href} 
                {...item} 
                active={pathname === item.href} 
              />
            ))}
          </div>
        </div>

        <div>
          <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Personalización</p>
          <div className="space-y-1.5">
            {secondaryItems.map((item) => (
              <SidebarItem 
                key={item.href} 
                {...item} 
                active={pathname === item.href} 
              />
            ))}
          </div>
        </div>
      </nav>

      {/* User Support / Invite Section */}
      <div className="p-6">
        <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
          <div className="w-8 h-8 bg-[#C5A059] rounded-xl flex items-center justify-center text-[#003366] mb-3">
            <Briefcase className="w-4 h-4" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1">Prácticas v2.0</p>
          <p className="text-[11px] text-white/50 mb-4 font-medium leading-tight">Gestión integral del perfil profesional.</p>
          <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
            Ver Manual
          </button>
        </div>

        {/* Logout */}
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="w-full mt-6 flex items-center gap-4 px-5 py-4 text-white/50 hover:text-red-400 hover:bg-red-400/5 rounded-2xl transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

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
