"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";

const ChatWidget = dynamic(() => import("./ChatWidget"), { ssr: false });

export default function ChatWidgetLoader() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // 1. No mostrar mientras la sesión está cargando o si no hay usuario
  if (loading || !user) return null;

  // 2. Definir rutas donde el chat SI debe aparecer (Panel de la aplicación)
  const appRoutes = [
    "/dashboard",
    "/admin",
    "/coordinador",
    "/tutor",
    "/estudiante",
    "/empresa"
  ];

  const isAppRoute = appRoutes.some(route => pathname?.startsWith(route));

  // Solo mostrar si estamos dentro de una ruta de la aplicación
  if (!isAppRoute) return null;

  return <ChatWidget />;
}

