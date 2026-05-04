"use client";

import { useEffect, useState } from "react";
import { privacyService } from "@/services/privacy.service";
import { 
  ShieldCheck, 
  Search, 
  Calendar, 
  User, 
  Globe, 
  Monitor,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface LopdpLog {
  id: string;
  fullName: string;
  email: string;
  ip: string;
  userAgent: string;
  version: string;
  acceptedAt: string;
  user: {
    role: string;
  };
}

export default function LopdpLogsPage() {
  const [logs, setLogs] = useState<LopdpLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await privacyService.getLopdpLogs();
      setLogs(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error fetching LOPDP logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-[#003366] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link 
            href="/admin/privacidad" 
            className="flex items-center gap-2 text-slate-400 hover:text-[#003366] transition-colors text-xs font-black uppercase tracking-widest mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Privacidad
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#003366] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <ShieldCheck className="text-[#C5A059] w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#003366] tracking-tight">Registro de Consentimientos LOPDP</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Auditoría de Aceptación — Ley de Protección de Datos</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, email o IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 text-xs font-semibold focus:ring-2 focus:ring-[#003366]/10 w-full md:w-80 transition-all outline-none"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Aceptaciones</p>
          <p className="text-3xl font-black text-[#003366]">{logs.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Versión Actual</p>
          <p className="text-3xl font-black text-[#C5A059]">2026 (v1.0)</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Última Actividad</p>
          <p className="text-sm font-bold text-[#003366]">
            {logs.length > 0 
              ? format(new Date(logs[0].acceptedAt), "PPP", { locale: es }) 
              : "Sin registros"}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Información Técnica</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha y Versión</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={log.id} 
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#003366] font-black group-hover:scale-110 transition-transform">
                        {log.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#003366]">{log.fullName}</p>
                        <p className="text-[10px] font-bold text-slate-400">{log.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <Globe className="w-3 h-3 text-[#C5A059]" />
                        IP: {log.ip}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 max-w-xs truncate" title={log.userAgent}>
                        <Monitor className="w-3 h-3" />
                        {log.userAgent}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-black text-[#003366] uppercase">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(log.acceptedAt), "d MMM, yyyy HH:mm", { locale: es })}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#C5A059]/10 text-[#C5A059] text-[9px] font-black uppercase">
                        v{log.version}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                      log.user.role === 'ADMIN' ? "bg-purple-100 text-purple-600" :
                      log.user.role === 'COORDINADOR' ? "bg-blue-100 text-blue-600" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {log.user.role}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="p-20 text-center">
            <User className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No se encontraron registros de consentimiento</p>
          </div>
        )}
      </div>

      <footer className="text-center pb-10">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Praxis Hub LOPDP Auditor — v2.0
        </p>
      </footer>
    </div>
  );
}
