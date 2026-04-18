"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Link from "next/link";
import {
  Users,
  Search,
  Building2,
  Clock,
  CheckCircle2,
  ChevronRight,
  FileText,
  AlertTriangle,
  Calendar,
  Loader2,
  FileCheck,
  XCircle,
  GraduationCap,
  ClipboardCheck,
  MapPin,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";

const DOC_STATUS_COLOR: Record<string, string> = {
  PENDIENTE: "bg-slate-100 text-slate-500",
  EN_REVISION_TUTOR: "bg-blue-100 text-blue-700",
  APROBADO_TUTOR: "bg-amber-100 text-amber-700",
  RECHAZADO_TUTOR: "bg-rose-100 text-rose-700",
  APROBADO_DEFINITIVO: "bg-emerald-100 text-emerald-700",
  RECHAZADO_COORDINADOR: "bg-orange-100 text-orange-700",
  INCUMPLIDO: "bg-red-100 text-red-700",
};

const DOC_STATUS_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_REVISION_TUTOR: "En Revisión",
  APROBADO_TUTOR: "Aprobado por Tutor",
  RECHAZADO_TUTOR: "Rechazado",
  APROBADO_DEFINITIVO: "Aprobado Definitivo",
  RECHAZADO_COORDINADOR: "Rechazado Coordinador",
  INCUMPLIDO: "Incumplido",
};

