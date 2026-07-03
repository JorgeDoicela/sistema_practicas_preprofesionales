"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/lib/api-base";
import { AUTH_TOKEN_UPDATED_EVENT } from "@/services/auth.service";
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
    const handleAuthChange = () => {
      const savedUser = localStorage.getItem("user");
      if (!savedUser) {
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }
        setSocket(null);
        setConnected(false);
        return;
      }

      let userId: string | undefined;
      try {
        userId = JSON.parse(savedUser).id;
      } catch (e) {
        console.error("Error parsing user for socket", e);
      }

      if (!userId) return;

      const socketUrl = API_URL.replace("/api", "");
      if (socketRef.current) {
        setSocket(socketRef.current);
        setConnected(socketRef.current.connected);
        return;
      }

      const newSocket = io(`${socketUrl}/notifications`, {
        query: { userId },
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
    };

    window.addEventListener(AUTH_TOKEN_UPDATED_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    handleAuthChange();

    return () => {
      window.removeEventListener(AUTH_TOKEN_UPDATED_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("newNotification");
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
