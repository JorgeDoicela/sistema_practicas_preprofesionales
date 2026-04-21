"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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
  const socketRef = useRef<Socket | null>(null);

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
    if (socketRef.current) {
      setSocket(socketRef.current);
      setConnected(socketRef.current.connected);
      return;
    }

    const newSocket = io(`${socketUrl}/notifications`, {
      query: { userId },
      // En dev evitamos ruido de "websocket failed" iniciando con polling y luego upgrade.
      transports: ["polling", "websocket"],
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

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.off("newNotification");
      newSocket.close();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
