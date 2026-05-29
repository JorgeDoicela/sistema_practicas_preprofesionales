"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2, AlertCircle, Info, XCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { notificationsService, Notification } from "@/services/notifications.service";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const [list, count] = await Promise.all([
        notificationsService.getMyNotifications(),
        notificationsService.getUnreadCount()
      ]);
      setNotifications(Array.isArray(list) ? list : []);
      setUnreadCount(typeof count === 'number' ? count : (count as any)?.count || 0);
    } catch (e) {
      console.error("Error loading notifications", e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:translate-y-[-2px] transition-all group"
      >
        <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? "text-[#003366]" : "text-slate-500"} group-hover:text-[#003366]`} />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C5A059] border-2 border-white"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div>
                   <h4 className="text-[11px] font-black text-[#003366] uppercase tracking-widest">Alertas del Sistema</h4>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {unreadCount} Sin Leer
                   </p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest hover:text-[#003366] transition-colors"
                  >
                    Marcar todo como leído
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
                {(notifications || []).length === 0 ? (
                  <div className="p-12 text-center">
                     <Bell className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No tienes notificaciones</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <NotificationItem 
                      key={n.id} 
                      notification={n} 
                      onRead={() => handleMarkAsRead(n.id)} 
                      onClose={() => setIsOpen(false)}
                    />
                  ))
                )}
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-50 text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Praxis Hub Intelligence v2.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({ notification, onRead, onClose }: { notification: Notification, onRead: () => void, onClose: () => void }) {
  const Icon = notification.type === 'SUCCESS' ? CheckCircle2 : 
               notification.type === 'ERROR' ? XCircle : 
               notification.type === 'WARNING' ? AlertCircle : Info;

  const color = notification.type === 'SUCCESS' ? 'text-emerald-500' : 
                notification.type === 'ERROR' ? 'text-rose-500' : 
                notification.type === 'WARNING' ? 'text-amber-500' : 'text-blue-500';

  return (
    <div className={cn("p-6 border-b border-slate-50 transition-all hover:bg-slate-50/50 flex gap-4 relative group", !notification.isRead && "border-l-4 border-l-brand-gold")}>
       <div className={cn("w-10 h-10 flex items-center justify-center shrink-0", color)}>
          <Icon className="w-6 h-6" />
       </div>
       <div className="flex-1 min-w-0">
          <h5 className="text-[11px] font-black text-[#003366] uppercase tracking-tight mb-1">{notification.title}</h5>
          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{notification.message}</p>
          <div className="flex items-center gap-3 mt-3">
             <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                {new Date(notification.createdAt).toLocaleDateString()}
             </span>
             {notification.link && (
               <Link 
                 href={notification.link} 
                 onClick={onClose}
                 className="text-[9px] font-black text-[#003366] uppercase tracking-widest underline decoration-[#C5A059] decoration-2"
               >
                 Ver Detalle
               </Link>
             )}
          </div>
       </div>
       {!notification.isRead && (
         <button 
           onClick={onRead}
           className="w-2 h-2 rounded-full bg-blue-500 self-center opacity-0 group-hover:opacity-100 transition-opacity"
           title="Marcar como leído"
         />
       )}
    </div>
  );
}