export default function TutorAcademicoDashboardPage() {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tutorName, setTutorName] = useState("");

  const loadData = useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      setTutorName(user.fullName || "");
      const data = await internshipsService.findByTutor(user.id);
      setInternships(data);
    } catch (error) {
      console.error("Error cargando datos del tutor:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = internships.filter((i) =>
    i.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // KPIs derivados
  const activeCount = internships.filter((i) => i.status === "En Proceso" || i.status === "Activo").length;

  const pendingReviews = internships.reduce((acc, i) => {
    const docs = i.documents ?? [];
    return acc + docs.filter((d: any) => d.status === "EN_REVISION_TUTOR").length;
  }, 0);

  const incumplidosCount = internships.reduce((acc, i) => {
    const docs = i.documents ?? [];
    return acc + docs.filter((d: any) => d.status === "INCUMPLIDO").length;
  }, 0);

  const approvedCount = internships.reduce((acc, i) => {
    const docs = i.documents ?? [];
    return acc + docs.filter((d: any) => d.status === "APROBADO_TUTOR").length;
  }, 0);

  return (
    <DashboardLayout>
      <div className="space-y-12 max-w-[1600px] mx-auto pb-20">

        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
              Portal de Tutor Académico
            </span>
            <h2 className="text-4xl font-black text-[#003366] tracking-tight">
              Bienvenido,{" "}
              <span className="text-slate-400">{tutorName.split(" ")[0] || "Tutor"}</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              RF-08 · RF-09 · RF-11 — Gestión de fechas, revisión documental y alertas de incumplimiento.
            </p>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Pasantes Activos"
            value={activeCount}
            icon={<Users className="w-6 h-6" />}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <KpiCard
            title="Pendientes de Revisión"
            value={pendingReviews}
            icon={<FileCheck className="w-6 h-6" />}
            color="text-amber-600"
            bg="bg-amber-50"
            alert={pendingReviews > 0}
          />
          <KpiCard
            title="Aprobados por Tutor"
            value={approvedCount}
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <KpiCard
            title="Visitas Realizadas"
            value={internships.reduce((acc, i) => acc + (i.monitoringVisits?.length || 0), 0)}
            icon={<MapPin className="w-6 h-6" />}
            color="text-violet-600"
            bg="bg-violet-50"
          />
        </section>

        {/* Banner de alerta */}
        {(pendingReviews > 0 || incumplidosCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-[2rem] p-6 flex items-center gap-5 border",
              incumplidosCount > 0
                ? "bg-red-50 border-red-200"
                : "bg-amber-50 border-amber-200"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
              incumplidosCount > 0 ? "bg-red-100" : "bg-amber-100"
            )}>
              <AlertTriangle className={cn("w-6 h-6", incumplidosCount > 0 ? "text-red-600" : "text-amber-600")} />
            </div>
            <div>
              <p className={cn("font-black text-sm", incumplidosCount > 0 ? "text-red-800" : "text-amber-800")}>
                {incumplidosCount > 0
                  ? `${incumplidosCount} documento(s) marcados como INCUMPLIDO. Se notificó automáticamente al sistema.`
                  : `${pendingReviews} documento(s) esperan tu revisión.`}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Accede al expediente del estudiante para tomar acción.
              </p>
            </div>
          </motion.div>
        )}

        {/* Lista de pasantes */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-[#003366]">Mis Pasantes</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Gestiona fechas límite y revisión de documentos por estudiante.
              </p>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
              <input
                type="text"
                placeholder="Buscar pasante o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-[320px] outline-none focus:ring-4 focus:ring-[#003366]/5 focus:border-[#003366] transition-all font-medium text-sm shadow-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Cargando expedientes...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {searchTerm ? "Sin resultados" : "No tienes pasantes asignados"}
              </h3>
              <p className="text-slate-400 text-sm">
                {searchTerm ? "Ajusta el término de búsqueda." : "El coordinador aún no te ha asignado estudiantes."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              <AnimatePresence mode="popLayout">
                {filtered.map((internship, idx) => (
                  <motion.div
                    key={internship.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <InternshipCard internship={internship} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function KpiCard({
  title, value, icon, color, bg, alert
}: {
  title: string; value: number; icon: React.ReactElement; color: string; bg: string; alert?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className={cn(
        "bg-white p-8 rounded-[2.5rem] border shadow-xl relative overflow-hidden",
        alert && value > 0 ? "border-red-200" : "border-slate-100"
      )}
    >
      {alert && value > 0 && (
        <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
      )}
      <div className={cn("p-4 rounded-2xl inline-flex mb-8", bg)}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-6 h-6 ${color}` })}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className={cn("text-3xl font-black tracking-tighter", alert && value > 0 ? "text-red-600" : "text-[#003366]")}>
        {value}
      </h4>
    </motion.div>
  );
}

function InternshipCard({ internship }: { internship: any }) {
  const docs: any[] = internship.documents ?? [];

  const pendingReview = docs.filter((d) => d.status === "EN_REVISION_TUTOR").length;
  const incumplidos = docs.filter((d) => d.status === "INCUMPLIDO").length;
  const approved = docs.filter((d) => d.status === "APROBADO_DEFINITIVO").length;
  const withoutDates = docs.filter((d) => !d.startDate && d.status === "PENDIENTE").length;

  // Lógica de visitas
  const lastVisit = internship.monitoringVisits?.[0];
  const daysSinceLastVisit = lastVisit 
    ? (Date.now() - new Date(lastVisit.date).getTime()) / 86400000 
    : 999;
  const visitRequired = daysSinceLastVisit > 30;

  // Docs próximos a vencer (en los próximos 3 días)
  const soon = docs.filter((d) => {
    if (!d.dueDate || d.status !== "PENDIENTE" || d.filePath) return false;
    const diff = (new Date(d.dueDate).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 3;
  }).length;

  return (
    <div className={cn(
      "bg-white rounded-[2rem] border shadow-sm hover:shadow-md transition-all overflow-hidden",
      incumplidos > 0 ? "border-red-200" : pendingReview > 0 ? "border-amber-200" : "border-slate-200"
    )}>
      <div className="p-7">
        <div className="flex flex-col md:flex-row md:items-center gap-6">

          {/* Avatar + info */}
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className={cn(
              "w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black flex-shrink-0",
              incumplidos > 0 ? "bg-red-50 text-red-600" : pendingReview > 0 ? "bg-amber-50 text-amber-700" : "bg-[#003366]/5 text-[#003366]"
            )}>
              {internship.student.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-black text-[#003366] truncate">{internship.student.fullName}</h3>
              <div className="flex flex-wrap gap-4 mt-1">
                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Building2 className="w-3 h-3" />
                  {internship.company.name}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Calendar className="w-3 h-3" />
                  Inicio: {new Date(internship.startDate).toLocaleDateString()}
                </span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  internship.status === "Finalizado" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                )}>
                  {internship.status}
                </span>
              </div>
            </div>
          </div>

          {/* Document badges */}
          <div className="flex flex-wrap items-center gap-3">
            {visitRequired && (
              <Badge icon={<MapPin className="w-3.5 h-3.5" />} label="Visita Requerida" color="bg-violet-50 text-violet-700 border-violet-100" />
            )}
            {withoutDates > 0 && (
              <Badge icon={<Clock className="w-3.5 h-3.5" />} label={`${withoutDates} sin fecha`} color="bg-slate-100 text-slate-500" />
            )}
            {soon > 0 && (
              <Badge icon={<AlertTriangle className="w-3.5 h-3.5" />} label={`${soon} próx. a vencer`} color="bg-orange-50 text-orange-600 animate-pulse" />
            )}
            {pendingReview > 0 && (
              <Badge icon={<FileCheck className="w-3.5 h-3.5" />} label={`${pendingReview} por revisar`} color="bg-amber-50 text-amber-700 animate-pulse" />
            )}
            {incumplidos > 0 && (
              <Badge icon={<XCircle className="w-3.5 h-3.5" />} label={`${incumplidos} incumplido`} color="bg-red-50 text-red-700 animate-pulse" />
            )}
            {approved > 0 && (
              <Badge icon={<CheckCircle2 className="w-3.5 h-3.5" />} label={`${approved}/7 aprobados`} color="bg-emerald-50 text-emerald-700" />
            )}

            <Link
              href={`/dashboard/documentos/${internship.id}`}
              className="flex items-center gap-2 px-5 py-3 bg-[#003366] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#004488] transition-all shadow-lg shadow-blue-900/10 active:scale-95"
            >
              <ClipboardCheck className="w-4 h-4" />
              Gestionar
              <ChevronRight className="w-3 h-3" />
            </Link>
            <Link
              href={`/tutor-academico/estudiantes/${internship.id}`}
              className="flex items-center gap-2 px-5 py-3 bg-[#C5A059] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#b08940] transition-all shadow-lg shadow-amber-900/10 active:scale-95"
            >
              <User className="w-4 h-4" />
              Ficha
            </Link>
          </div>
        </div>

        {/* Mini doc strip */}
        {docs.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-4 md:grid-cols-8 gap-2">
            {docs.map((doc: any) => (
              <div
                key={doc.id}
                title={doc.name}
                className={cn(
                  "h-2 rounded-full transition-all",
                  doc.status === "APROBADO_DEFINITIVO" ? "bg-emerald-500" :
                  doc.status === "APROBADO_TUTOR" ? "bg-amber-400" :
                  doc.status === "EN_REVISION_TUTOR" ? "bg-blue-400" :
                  doc.status === "INCUMPLIDO" ? "bg-red-500 animate-pulse" :
                  doc.status === "RECHAZADO_TUTOR" ? "bg-rose-400" :
                  "bg-slate-200"
                )}
              />
            ))}
          </div>
        )}

        {/* Documentos que requieren acción */}
        {(incumplidos > 0 || pendingReview > 0) && (
          <div className="mt-4 space-y-2">
            {docs
              .filter((d: any) => d.status === "INCUMPLIDO" || d.status === "EN_REVISION_TUTOR")
              .map((doc: any) => (
                <div
                  key={doc.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl border text-xs",
                    doc.status === "INCUMPLIDO"
                      ? "bg-red-50 border-red-100"
                      : "bg-amber-50 border-amber-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {doc.status === "INCUMPLIDO" ? (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    )}
                    <span className={cn(
                      "font-bold",
                      doc.status === "INCUMPLIDO" ? "text-red-700" : "text-amber-700"
                    )}>
                      {doc.name}
                    </span>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                    DOC_STATUS_COLOR[doc.status] ?? "bg-slate-100 text-slate-500"
                  )}>
                    {DOC_STATUS_LABEL[doc.status] ?? doc.status}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-transparent", color)}>
      {icon}
      {label}
    </div>
  );
}
