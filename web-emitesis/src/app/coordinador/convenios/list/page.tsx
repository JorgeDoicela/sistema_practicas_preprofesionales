"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Building2, Calendar, CheckCircle2, AlertCircle,
  Clock, Loader2, ExternalLink, ChevronRight, RefreshCw, Users,
} from "lucide-react";
import { agreementsService } from "@/services/agreements.service";
import { Agreement } from "@/types/agreement";
import Link from "next/link";
import { cn } from "@/lib/utils";

const statusColor: Record<string, string> = {
  Activo: "bg-green-50 text-green-700 border-green-100",
  Histórico: "bg-slate-100 text-slate-500 border-slate-200",
  Vencido: "bg-red-50 text-red-600 border-red-100",
};

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ConveniosListPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Todos");

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await agreementsService.findAll();
      const list = Array.isArray(res) ? res : (res?.items || []);
      setAgreements(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filterStatus === "Todos"
    ? agreements
    : agreements.filter(a => a.status === filterStatus);

  const counts = {
    Todos: agreements.length,
    Activo: agreements.filter(a => a.status === "Activo").length,
    Histórico: agreements.filter(a => a.status === "Histórico").length,
    Vencido: agreements.filter(a => a.status === "Vencido").length,
  };

  const expiringSoon = agreements.filter(a => {
    const d = daysUntil(a.endDate);
    return a.status === "Activo" && d !== null && d <= 30 && d > 0;
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#003366]/5 text-[#003366] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#003366]/10">
              <FileText size={12} /> Gestión de Convenios
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight">Convenios Empresariales</h1>
            <p className="text-slate-500 mt-1">Acuerdos vigentes, históricos y vencidos con entidades receptoras.</p>
          </div>
          <div className="flex items-center justify-end gap-3 flex-wrap">
            <button onClick={load} className="p-3 rounded-2xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all">
              <RefreshCw size={16} />
            </button>
            <Link href="/coordinador/convenios"
              data-tour="convenios-new"
              className="flex flex-1 sm:flex-initial min-w-0 items-center justify-center gap-2 bg-[#003366] text-white px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all">
              <Plus size={16} /> Nuevo Convenio
            </Link>
          </div>
        </div>

        {/* Alerta de vencimiento próximo */}
        <AnimatePresence>
          {expiringSoon.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="font-black text-amber-800 text-sm">
                  {expiringSoon.length} convenio{expiringSoon.length > 1 ? "s" : ""} próximo{expiringSoon.length > 1 ? "s" : ""} a vencer
                </p>
                <p className="text-amber-700 text-xs mt-1">
                  {expiringSoon.map(a => `${a.company.name} (${daysUntil(a.endDate)} días)`).join(" · ")}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(counts).map(([status, count]) => (
            <button key={status} onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all",
                filterStatus === status
                  ? "bg-[#003366] text-white border-[#003366]"
                  : "bg-white text-slate-500 border-slate-200 hover:border-[#003366]/30"
              )}>
              {status} <span className="ml-1 opacity-60">({count})</span>
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#003366] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold">No hay convenios en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-4" data-tour="convenios-table">
            {filtered.map(ag => {
              const days = daysUntil(ag.endDate);
              const isExpiringSoon = days !== null && days <= 30 && days > 0 && ag.status === "Activo";
              return (
                <motion.div key={ag.id} layout
                  className={cn(
                    "bg-white rounded-3xl border p-6 hover:shadow-md transition-all",
                    isExpiringSoon ? "border-amber-200 shadow-amber-50" : "border-slate-100"
                  )}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#003366]/5 flex items-center justify-center flex-shrink-0">
                        <Building2 size={22} className="text-[#003366]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-black text-[#003366] text-base">{ag.company.name}</h3>
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", statusColor[ag.status] || "bg-slate-100 text-slate-500 border-slate-200")}>
                            {ag.status}
                          </span>
                          {isExpiringSoon && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                              Vence en {days} días
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">RUC: {ag.company.ruc}{ag.company.city ? ` · ${ag.company.city}` : ""}{ag.company.sector ? ` · ${ag.company.sector}` : ""}</p>

                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar size={12} className="text-[#C5A059]" />
                            <span>Inicio: {new Date(ag.startDate).toLocaleDateString("es-EC")}</span>
                          </div>
                          {ag.endDate && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock size={12} className={isExpiringSoon ? "text-amber-500" : "text-[#C5A059]"} />
                              <span className={isExpiringSoon ? "text-amber-600 font-bold" : ""}>
                                Vence: {new Date(ag.endDate).toLocaleDateString("es-EC")}
                              </span>
                            </div>
                          )}
                          {ag.maxInterns && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Users size={12} className="text-[#C5A059]" />
                              <span>Cupos: {ag.maxInterns}</span>
                            </div>
                          )}
                          {ag.type && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <FileText size={12} className="text-[#C5A059]" />
                              <span>{ag.type}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {ag.filePath && (
                      <a href={ag.filePath} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-[#003366] text-[10px] font-black uppercase tracking-widest hover:bg-[#003366] hover:text-white transition-all border border-slate-200 flex-shrink-0">
                        <ExternalLink size={13} /> Ver PDF
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
