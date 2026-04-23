"use client";

import React, { useEffect, useRef, useState, useCallback, KeyboardEvent } from "react";
import { MessageCircle, X, Send, ChevronLeft, Search, Users, Wifi, WifiOff, Trash2, ShieldCheck, MoreVertical } from "lucide-react";
import { useChat, type ChatMessage, type ChatRoom } from "@/providers/ChatProvider";
import ChatPrivacyNotice from "./ChatPrivacyNotice";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { API_URL } from "@/lib/api-base";
import { useLanguage } from "@/providers/LanguageProvider";

const PRIVACY_NOTICE_KEY = "chat_privacy_notice_accepted";
const DELETE_WINDOW_HOURS = 24;

const locales: Record<string, any> = { es, en: enUS };

// ── Componente principal ────────────────────────────────────────────────────

export default function ChatWidget() {
  const { t, locale } = useLanguage();
  const currentLocale = locales[locale] || es;

  const {
    connected,
    rooms,
    messages,
    contacts,
    activeRoomId,
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
  } = useChat();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "contacts" | "chat">("list");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [myId, setMyId] = useState("");
  const [myName, setMyName] = useState("");
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [retentionDays, setRetentionDays] = useState(730);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [msgMenuId, setMsgMenuId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const ROLE_LABELS: Record<string, string> = {
    ADMIN: t.sidebar.roles.ADMIN,
    COORDINADOR: t.sidebar.roles.COORDINADOR,
    TUTOR: t.sidebar.roles.TUTOR_ACADEMICO,
    TUTOR_EMPRESARIAL: t.sidebar.roles.TUTOR_EMPRESARIAL,
    ESTUDIANTE: t.sidebar.roles.ESTUDIANTE,
    EMPRESA: t.sidebar.roles.EMPRESA,
  };

  const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700",
    COORDINADOR: "bg-blue-100 text-blue-700",
    TUTOR: "bg-green-100 text-green-700",
    TUTOR_EMPRESARIAL: "bg-orange-100 text-orange-700",
    ESTUDIANTE: "bg-violet-100 text-violet-700",
    EMPRESA: "bg-amber-100 text-amber-700",
  };

  const initials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map(w => w[0])
      .join("")
      .toUpperCase();
  };

  const formatMsgTime = (date: string | Date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return `${t.chat.yesterday} ${format(d, "HH:mm")}`;
    return format(d, "d MMM HH:mm", { locale: currentLocale });
  };

  const dateSeparatorLabel = (date: Date) => {
    if (isToday(date)) return t.chat.today;
    if (isYesterday(date)) return t.chat.yesterday;
    return format(date, "EEEE d 'de' MMMM", { locale: currentLocale });
  };

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") ?? "{}");
      setMyId(u.id ?? "");
      setMyName(u.fullName ?? "");
    } catch {}
    // Cargar período de retención desde la API (SystemSetting)
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_URL}/settings/chat_message_retention_days`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(res => {
          const val = (res && typeof res === 'object' && 'success' in res) ? res.data?.value : res?.value;
          if (val) setRetentionDays(parseInt(val, 10) || 730);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (open) {
      refreshRooms();
      refreshContacts();
      // Mostrar aviso de privacidad si no se ha aceptado aún
      if (!localStorage.getItem(PRIVACY_NOTICE_KEY)) {
        setShowPrivacyNotice(true);
      }
    }
  }, [open, refreshRooms, refreshContacts]);

  // Scroll al fondo en nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Foco en input al abrir chat
  useEffect(() => {
    if (view === "chat") inputRef.current?.focus();
  }, [view]);

  // ── Helpers ──

  const activeRoom = rooms.find(r => r.id === activeRoomId);
  const otherMember = activeRoom?.members.find(m => m.id !== myId);
  const isOtherOnline = otherMember ? onlineUserIds.has(otherMember.id) : false;

  const typingInRoom = activeRoomId ? [...(typingByRoom[activeRoomId] ?? [])] : [];
  const typingNames = typingInRoom
    .filter(id => id !== myId)
    .map(id => {
      const member = activeRoom?.members.find(m => m.id === id);
      return member?.fullName.split(" ")[0] ?? t.chat.someone;
    });

  const filteredContacts = contacts.filter(
    c =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (ROLE_LABELS[c.role] ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const filteredRooms = rooms.filter(r => {
    const other = r.members.find(m => m.id !== myId);
    return other?.fullName.toLowerCase().includes(search.toLowerCase()) ?? true;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAcceptPrivacy = useCallback(() => {
    localStorage.setItem(PRIVACY_NOTICE_KEY, "1");
    setShowPrivacyNotice(false);
  }, []);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setDeletingMsgId(messageId);
    setMsgMenuId(null);
    try {
      const res = await fetch(`${API_URL}/chat/messages/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const isSuccess = (json && typeof json === 'object' && 'success' in json) ? json.success : res.ok;
      
      if (isSuccess && activeRoomId) {
        openRoomById(activeRoomId);
      }
    } catch {}
    setDeletingMsgId(null);
  }, [activeRoomId, openRoomById]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput("");
    emitStopTyping();
    inputRef.current?.focus();
  }, [input, sendMessage, emitStopTyping]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (e.target.value) emitTyping();
    else emitStopTyping();
  };

  const handleOpenRoom = (targetUserId: string) => {
    openRoom(targetUserId);
    setView("chat");
    setSearch("");
  };

  const handleSelectRoom = (roomId: string) => {
    openRoomById(roomId);
    markRead(roomId);
    setView("chat");
    setSearch("");
  };

  const handleBack = () => {
    emitStopTyping();
    setActiveRoomId(null);
    setView("list");
  };

  // ── Separadores de fecha ──────────────────────────────────────────────────

  const messagesWithSeparators = messages.reduce<
    Array<ChatMessage | { type: "separator"; label: string; key: string }>
  >((acc, msg, i) => {
    const prev = messages[i - 1];
    const currDate = new Date(msg.createdAt);
    const prevDate = prev ? new Date(prev.createdAt) : null;
    if (!prevDate || !isSameDay(currDate, prevDate)) {
      acc.push({ type: "separator", label: dateSeparatorLabel(currDate), key: `sep-${i}` });
    }
    acc.push(msg);
    return acc;
  }, []);

  if (!myId) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#003366] shadow-xl hover:bg-[#004080] transition-all active:scale-95"
        aria-label={t.chat.floatingLabel}
      >
        {open ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6 text-white" />
            {unreadTotal > 0 && (
              <span className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#C5A059] text-[10px] font-bold text-white shadow">
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden"
          style={{ width: 340, height: 560 }}
          onClick={() => setMsgMenuId(null)}
        >
          {/* Aviso LOPDP — se superpone al panel en el primer uso */}
          {showPrivacyNotice && (
            <ChatPrivacyNotice
              retentionDays={retentionDays}
              onAccept={handleAcceptPrivacy}
              onClose={() => { setShowPrivacyNotice(false); setOpen(false); }}
            />
          )}
          {/* ── Header ── */}
          <div className="flex items-center justify-between bg-[#003366] px-4 py-3 shrink-0">
            {view === "chat" && otherMember ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-white min-w-0"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold truncate max-w-[160px]">
                    {otherMember.fullName}
                  </p>
                  <p className={`text-[10px] ${isOtherOnline ? "text-green-300" : "text-white/50"}`}>
                    {isOtherOnline ? t.chat.online : t.chat.offline}
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-white/80" />
                <span className="text-sm font-semibold text-white">
                  {view === "contacts" ? t.chat.newConversation : t.chat.messages}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span title={connected ? t.chat.connected : t.chat.disconnected}>
                {connected ? (
                  <Wifi className="h-3.5 w-3.5 text-green-300" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-red-300" />
                )}
              </span>

              {view !== "chat" && (
                <button
                  onClick={() => { setView(view === "contacts" ? "list" : "contacts"); setSearch(""); }}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white hover:bg-white/20 transition-colors flex items-center gap-1"
                >
                  {view === "contacts" ? (
                    <><ChevronLeft className="h-3 w-3" /> {t.chat.chats}</>
                  ) : (
                    <><Users className="h-3 w-3" /> {t.chat.new}</>
                  )}
                </button>
              )}
              <button
                onClick={() => setShowPrivacyNotice(true)}
                title={t.nav.privacyLink}
                className="text-[#C5A059] hover:text-white transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Buscador ── */}
          {view !== "chat" && (
            <div className="px-3 py-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={view === "contacts" ? t.chat.searchContactPlaceholder : t.chat.searchPlaceholder}
                  className="flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* ── Contenido ── */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* Lista de conversaciones */}
            {view === "list" && (
              <>
                {filteredRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                    <MessageCircle className="h-10 w-10 text-slate-200" />
                    <p className="text-sm font-medium text-slate-500">{t.chat.noRooms}</p>
                    <p className="text-xs text-slate-400">
                      {contacts.length > 0
                        ? t.chat.noRoomsSub
                        : t.chat.noContactsSub}
                    </p>
                    {contacts.length > 0 && (
                      <button
                        onClick={() => setView("contacts")}
                        className="text-xs font-medium text-[#003366] underline underline-offset-2"
                      >
                        {t.chat.viewContacts}
                      </button>
                    )}
                  </div>
                ) : (
                  filteredRooms.map(room => {
                    const other = room.members.find(m => m.id !== myId);
                    const isOnline = other ? onlineUserIds.has(other.id) : false;
                    return (
                      <button
                        key={room.id}
                        onClick={() => handleSelectRoom(room.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100/80 last:border-0 text-left"
                      >
                        <div className={`relative shrink-0 flex items-center justify-center h-10 w-10 text-sm rounded-full bg-[#003366] text-white font-semibold`}>
                          {initials(other?.fullName ?? "?")}
                          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isOnline ? "bg-green-400" : "bg-slate-300"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-medium text-slate-800 truncate">
                              {other?.fullName ?? "Usuario"}
                            </span>
                            {room.lastMessage && (
                              <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                                {formatMsgTime(room.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500 truncate max-w-[170px]">
                              {room.lastMessage
                                ? (room.lastMessage.senderId === myId ? `${t.chat.you}: ` : "") + room.lastMessage.content
                                : <em className="not-italic text-slate-400">{t.chat.emptyMessages}</em>}
                            </p>
                            {room.unreadCount > 0 && (
                              <span className="ml-1 flex h-4 min-w-[1rem] shrink-0 items-center justify-center rounded-full bg-[#C5A059] px-1 text-[10px] font-bold text-white">
                                {room.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </>
            )}

            {/* Lista de contactos */}
            {view === "contacts" && (
              <>
                {filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
                    <Users className="h-10 w-10 text-slate-200" />
                    <p className="text-sm font-medium text-slate-500">{t.chat.noContacts}</p>
                    <p className="text-xs text-slate-400">{t.chat.noContactsSub}</p>
                  </div>
                ) : (
                  <>
                    {Array.from(
                      new Set(filteredContacts.map(c => c.context ?? ROLE_LABELS[c.role] ?? c.role)),
                    ).map(group => {
                      const groupContacts = filteredContacts.filter(
                        c => (c.context ?? ROLE_LABELS[c.role] ?? c.role) === group,
                      );
                      return (
                        <div key={group}>
                          <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/80 border-b border-slate-100">
                            {group}
                          </p>
                          {groupContacts.map(contact => {
                            const isOnline = onlineUserIds.has(contact.id);
                            return (
                              <button
                                key={contact.id}
                                onClick={() => handleOpenRoom(contact.id)}
                                className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100/80 last:border-0 text-left"
                              >
                                <div className={`relative shrink-0 flex items-center justify-center h-8 w-8 text-xs rounded-full bg-[#003366] text-white font-semibold`}>
                                  {initials(contact.fullName)}
                                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isOnline ? "bg-green-400" : "bg-slate-300"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-800 truncate">
                                    {contact.fullName}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${ROLE_COLORS[contact.role] ?? "bg-slate-100 text-slate-600"}`}>
                                      {ROLE_LABELS[contact.role] ?? contact.role}
                                    </span>
                                    {isOnline && (
                                      <span className="text-[10px] text-green-500 font-medium">{t.chat.online}</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}

            {/* Vista de chat */}
            {view === "chat" && (
              <div className="flex flex-col h-full">
                {otherMember && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100 shrink-0">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[otherMember.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {ROLE_LABELS[otherMember.role] ?? otherMember.role}
                    </span>
                    <span className="text-xs text-slate-400 truncate">{otherMember.email}</span>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 min-h-0">
                  {messagesWithSeparators.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                      <p className="text-xs text-slate-400">{t.chat.writeFirst}</p>
                    </div>
                  )}

                  {messagesWithSeparators.map(item => {
                    if ("type" in item && item.type === "separator") {
                      return (
                        <div key={item.key} className="flex items-center gap-3 py-2">
                          <div className="flex-1 h-px bg-slate-100" />
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {item.label}
                          </span>
                          <div className="flex-1 h-px bg-slate-100" />
                        </div>
                      );
                    }

                    const msg = item as ChatMessage;
                    const isMe = msg.senderId === myId;
                    const isDeleted = !!(msg as any).deletedAt || msg.content === "[Mensaje eliminado]" || msg.content === t.chat.deleted;
                    const isAnonymized = msg.content === t.chat.anonymized;
                    const hoursOld = (Date.now() - new Date(msg.createdAt).getTime()) / 3_600_000;
                    const canDelete = isMe && !isDeleted && !isAnonymized && hoursOld <= DELETE_WINDOW_HOURS;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="relative group flex items-end gap-1">
                          {canDelete && (
                            <div className={`order-first shrink-0 ${isMe ? "order-last" : ""}`}>
                              <button
                                onClick={() => setMsgMenuId(msgMenuId === msg.id ? null : msg.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-slate-100 text-slate-400"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                              {msgMenuId === msg.id && (
                                <div className={`absolute bottom-8 z-20 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 py-1 ${isMe ? "right-0" : "left-0"} min-w-[140px]`}>
                                  <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    disabled={deletingMsgId === msg.id}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {deletingMsgId === msg.id ? t.chat.deleting : t.chat.deleteMessage}
                                  </button>
                                  <p className="px-3 pb-1.5 text-[10px] text-slate-400">
                                    Art. 22 LOPDP · 24h
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          <div
                            className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-snug break-words ${
                              isDeleted || isAnonymized
                                ? "bg-slate-100 text-slate-400 italic"
                                : isMe
                                  ? "bg-[#003366] text-white rounded-br-sm"
                                  : "bg-slate-100 text-slate-800 rounded-bl-sm"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                          {formatMsgTime(msg.createdAt)}
                          {isMe && !isDeleted && !isAnonymized && msg.readAt && (
                            <span className="ml-1 text-[#C5A059]">✓✓</span>
                          )}
                        </span>
                      </div>
                    );
                  })}

                  {typingNames.length > 0 && (
                    <div className="flex items-start gap-1.5">
                      <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span className="text-[10px] text-slate-400 self-end pb-0.5">
                        {typingNames.join(", ")} {typingNames.length === 1 ? t.chat.typingSingle : t.chat.typingPlural}
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* ── Input de mensaje ── */}
          {view === "chat" && (
            <div className="border-t border-slate-100 px-3 py-2 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t.chat.inputPlaceholder}
                  rows={1}
                  className="flex-1 resize-none rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 max-h-24 overflow-y-auto leading-snug"
                  style={{ minHeight: 36 }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#003366] text-white disabled:opacity-40 hover:bg-[#004080] transition-colors active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-400">
                  {t.chat.shiftEnter}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPrivacyNotice(true)}
                  className="flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-[#C5A059] transition-colors"
                  title="LOPDP Policy"
                >
                  <ShieldCheck className="h-3 w-3" />
                  <span>{t.chat.retention.replace('{days}', retentionDays.toString())}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
