"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileType, 
  Clock, 
  Users, 
  Building2, 
  AlertCircle,
  Loader2,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { reportsService, GlobalStats } from "@/services/reports.service";
import { cn } from "@/lib/utils";

export default function ReportesPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res: any = await reportsService.getGlobalStats();
      const data = res?.data || res || null;
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: "excel" | "pdf") => {
    try {
      setExporting(type);
      if (type === "excel") await reportsService.exportGlobalExcel();
      else await reportsService.exportGlobalPdf();
    } catch (error) {
      alert("Error al exportar el reporte");
    } finally {
      setExporting(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-12 max-w-[1400px] mx-auto pb-20">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">Administración</span>
            <h2 className="text-4xl font-black text-[#003366] tracking-tight">
              Módulo de <span className="text-slate-400">Reportes</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">Indicadores globales y exportación de datos oficiales.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={() => handleExport("excel")}
                disabled={exporting !== null}
                className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm"
             >
                {exporting === "excel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Exportar Excel
             </button>
             <button 
                onClick={() => handleExport("pdf")}
                disabled={exporting !== null}
                className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 text-[#003366] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
             >
                {exporting === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileType className="w-4 h-4" />}
                Generar PDF
             </button>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calculando indicadores...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <ReportStatCard 
                title="Pasantías en Proceso" 
                value={String(stats?.assignmentsCount || 0)} 
                hint="Total de estudiantes activos"
                icon={<Users />}
                color="blue"
              />
              <ReportStatCard 
                title="Revisiones Pendientes" 
                value={String(stats?.pendingDocs || 0)} 
                hint="Documentos esperando validación"
                icon={<BarChart3 />}
                color="rose"
              />
              <ReportStatCard 
                title="Cumplimiento de Horas" 
                value={`${stats?.totalCompletedHours || 0}h`} 
                hint={`De ${stats?.totalPlannedHours || 0}h proyectadas`}
                icon={<Clock />}
                color="amber"
              />
              <ReportStatCard 
                title="Bloqueos y Alertas" 
                value={String(stats?.activeBlocks || 0)} 
                hint="Usuarios bloqueados o inactivos"
                icon={<AlertCircle />}
                color="indigo"
              />
            </section>

            {/* Main Content Areas */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                 <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                       <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight">Resumen Ejecutivo</h3>
                       <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Estado: Operativo</span>
                       </div>
                    </div>
                    <div className="p-10 space-y-8">
                       <div className="space-y-4">
                          <div className="flex justify-between items-end">
                             <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Progreso Global de Horas</span>
                             <span className="text-2xl font-black text-[#003366]">{stats?.progressPercentage}%</span>
                          </div>
                          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${stats?.progressPercentage}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-[#003366] to-[#C5A059]"
                             />
                          </div>
                          <p className="text-[10px] font-medium text-slate-400">Suma total de horas registradas comparado con el total planificado en el sistema.</p>
                       </div>

                       <div className="grid grid-cols-2 gap-8 pt-4">
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Eficiencia Operativa</h4>
                             <p className="text-2xl font-black text-[#003366]">Alta</p>
                             <p className="text-[10px] text-slate-500 mt-2 font-medium">94% de documentos procesados en menos de 48h.</p>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Tasa de Aprobación</h4>
                             <p className="text-2xl font-black text-[#003366]">88%</p>
                             <p className="text-[10px] text-slate-500 mt-2 font-medium">Documentos aprobados en primera revisión.</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-[#003366] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-colors" />
                    <div className="relative z-10 space-y-6">
                       <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                          <Download className="text-[#C5A059]" />
                       </div>
                       <h3 className="text-2xl font-black tracking-tighter leading-tight">Exportar Todo</h3>
                       <p className="text-sm text-white/60 font-medium leading-relaxed">Obtén el listado completo de estudiantes, empresas y estados de cumplimiento consolidado.</p>
                       <div className="space-y-3 pt-4">
                          <button 
                            onClick={() => handleExport("excel")}
                            className="w-full py-4 bg-white text-[#003366] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3"
                          >
                             <FileSpreadsheet className="w-4 h-4" />
                             Formato Excel (.xlsx)
                          </button>
                          <button 
                            onClick={() => handleExport("pdf")}
                            className="w-full py-4 bg-white/10 border border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-3"
                          >
                             <FileType className="w-4 h-4" />
                             Documento PDF (.pdf)
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                          <AlertCircle className="text-white w-5 h-5" />
                       </div>
                       <h4 className="text-sm font-black text-amber-900 uppercase">Alertas Activas</h4>
                    </div>
                    <ul className="space-y-3">
                       <li className="flex items-center gap-3 text-xs text-amber-800 font-bold">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                          {stats?.pendingDocs} revisiones urgentes
                       </li>
                       <li className="flex items-center gap-3 text-xs text-amber-800 font-bold">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                          {stats?.activeBlocks} cuentas con restricciones
                       </li>
                    </ul>
                 </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function ReportStatCard({ title, value, hint, icon, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-500 text-blue-500",
    rose: "bg-rose-500 text-rose-500",
    amber: "bg-amber-500 text-amber-500",
    indigo: "bg-indigo-500 text-indigo-500",
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden group"
    >
      <div className="flex items-start justify-between mb-8">
        <div className={cn("p-4 rounded-2xl bg-opacity-10", colorMap[color].split(" ")[0])}>
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: cn("w-6 h-6", colorMap[color].split(" ")[1]) })}
        </div>
        <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-[#003366] transition-colors">
           <ChevronRight className="w-4 h-4" />
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-3xl font-black text-[#003366] tracking-tighter">{value}</h4>
      <p className="text-[11px] font-semibold text-slate-500 mt-3">{hint}</p>
    </motion.div>
  );
}
