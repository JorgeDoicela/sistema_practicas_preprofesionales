"use client";

import React, { useState, useEffect } from "react";
import {
  ScrollText,
  Search,
  Filter,
  AlertTriangle,
  Info,
  ShieldAlert,
  Terminal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity,
  Globe,
  User,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { systemLogsService, SystemLog, PaginatedLogs } from "@/services/system-logs.service";
import { toast } from "sonner";

export function AuditLogsView() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const result = await systemLogsService.getLogs(page, 20, {
        level: filterLevel || undefined,
        category: filterCategory || undefined,
      });
      setLogs(result.data);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      toast.error("Error al cargar logs de auditoría");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, filterLevel, filterCategory]);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR":
        return <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[9px] font-black border border-rose-100">ERROR</span>;
      case "WARN":
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black border border-amber-100">WARN</span>;
      default:
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black border border-blue-100 italic">INFO</span>;
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "AUTH": return <ShieldAlert className="w-3.5 h-3.5" />;
      case "HTTP": return <Globe className="w-3.5 h-3.5" />;
      case "SYSTEM": return <Terminal className="w-3.5 h-3.5" />;
      default: return <Activity className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.4em] mb-2 block">
            Seguridad Institucional
          </span>
          <h2 className="text-4xl font-black text-brand-blue tracking-tight">
            Auditoría de <span className="text-slate-400">Sistema</span>
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            Registro inmutable de actividades, accesos y transacciones técnicas.
          </p>
        </div>
        <button 
          onClick={() => loadLogs()}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-[10px] font-black uppercase tracking-widest text-slate-600"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl flex flex-col md:flex-row gap-4 border border-white/5">
        <div className="flex-1 flex gap-3">
            <select
              className="bg-slate-800 text-white/80 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-gold/20 cursor-pointer w-full md:w-auto"
              value={filterLevel}
              onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
            >
              <option value="">TODOS LOS NIVELES</option>
              <option value="INFO">INFORMACIÓN</option>
              <option value="WARN">ADVERTENCIAS</option>
              <option value="ERROR">ERRORES</option>
            </select>
            <select
              className="bg-slate-800 text-white/80 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-gold/20 cursor-pointer w-full md:w-auto"
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            >
              <option value="">TODAS LAS CATEGORÍAS</option>
              <option value="AUTH">AUTENTICACIÓN</option>
              <option value="HTTP">TRÁFICO HTTP</option>
              <option value="SYSTEM">SISTEMA</option>
              <option value="PRIVACY">PRIVACIDAD / LOPDP</option>
            </select>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-1 self-center">
            <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Página {page} de {totalPages}</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp (LTS)</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cat.</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mensaje / Evento</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actor / IP</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Duración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-mono text-[11px]">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-8 py-4">
                        <div className="h-4 bg-slate-100 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : (
                  logs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-8 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        {getLevelBadge(log.level)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center w-7 h-7 bg-slate-100 rounded-lg text-slate-400" title={log.category}>
                          {getCategoryIcon(log.category)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-700 font-bold tracking-tight leading-tight">
                          {log.method && <span className="text-brand-gold mr-2">[{log.method}]</span>}
                          {log.message}
                        </p>
                        {log.path && <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-tighter">{log.path}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5 font-bold text-slate-600">
                             <User className="w-3 h-3 text-slate-300" /> {log.actorEmail || "SISTEMA"}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">{log.ip || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {log.durationMs ? (
                          <span className={`font-black ${log.durationMs > 500 ? 'text-amber-500' : 'text-slate-400'}`}>
                            {log.durationMs}ms
                          </span>
                        ) : "—"}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-8 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exhibiendo {logs.length} entradas técnicas</span>
            <div className="flex items-center gap-2">
                <button
                  disabled={page === 1 || loading}
                  onClick={() => setPage(p => p - 1)}
                  className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <div className="flex items-center gap-1 px-4">
                   {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const pNum = i + 1;
                      return (
                        <button
                          key={pNum}
                          onClick={() => setPage(pNum)}
                          className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${page === pNum ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-400 hover:bg-white hover:text-brand-blue'}`}
                        >
                          {pNum}
                        </button>
                      );
                   })}
                </div>
                <button
                  disabled={page === totalPages || loading}
                  onClick={() => setPage(p => p + 1)}
                  className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
