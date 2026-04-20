"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/lib/api-base";
import { toast } from "sonner";
import { Bell } from "lucide-react";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return;

    let userId: string | undefined;
    try {
      userId = JSON.parse(savedUser).id;
    } catch (e) {
      console.error("Error parsing user for socket", e);
    }

    if (!userId) return;

    // Conectar al namespace de notificaciones
    // Reemplazamos 'http://...' por la base de la API sin '/api' si es necesario
    const socketUrl = API_URL.replace("/api", "");
    const newSocket = io(`${socketUrl}/notifications`, {
      query: { userId },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on("connect", () => {
      setConnected(true);
      console.log("Socket connected to notifications namespace");
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
      console.log("Socket disconnected");
    });

    newSocket.on("newNotification", (data: any) => {
      // Mostrar toast instantáneo
      toast(data.title || "Nueva notificación", {
        description: data.message,
        icon: <Bell className="w-4 h-4 text-[#C5A059]" />,
        duration: 8000,
        action: data.link ? {
          label: "Ver",
          onClick: () => window.location.href = data.link
        } : undefined
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
