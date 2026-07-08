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
  FileCheck,
  XCircle,
  GraduationCap,
  ClipboardCheck,
  MapPin,
  User,
} from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const DOC_STATUS_COLOR: Record<string, string> = {
  PENDIENTE: "text-slate-500 dark:text-slate-400",
  EN_REVISION_TUTOR: "text-blue-700 dark:text-blue-400",
  APROBADO_TUTOR: "text-amber-700 dark:text-amber-400",
  RECHAZADO_TUTOR: "text-rose-700 dark:text-rose-400",
  APROBADO_DEFINITIVO: "text-emerald-700 dark:text-emerald-400",
  RECHAZADO_COORDINADOR: "text-orange-700 dark:text-orange-400",
  INCUMPLIDO: "text-red-700 dark:text-red-400",
};

export default function TutorAcademicoDashboardPage() {
  const { t } = useLanguage();
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tutorName, setTutorName] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      setTutorName(user.fullName || "");
      const res: any = await internshipsService.findByTutor(user.id);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
      setInternships(list);
    } catch (err: any) {
      console.error("Error cargando datos del tutor:", err);
      setError(err?.response?.data?.message || err?.message || t.common.errors.generic);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, [loadData]);

  const safeInternships = Array.isArray(internships) ? internships : [];

  const filtered = safeInternships.filter((i) =>
    i.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // KPIs derivados
  const activeCount = safeInternships.filter((i) => i.status === "En Proceso").length;

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

  // Datos para gráfico de distribución de documentos
  const docDistribution = internships.reduce((acc: any, i) => {
    (i.documents || []).forEach((d: any) => {
      const label = (t.tutor.documentStatus as any)[d.status] || d.status;
      acc[label] = (acc[label] || 0) + 1;
    });
    return acc;
  }, {});

  const chartData = Object.entries(docDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ["#94A3B8", "#3B82F6", "#F59E0B", "#F43F5E", "#10B981", "#F97316", "#EF4444"];

  return (
    <DashboardLayout>
      <div className="space-y-8 md:space-y-12 max-w-[1600px] mx-auto pb-20">

        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
              {t.tutor.dashboard.portal}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] dark:text-white tracking-tight">
              {t.tutor.dashboard.welcome}{" "}
              <span className="text-slate-400">{tutorName.split(" ")[0] || t.dashboard.defaultUser}</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
              {t.tutor.dashboard.description}
            </p>
          </div>
        </section>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] p-5 flex items-center gap-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30"
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm font-bold text-red-800 dark:text-red-300 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 transition-colors text-xs font-black uppercase"
            >
              ✕
            </button>
          </motion.div>
        )}

        {/* KPIs and Chart Section */}
        <section className="grid lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6" data-tour="tutor-dashboard-kpis">
            <KpiCard
              title={t.tutor.dashboard.kpi.activeInterns}
              value={activeCount}
              icon={<Users className="w-6 h-6" />}
              color="text-blue-600 dark:text-blue-400"
            />
            <KpiCard
              title={t.tutor.dashboard.kpi.pendingReviews}
              value={pendingReviews}
              icon={<FileCheck className="w-6 h-6" />}
              color="text-amber-600 dark:text-amber-400"
              alert={pendingReviews > 0}
            />
            <KpiCard
              title={t.tutor.dashboard.kpi.approvedTutor}
              value={approvedCount}
              icon={<CheckCircle2 className="w-6 h-6" />}
              color="text-emerald-600 dark:text-emerald-400"
            />
            <KpiCard
              title={t.tutor.dashboard.kpi.visitsPerformed}
              value={internships.reduce((acc, i) => acc + (i.monitoringVisits?.length || 0), 0)}
              icon={<MapPin className="w-6 h-6" />}
              color="text-violet-600 dark:text-violet-400"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col min-w-0" data-tour="tutor-dashboard-chart">
            <h3 className="text-lg font-black text-[#003366] dark:text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C5A059]" />
              {t.tutor.dashboard.charts.docsGlobal}
            </h3>
            <div className="flex-1 flex flex-col justify-between w-full min-h-[300px]">
              {loading ? (
                <div className="w-full h-full bg-slate-50 dark:bg-slate-800 animate-pulse rounded-2xl flex-1" />
              ) : chartData.length > 0 && isMounted ? (
                <>
                  <div className="w-full h-[180px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', color: 'var(--foreground)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}
                          itemStyle={{ color: 'var(--foreground)', fontSize: '12px', fontWeight: 600 }}
                          labelStyle={{ color: 'var(--muted-foreground)', fontSize: '10px', fontWeight: 700 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Custom CSS Grid Legend to prevent overflows and provide exact values */}
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] w-full px-1 border-t border-slate-100 dark:border-slate-800 pt-4">
                    {chartData.map((entry: any, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5 min-w-0" title={`${entry.name}: ${entry.value}`}>
                        <span 
                          className="w-2.5 h-2.5 rounded-sm flex-shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                        />
                        <span className="truncate text-slate-600 dark:text-slate-300 font-bold">
                          {entry.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-auto flex-shrink-0">
                          ({entry.value})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : chartData.length === 0 && !loading ? (
                <div className="flex items-center justify-center flex-1 text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-widest">
                  {t.tutor.dashboard.charts.noData}
                </div>
              ) : (
                <div className="w-full h-full bg-slate-50 dark:bg-slate-800 animate-pulse rounded-2xl flex-1" />
              )}
            </div>
          </div>
        </section>

        {/* Banner de alerta */}
        {(pendingReviews > 0 || incumplidosCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-[2rem] p-6 flex items-center gap-5 border",
              incumplidosCount > 0
                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30"
                : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
              incumplidosCount > 0 ? "bg-red-100 dark:bg-red-900/40" : "bg-amber-100 dark:bg-amber-900/40"
            )}>
              <AlertTriangle className={cn("w-6 h-6", incumplidosCount > 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")} />
            </div>
            <div>
              <p className={cn("font-black text-sm", incumplidosCount > 0 ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300")}>
                {incumplidosCount > 0
                  ? t.tutor.dashboard.alerts.incumplido.replace("{count}", String(incumplidosCount))
                  : t.tutor.dashboard.alerts.pending.replace("{count}", String(pendingReviews))}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {t.tutor.dashboard.alerts.action}
              </p>
            </div>
          </motion.div>
        )}

        {/* Lista de pasantes */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-[#003366] dark:text-white">{t.tutor.dashboard.list.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                {t.tutor.dashboard.list.subtitle}
              </p>
            </div>
            <div className="relative group" data-tour="tutor-dashboard-search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-[#003366] dark:group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder={t.tutor.dashboard.list.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full md:w-[320px] outline-none focus:ring-4 focus:ring-[#003366]/5 dark:focus:ring-blue-500/10 focus:border-[#003366] dark:focus:border-blue-500 transition-all font-medium text-sm shadow-sm text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-7 animate-pulse">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center gap-5 flex-1">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-[1.5rem]" />
                      <div className="space-y-3 flex-1">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-48" />
                        <div className="flex gap-4">
                          <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded-full w-24" />
                          <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded-full w-24" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-24 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                      <div className="w-24 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                {searchTerm ? t.tutor.dashboard.list.noResults : t.tutor.dashboard.list.noInterns}
              </h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                {searchTerm ? t.tutor.dashboard.list.adjustSearch : t.tutor.dashboard.list.noInternsDesc}
              </p>
            </div>
          ) : (
            <div className="grid gap-6" data-tour="tutor-dashboard-list">
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
  title, value, icon, color, alert
}: {
  title: string; value: number; icon: React.ReactElement; color: string; alert?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className={cn(
        "bg-white dark:bg-slate-900 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border shadow-xl relative overflow-hidden",
        alert && value > 0 ? "border-red-200 dark:border-red-900/40" : "border-slate-100 dark:border-slate-800"
      )}
    >
      {alert && value > 0 && (
        <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
      )}
      <div className={cn("inline-flex mb-8", color)}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-8 h-8" })}
      </div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <h4 className={cn("text-2xl md:text-3xl font-black tracking-tighter break-words", alert && value > 0 ? "text-red-600 dark:text-red-400" : "text-[#003366] dark:text-white")}>
        {value}
      </h4>
    </motion.div>
  );
}

function InternshipCard({ internship }: { internship: any }) {
  const { t } = useLanguage();
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
      "bg-white dark:bg-slate-900 rounded-[2rem] border shadow-sm hover:shadow-md transition-all overflow-hidden",
      incumplidos > 0 
        ? "border-red-200 dark:border-red-900/40" 
        : pendingReview > 0 
          ? "border-amber-200 dark:border-amber-900/40" 
          : "border-slate-200 dark:border-slate-800"
    )}>
      <div className="p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

          {/* Avatar + info */}
          <div className="flex items-center gap-5 min-w-0">
            <div className={cn(
              "w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black flex-shrink-0",
              incumplidos > 0 
                ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400" 
                : pendingReview > 0 
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" 
                  : "bg-[#003366]/5 dark:bg-slate-800 text-[#003366] dark:text-slate-200"
            )}>
              {internship.student?.fullName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-black text-[#003366] dark:text-white truncate">
                {internship.student?.fullName || t.dashboard.defaultUser}
              </h3>
              <div className="flex flex-wrap gap-4 mt-1">
                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <Building2 className="w-3 h-3" />
                  {internship.company?.name || "N/A"}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <Calendar className="w-3 h-3" />
                  {t.tutor.dashboard.card.start}: {internship.startDate ? new Date(internship.startDate).toLocaleDateString() : "N/A"}
                </span>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  internship.status === "Finalizado" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                )}>
                  {internship.status}
                </span>
              </div>
            </div>
          </div>

          {/* Badges and Actions Wrapper to avoid layout issues on smaller screens */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:justify-end flex-shrink-0">
            {/* Document badges */}
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              {visitRequired && (
                <Badge icon={<MapPin className="w-3.5 h-3.5" />} label={t.tutor.dashboard.card.visitRequired} color="text-violet-700 dark:text-violet-400" />
              )}
              {withoutDates > 0 && (
                <Badge icon={<Clock className="w-3.5 h-3.5" />} label={t.tutor.dashboard.card.noDate.replace("{count}", String(withoutDates))} color="text-slate-500 dark:text-slate-400" />
              )}
              {soon > 0 && (
                <Badge icon={<AlertTriangle className="w-3.5 h-3.5" />} label={t.tutor.dashboard.card.soon.replace("{count}", String(soon))} color="text-orange-600 dark:text-orange-400 animate-pulse" />
              )}
              {pendingReview > 0 && (
                <Badge icon={<FileCheck className="w-3.5 h-3.5" />} label={t.tutor.dashboard.card.toReview.replace("{count}", String(pendingReview))} color="text-amber-700 dark:text-amber-400 animate-pulse" />
              )}
              {incumplidos > 0 && (
                <Badge icon={<XCircle className="w-3.5 h-3.5" />} label={t.tutor.dashboard.card.incumplido.replace("{count}", String(incumplidos))} color="text-red-700 dark:text-red-400 animate-pulse" />
              )}
              {approved > 0 && (
                <Badge icon={<CheckCircle2 className="w-3.5 h-3.5" />} label={t.tutor.dashboard.card.approved.replace("{count}", String(approved)).replace("{total}", String(docs.length))} color="text-emerald-700 dark:text-emerald-400" />
              )}
            </div>

            {/* Actions Links */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/dashboard/documentos/${internship.id}`}
                className="flex items-center gap-2 px-5 py-3 bg-[#003366] dark:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#004488] dark:hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/10 active:scale-95"
              >
                <ClipboardCheck className="w-4 h-4" />
                {t.tutor.dashboard.card.manage}
                <ChevronRight className="w-3 h-3" />
              </Link>
              <Link
                href={`/tutor-academico/estudiantes/${internship.id}`}
                className="flex items-center gap-2 px-5 py-3 bg-[#C5A059] dark:bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#b08940] dark:hover:bg-amber-500 transition-all shadow-lg shadow-amber-900/10 active:scale-95"
              >
                <User className="w-4 h-4" />
                {t.tutor.dashboard.card.file}
              </Link>
            </div>
          </div>
        </div>

        {/* Mini doc strip */}
        {docs.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 md:grid-cols-8 gap-2">
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
                  "bg-slate-200 dark:bg-slate-700"
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
                      ? "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30"
                      : "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {doc.status === "INCUMPLIDO" ? (
                      <XCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    )}
                    <span className={cn(
                      "font-bold",
                      doc.status === "INCUMPLIDO" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"
                    )}>
                      {doc.name}
                    </span>
                  </div>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest",
                    DOC_STATUS_COLOR[doc.status] ?? "text-slate-500 dark:text-slate-400"
                  )}>
                    {(t.tutor.documentStatus as any)[doc.status] ?? doc.status}
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
    <div className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest", color)}>
      {icon}
      {label}
    </div>
  );
}
