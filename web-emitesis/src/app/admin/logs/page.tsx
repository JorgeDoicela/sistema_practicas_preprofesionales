"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  Activity, 
  Terminal, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  Bug, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Trash2,
  Zap,
  Globe,
  User as UserIcon,
  History as HistoryIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/services/auth.service";
import { useSocket } from "@/providers/SocketProvider";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

function AdminLogsContent() {
  const searchParams = useSearchParams();
  const initialLevel = searchParams.get("level") || "";

  const [logs, setLogs] = useState<any[]>([]);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLiveEnabled, setIsLiveEnabled] = useState(true);
  const [level, setLevel] = useState(initialLevel);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  const toggleLogExpand = (id: string) => {
    setExpandedLogs(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const { socket, connected } = useSocket();
  const liveLogsEndRef = useRef<HTMLDivElement>(null);

  const loadLogs = useCallback(async (p: number, lvl: string) => {
    try {
      setLoading(true);
      const url = `/system-logs?page=${p}&limit=20${lvl ? `&level=${lvl}` : ""}`;
      const res: any = await api.get(url);
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.items) ? res.data.items : (Array.isArray(res.data?.data) ? res.data.data : []));
      setLogs(data);
      setTotalPages(res.data?.meta?.totalPages || res.meta?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs(page, level);
  }, [page, level, loadLogs]);

  useEffect(() => {
    if (socket && isLiveEnabled) {
      socket.on('liveLog', (newLog: any) => {
        setLiveLogs(prev => [newLog, ...prev].slice(0, 50));
      });
      return () => {
        socket.off('liveLog');
      };
    }
  }, [socket, isLiveEnabled]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-rose-500';
      case 'WARN': return 'text-amber-600';
      default: return 'text-indigo-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AUTH': return <ShieldAlert className="w-4 h-4" />;
      case 'HTTP': return <Globe className="w-4 h-4" />;
      case 'SYSTEM': return <Terminal className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-12 pb-20 max-w-[1600px] mx-auto">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
              Monitoreo Institucional
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">
              Registro de <span className="text-slate-400">Actividades</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              Auditoría de seguridad en tiempo real y registro histórico de eventos.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={cn(
               "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
               connected ? "text-emerald-600" : "text-rose-600"
             )}>
                <Zap className={cn("w-3 h-3", connected && "animate-pulse")} />
                {connected ? "Conexión Activa" : "Desconectado"}
             </div>
             <button 
                onClick={() => setIsLiveEnabled(!isLiveEnabled)}
                className={cn(
                  "px-5 py-2.5 rounded-xl border font-bold text-sm transition-all",
                  isLiveEnabled ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white border-slate-200 text-slate-500"
                )}
             >
                {isLiveEnabled ? "Monitor en Vivo ACTIVADO" : "Monitor en Vivo DESACTIVADO"}
             </button>
          </div>
        </section>

        <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
           {/* Terminal en Vivo */}
           <div className={cn(
             "lg:col-span-12 transition-all duration-700 overflow-hidden",
             isLiveEnabled ? "h-[450px] opacity-100" : "h-0 opacity-0 mb-[-2rem]"
           )} data-tour="logs-live">
              <div className="bg-slate-900 rounded-[2.5rem] h-full flex flex-col border border-white/5 shadow-2xl relative">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                     <Terminal className="w-40 h-40 text-white" />
                  </div>
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="ml-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Seguridad Institucional · Consola de Eventos</span>
                     </div>
                     <span className="text-[10px] font-black text-indigo-400 animate-pulse uppercase tracking-widest">● EN VIVO</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 font-mono text-xs space-y-3 custom-scrollbar scroll-smooth">
                     {liveLogs.length === 0 ? (
                       <div className="h-full flex items-center justify-center text-slate-600 italic">
                          Esperando eventos del sistema...
                       </div>
                     ) : (
                        liveLogs.map((log, i) => {
                          const hasMetadata = log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0;
                          const liveKey = `${log.id}_live_${i}`;
                          const isExpanded = !!expandedLogs[liveKey];
                          return (
                            <div key={liveKey} className="flex flex-col gap-2 group hover:bg-white/5 p-2 rounded-lg transition-colors border-b border-white/5">
                              <div className="flex gap-4">
                                 <span className="text-slate-600 shrink-0">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                                 <span className={cn(
                                   "font-bold shrink-0",
                                   log.level === 'ERROR' ? 'text-rose-500' : log.level === 'WARN' ? 'text-amber-500' : 'text-emerald-500'
                                 )}>{log.level}</span>
                                 <span className="text-white break-all">
                                    <span className="text-indigo-400 font-bold">[{log.category}]</span> {log.message}
                                    {log.path && <span className="text-slate-500 ml-2">[{log.method} {log.path}]</span>}
                                    {log.statusCode && <span className={cn("ml-2 font-bold", log.statusCode >= 400 ? 'text-rose-400' : 'text-emerald-400')}>{log.statusCode}</span>}
                                    {hasMetadata && (
                                      <button 
                                        onClick={() => toggleLogExpand(liveKey)}
                                        className={cn(
                                          "ml-3 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-tighter uppercase transition-colors shrink-0",
                                          isExpanded ? "bg-indigo-600 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"
                                        )}
                                      >
                                        {isExpanded ? "{Ocultar}" : "{Meta}"}
                                      </button>
                                    )}
                                 </span>
                              </div>
                              {hasMetadata && isExpanded && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }} 
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="pl-20 overflow-hidden"
                                >
                                  <pre className="bg-black/50 text-indigo-300 p-4 rounded-xl text-[10px] font-mono whitespace-pre-wrap overflow-x-auto max-h-[200px] border border-white/5">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </motion.div>
                              )}
                            </div>
                          );
                        })
                     )}
                     <div ref={liveLogsEndRef} />
                  </div>
              </div>
           </div>

           {/* Registro Histórico */}
           <div className="lg:col-span-12" data-tour="logs-history">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                 <div className="p-4 sm:p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                          <HistoryIcon className="w-5 h-5" />
                       </div>
                       <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight">Registro Histórico</h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <button 
                          disabled={page === 1}
                          onClick={() => setPage(p => p - 1)}
                          className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition-all"
                       >
                          <ChevronLeft className="w-5 h-5" />
                       </button>
                       <span className="text-xs font-black text-[#003366] px-4 uppercase tracking-widest">
                          Página {page} de {totalPages}
                       </span>
                       <button 
                          disabled={page === totalPages}
                          onClick={() => setPage(p => p + 1)}
                          className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition-all"
                       >
                          <ChevronRight className="w-5 h-5" />
                       </button>
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                             <th className="px-8 py-5">Nivel / Categoria</th>
                             <th className="px-8 py-5">Mensaje / Origen</th>
                             <th className="px-8 py-5">Actor / IP</th>
                             <th className="px-8 py-5">Tiempo</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                              <tr key={i} className="animate-pulse">
                                 <td colSpan={4} className="px-8 py-6 bg-slate-50/20" />
                              </tr>
                            ))
                          ) : logs.map(log => {
                            const hasMetadata = log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0;
                            const isExpanded = !!expandedLogs[log.id];
                            return (
                              <React.Fragment key={log.id}>
                                <tr className="hover:bg-slate-50/80 transition-colors group">
                                   <td className="px-8 py-6">
                                      <div className="flex items-center gap-3">
                                         <span className={cn(
                                           "text-[9px] font-black uppercase tracking-widest",
                                           getLevelColor(log.level)
                                         )}>
                                            {log.level}
                                         </span>
                                         <div className="flex items-center gap-1.5 text-slate-400">
                                            {getCategoryIcon(log.category)}
                                            <span className="text-[9px] font-bold uppercase tracking-widest">{log.category}</span>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-8 py-6">
                                      <p className="text-xs font-bold text-[#003366] mb-1 line-clamp-1">{log.message}</p>
                                      <div className="flex items-center gap-3">
                                         {log.method && (
                                           <span className="text-[9px] font-black text-indigo-500 uppercase">{log.method}</span>
                                         )}
                                         <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{log.path || 'N/A'}</span>
                                         {log.statusCode && (
                                           <span className={cn(
                                             "text-[10px] font-bold",
                                             log.statusCode >= 400 ? 'text-rose-500' : 'text-emerald-500'
                                           )}>{log.statusCode}</span>
                                         )}
                                         {hasMetadata && (
                                           <button 
                                              onClick={() => toggleLogExpand(log.id)}
                                              className={cn(
                                                "inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all shrink-0",
                                                isExpanded 
                                                  ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                                  : "bg-[#003366]/5 text-[#003366] hover:bg-[#003366]/10"
                                              )}
                                           >
                                              {isExpanded ? "Ocultar Meta" : "Ver Meta"}
                                           </button>
                                         )}
                                      </div>
                                   </td>
                                   <td className="px-8 py-6">
                                      <div className="flex items-center gap-3">
                                         <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                                            <UserIcon className="w-3.5 h-3.5" />
                                         </div>
                                         <div>
                                            <p className="text-[10px] font-bold text-slate-600">{log.user?.fullName || log.actorEmail || 'Anónimo'}</p>
                                            <p className="text-[9px] text-slate-400 font-medium">{log.ip || '0.0.0.0'}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-8 py-6">
                                      <div className="flex items-center gap-2 text-slate-400">
                                         <Clock className="w-3.5 h-3.5" />
                                         <span className="text-[10px] font-bold">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                      </div>
                                   </td>
                                </tr>
                                {hasMetadata && isExpanded && (
                                  <tr>
                                    <td colSpan={4} className="bg-slate-50/50 px-8 py-4 border-b border-slate-100">
                                      <motion.div 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <pre className="bg-slate-900 text-slate-300 p-5 rounded-[1.5rem] text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-[300px] shadow-inner border border-white/5 custom-scrollbar">
                                          {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                      </motion.div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AdminLogsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    }>
      <AdminLogsContent />
    </Suspense>
  );
}
