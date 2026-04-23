"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/lib/api-base";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ChatUser {
  id: string;
  fullName: string;
  role: string;
  email?: string;
  context?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
  sender: { id: string; fullName: string; role: string };
}

export interface ChatRoom {
  id: string;
  isGroup: boolean;
  name?: string | null;
  members: ChatUser[];
  lastMessage?: ChatMessage | null;
  unreadCount: number;
}

interface TypingState {
  /** roomId → Set de userIds que están escribiendo */
  [roomId: string]: Set<string>;
}

interface ChatContextType {
  chatSocket: Socket | null;
  connected: boolean;
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messages: ChatMessage[];
  contacts: ChatUser[];
  unreadTotal: number;
  onlineUserIds: Set<string>;
  typingByRoom: TypingState;
  openRoom: (targetUserId: string) => void;
  openRoomById: (roomId: string) => void;
  sendMessage: (content: string) => void;
  markRead: (roomId: string) => void;
  setActiveRoomId: (id: string | null) => void;
  emitTyping: () => void;
  emitStopTyping: () => void;
  refreshRooms: () => Promise<void>;
  refreshContacts: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({
  chatSocket: null,
  connected: false,
  rooms: [],
  activeRoomId: null,
  messages: [],
  contacts: [],
  unreadTotal: 0,
  onlineUserIds: new Set(),
  typingByRoom: {},
  openRoom: () => {},
  openRoomById: () => {},
  sendMessage: () => {},
  markRead: () => {},
  setActiveRoomId: () => {},
  emitTyping: () => {},
  emitStopTyping: () => {},
  refreshRooms: async () => {},
  refreshContacts: async () => {},
});

export const useChat = () => useContext(ChatContext);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  // Si la respuesta viene envuelta por el TransformInterceptor del backend
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomIdState] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingByRoom, setTypingByRoom] = useState<TypingState>({});

  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef<string | null>(null);
  const activeRoomRef = useRef<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincronizar ref con estado para evitar closures obsoletas
  const setActiveRoomId = useCallback((id: string | null) => {
    activeRoomRef.current = id;
    setActiveRoomIdState(id);
  }, []);

  const refreshRooms = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const data = await apiFetch<ChatRoom[]>("/chat/rooms", tokenRef.current);
      setRooms(data);
      setUnreadTotal(data.reduce((s, r) => s + (r.unreadCount ?? 0), 0));
    } catch {}
  }, []);

  const refreshContacts = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const data = await apiFetch<ChatUser[]>("/chat/contacts", tokenRef.current);
      setContacts(data);
    } catch {}
  }, []);

  const refreshUnread = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const { count } = await apiFetch<{ count: number }>("/chat/unread", tokenRef.current);
      setUnreadTotal(count);
    } catch {}
  }, []);

  // Cargar historial de la sala activa
  const loadRoomHistory = useCallback(async (roomId: string) => {
    if (!tokenRef.current) return;
    try {
      const data = await apiFetch<ChatMessage[]>(
        `/chat/rooms/${roomId}/messages`,
        tokenRef.current,
      );
      setMessages(data);
    } catch {}
  }, []);

  // ── Socket setup ─────────────────────────────────────────────────────────

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return;
    tokenRef.current = savedToken;

    if (socketRef.current) {
      setSocket(socketRef.current);
      setConnected(socketRef.current.connected);
      return;
    }

    const socketUrl = API_URL.replace("/api", "");
    const newSocket = io(`${socketUrl}/chat`, {
      query: { token: savedToken },
      auth: { token: savedToken },
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on("connect", () => {
      setConnected(true);
      // Pedir lista de online inmediatamente
      newSocket.emit("getOnlineUsers", {}, (res: { onlineUserIds: string[] }) => {
        if (res?.onlineUserIds) {
          setOnlineUserIds(new Set(res.onlineUserIds));
        }
      });
      refreshRooms();
      refreshContacts();
    });

    newSocket.on("disconnect", () => setConnected(false));

    newSocket.on("newMessage", (msg: ChatMessage) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        // Solo añadir si estamos en esa sala
        if (activeRoomRef.current === msg.roomId) return [...prev, msg];
        return prev;
      });
      setRooms(prev =>
        prev
          .map(r =>
            r.id === msg.roomId
              ? {
                  ...r,
                  lastMessage: msg,
                  unreadCount:
                    activeRoomRef.current === msg.roomId ? 0 : r.unreadCount + 1,
                }
              : r,
          )
          .sort((a, b) => {
            const tA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const tB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return tB - tA;
          }),
      );
      if (activeRoomRef.current !== msg.roomId) {
        setUnreadTotal(p => p + 1);
      }
    });

    newSocket.on("userStatusChange", ({ userId, online }: { userId: string; online: boolean }) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    newSocket.on("typing", ({ userId, roomId }: { userId: string; roomId: string }) => {
      setTypingByRoom(prev => {
        const roomSet = new Set(prev[roomId] ?? []);
        roomSet.add(userId);
        return { ...prev, [roomId]: roomSet };
      });
    });

    newSocket.on("stopTyping", ({ userId, roomId }: { userId: string; roomId: string }) => {
      setTypingByRoom(prev => {
        const roomSet = new Set(prev[roomId] ?? []);
        roomSet.delete(userId);
        return { ...prev, [roomId]: roomSet };
      });
    });

    newSocket.on("messagesRead", ({ roomId }: { roomId: string }) => {
      setMessages(prev =>
        prev.map(m =>
          m.roomId === roomId && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m,
        ),
      );
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    refreshRooms();
    refreshContacts();

    return () => {
      ["connect", "disconnect", "newMessage", "userStatusChange", "typing", "stopTyping", "messagesRead"].forEach(
        e => newSocket.off(e),
      );
      newSocket.close();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar historial al cambiar sala activa
  useEffect(() => {
    if (!activeRoomId) return;
    loadRoomHistory(activeRoomId);
    markRead(activeRoomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId]);

  // ── Acciones ──────────────────────────────────────────────────────────────

  const openRoom = useCallback(
    (targetUserId: string) => {
      if (!socket) return;
      socket.emit(
        "joinRoom",
        { targetUserId },
        (res: { roomId: string; history: ChatMessage[] } | undefined) => {
          if (!res) return;
          setMessages(res.history ?? []);
          setActiveRoomId(res.roomId);
          refreshRooms();
        },
      );
    },
    [socket, refreshRooms, setActiveRoomId],
  );

  const openRoomById = useCallback(
    (roomId: string) => {
      setActiveRoomId(roomId);
    },
    [setActiveRoomId],
  );

  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !activeRoomRef.current) return;
      socket.emit("sendMessage", { roomId: activeRoomRef.current, content });
    },
    [socket],
  );

  const markRead = useCallback(
    (roomId: string) => {
      if (socket) socket.emit("markRead", { roomId });
      setRooms(prev =>
        prev.map(r => (r.id === roomId ? { ...r, unreadCount: 0 } : r)),
      );
      refreshUnread();
    },
    [socket, refreshUnread],
  );

  const emitTyping = useCallback(() => {
    if (!socket || !activeRoomRef.current) return;
    socket.emit("typing", { roomId: activeRoomRef.current });
    // Auto-stop typing después de 3 s de inactividad
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (activeRoomRef.current) {
        socket.emit("stopTyping", { roomId: activeRoomRef.current });
      }
    }, 3000);
  }, [socket]);

  const emitStopTyping = useCallback(() => {
    if (!socket || !activeRoomRef.current) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socket.emit("stopTyping", { roomId: activeRoomRef.current });
  }, [socket]);

  return (
    <ChatContext.Provider
      value={{
        chatSocket: socket,
        connected,
        rooms,
        activeRoomId,
        messages,
        contacts,
        unreadTotal,
        onlineUserIds,
        typingByRoom,
        openRoom,
        openRoomById,
        sendMessage,
        markRead,
        setActiveRoomId,
        emitTyping,
        emitStopTyping,
        refreshRooms,
        refreshContacts,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
