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
  Calendar,
  Loader2,
  FileCheck,
  XCircle,
  GraduationCap,
  ClipboardCheck,
  MapPin,
  User,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
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

export default function TutorEstudiantesPage() {
  const { t } = useLanguage();
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const res: any = await internshipsService.findByTutor(user.id);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
      setInternships(list);
    } catch (error: any) {
      console.error("Error cargando estudiantes del tutor:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = internships.filter((i) =>
    i.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-[1600px] mx-auto pb-20">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block animate-in fade-in slide-in-from-left-4 duration-700">
              {t.tutor.portal}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">
              {t.tutor.dashboard.list.title.split(" ")[0]} <span className="text-slate-400">{t.tutor.dashboard.list.title.split(" ").slice(1).join(" ")}</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              {t.tutor.dashboard.list.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
              <input
                type="text"
                placeholder={t.tutor.dashboard.list.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3 md:py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-[350px] outline-none focus:ring-4 focus:ring-[#003366]/5 focus:border-[#003366] transition-all font-medium text-sm shadow-sm"
              />
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.common.loading}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {searchTerm ? t.tutor.dashboard.list.noResults : t.tutor.dashboard.list.noInterns}
            </h3>
            <p className="text-slate-400 text-sm">
              {searchTerm ? t.tutor.dashboard.list.adjustSearch : t.tutor.dashboard.list.noInternsDesc}
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
      </div>
    </DashboardLayout>
  );
}

function InternshipCard({ internship }: { internship: any }) {
  const { t } = useLanguage();
  const docs: any[] = internship.documents ?? [];

  const pendingReview = docs.filter((d) => d.status === "EN_REVISION_TUTOR").length;
  const incumplidos = docs.filter((d) => d.status === "INCUMPLIDO").length;
  const approved = docs.filter((d) => d.status === "APROBADO_DEFINITIVO").length;
  const withoutDates = docs.filter((d) => !d.startDate && d.status === "PENDIENTE").length;

  const lastVisit = internship.monitoringVisits?.[0];
  const daysSinceLastVisit = lastVisit 
    ? (Date.now() - new Date(lastVisit.date).getTime()) / 86400000 
    : 999;
  const visitRequired = daysSinceLastVisit > 30;

  const soon = docs.filter((d) => {
    if (!d.dueDate || d.status !== "PENDIENTE" || d.filePath) return false;
    const diff = (new Date(d.dueDate).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 3;
  }).length;

  return (
    <div className={cn(
      "bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden shadow-sm hover:shadow-md",
      incumplidos > 0 ? "border-red-200" : pendingReview > 0 ? "border-amber-200" : "border-slate-200"
    )}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar + info */}
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className={cn(
              "w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-[1.75rem] flex items-center justify-center text-xl font-black flex-shrink-0 transition-all",
              incumplidos > 0 ? "bg-red-50 text-red-600" : pendingReview > 0 ? "bg-amber-50 text-amber-700" : "bg-[#003366]/5 text-[#003366]"
            )}>
              {internship.student.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-xl font-black text-[#003366] truncate">{internship.student.fullName}</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Building2 className="w-3.5 h-3.5" />
                  {internship.company.name}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Calendar className="w-3.5 h-3.5" />
                  {t.tutor.dashboard.card.start}: {new Date(internship.startDate).toLocaleDateString()}
                </span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  internship.status === "Finalizado" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                )}>
                  {internship.status}
                </span>
              </div>
            </div>
          </div>

          {/* Document badges */}
          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            {visitRequired && (
              <Badge icon={<MapPin className="w-3.5 h-3.5" />} label={t.tutor.dashboard.card.visitRequired} color="bg-violet-50 text-violet-700 border-violet-100" />
            )}
            {withoutDates > 0 && (
              <Badge icon={<Clock className="w-3.5 h-3.5" />} label={t.tutor.dashboard.card.noDate.replace("{count}", String(withoutDates))} color="bg-slate-100 text-slate-500" />
            )}
            {soon > 0 && (
              <Badge icon={<AlertTriangle className="w-3.5 h-3.5" />} label={t.tutor.dashboard.card.soon.replace("{count}", String(soon))} color="bg-orange-50 text-orange-600 animate-pulse border-orange-100" />
            )}
            {pendingReview > 0 && (
              <Badge icon={<FileCheck className="w-3.5 h-3.5" />} label={t.tutor.dashboard.card.toReview.replace("{count}", String(pendingReview))} color="bg-amber-50 text-amber-700 animate-pulse border-amber-100" />
            )}
            {incumplidos > 0 && (
              <Badge icon={<XCircle className="w-3.5 h-3.5" />} label={t.tutor.dashboard.card.incumplido.replace("{count}", String(incumplidos))} color="bg-red-50 text-red-700 animate-pulse border-red-100" />
            )}
            
            <div className="flex items-center gap-2 ml-2">
              <Link
                href={`/dashboard/documentos/${internship.id}`}
                className="flex items-center gap-2 px-5 py-3 bg-[#003366] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#004488] transition-all shadow-lg shadow-blue-900/10 active:scale-95"
              >
                <ClipboardCheck className="w-4 h-4" />
                {t.tutor.dashboard.card.manage}
                <ChevronRight className="w-3 h-3" />
              </Link>
              <Link
                href={`/tutor-academico/estudiantes/${internship.id}`}
                className="flex items-center gap-2 px-5 py-3 bg-[#C5A059] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#b08940] transition-all shadow-lg shadow-amber-900/10 active:scale-95"
              >
                <User className="w-4 h-4" />
                {t.tutor.dashboard.card.file}
              </Link>
            </div>
          </div>
        </div>

        {/* Mini doc strip */}
        {docs.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-4 md:grid-cols-8 gap-3">
            {docs.map((doc: any) => (
              <div
                key={doc.id}
                title={`${doc.name}: ${t.tutor.documentStatus[doc.status] || doc.status}`}
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  doc.status === "APROBADO_DEFINITIVO" ? "bg-emerald-500 shadow-sm shadow-emerald-500/20" :
                  doc.status === "APROBADO_TUTOR" ? "bg-amber-400 shadow-sm shadow-amber-400/20" :
                  doc.status === "EN_REVISION_TUTOR" ? "bg-blue-400 shadow-sm shadow-blue-400/20" :
                  doc.status === "INCUMPLIDO" ? "bg-red-500 animate-pulse shadow-sm shadow-red-500/20" :
                  doc.status === "RECHAZADO_TUTOR" ? "bg-rose-400 shadow-sm shadow-rose-400/20" :
                  "bg-slate-200"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border", color)}>
      {icon}
      {label}
    </div>
  );
}
