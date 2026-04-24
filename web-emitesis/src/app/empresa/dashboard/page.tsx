"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Users,
  Search,
  Building2,
  Clock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ToggleLeft,
  ToggleRight,
  Loader2,
  GraduationCap,
  Calendar,
  Award,
  FlaskConical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";
import Link from "next/link";
import { LivePresenceWidget } from "@/components/dashboard/LivePresenceWidget";
import { useLanguage } from "@/providers/LanguageProvider";

export default function EmpresaDashboardPage() {
  const { t } = useLanguage();
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      setCompanyName(user.fullName || "");
      setUserRole(user.role || "");

      if (!user.companyId) {
        setLoading(false);
        return;
      }

      const res: any = await internshipsService.findByCompany(user.companyId);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
      setInternships(list);
    } catch (error) {
      console.error("Error cargando datos empresa:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleTest = async (internshipId: string) => {
    setTogglingId(internshipId);
    try {
      const updated = await internshipsService.toggleTest(internshipId);
      setInternships((prev) =>
        prev.map((i) => (i.id === internshipId ? { ...i, testEnabled: updated.testEnabled } : i))
      );
    } catch (error: any) {
      alert(error.message || t.common.error.generic);
    } finally {
      setTogglingId(null);
    }
  };

  const safeInternships = Array.isArray(internships) ? internships : [];

  const filtered = safeInternships.filter((i) =>
    i.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = safeInternships.filter((i) => i.status === "En Proceso" || i.status === "Activo").length;
  const testEnabledCount = safeInternships.filter((i) => i.testEnabled).length;
  const evaluatedCount = safeInternships.filter((i) => i.evaluation).length;
  const totalHours = internships.reduce((acc, i) => {
    const worked = i.attendances?.length ? i.attendances.reduce((s: number, a: any) => {
      if (!a.checkOut) return s;
      const diff = (new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 3600000;
      return s + diff;
    }, 0) : 0;
    return acc + worked;
  }, 0);

  return (
    <DashboardLayout>
      <div className="space-y-12 max-w-[1600px] mx-auto pb-20">

        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
              {userRole === "TUTOR_EMPRESARIAL" ? t.empresa.dashboard.portalTutor : t.empresa.dashboard.portalCompany}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">
              {t.empresa.dashboard.welcome}{" "}
              <span className="text-slate-400">{companyName.split(" ")[0] || "User"}</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              {userRole === "TUTOR_EMPRESARIAL" 
                ? t.empresa.dashboard.descTutor
                : t.empresa.dashboard.descCompany}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <div className="px-4 py-2 bg-emerald-50 rounded-xl">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                RF-06 · RF-07
              </span>
            </div>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title={t.empresa.dashboard.kpi.active} value={activeCount} icon={<Users className="w-6 h-6" />} color="bg-blue-500" />
          <KpiCard title={t.empresa.dashboard.kpi.hours} value={`${totalHours.toFixed(0)}h`} icon={<Clock className="w-6 h-6" />} color="bg-amber-500" />
          <KpiCard title={t.empresa.dashboard.kpi.tests} value={testEnabledCount} icon={<FlaskConical className="w-6 h-6" />} color="bg-violet-500" />
          <KpiCard title={t.empresa.dashboard.kpi.evaluated} value={evaluatedCount} icon={<Award className="w-6 h-6" />} color="bg-emerald-500" />
        </section>

        {/* Monitor Seccional */}
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-[#003366]">{t.empresa.dashboard.list.title}</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  {t.empresa.dashboard.list.desc}
                </p>
              </div>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                <input
                  type="text"
                  placeholder={t.empresa.dashboard.list.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-[250px] outline-none focus:ring-4 focus:ring-[#003366]/5 focus:border-[#003366] transition-all font-medium text-sm shadow-sm"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t.empresa.dashboard.list.loading}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-dashed border-slate-200 p-10 sm:p-16 md:p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {searchTerm ? t.empresa.dashboard.list.noResults : t.empresa.dashboard.list.noInterns}
                </h3>
                <p className="text-slate-400 text-sm">
                  {searchTerm ? t.empresa.dashboard.list.adjustSearch : t.empresa.dashboard.list.assignHint}
                </p>
              </div>
            ) : (
              <div className="grid gap-5">
                <AnimatePresence mode="popLayout">
                  {filtered.map((internship, idx) => (
                    <motion.div
                      key={internship.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <PasanteCard
                        internship={internship}
                        toggling={togglingId === internship.id}
                        onToggleTest={() => handleToggleTest(internship.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-1">
             <LivePresenceWidget internships={internships} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function KpiCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactElement; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-8">
        <div className={cn("p-4 rounded-2xl bg-opacity-10", color.replace("bg-", "bg-") + "/10")}>
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
            className: `w-6 h-6 ${color.replace("bg-", "text-")}`,
          })}
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tighter break-words">{value}</h4>
    </motion.div>
  );
}

function PasanteCard({
  internship,
  toggling,
  onToggleTest,
}: {
  internship: any;
  toggling: boolean;
  onToggleTest: () => void;
}) {
  const hoursWorked = internship.attendances?.reduce((s: number, a: any) => {
    if (!a.checkOut) return s;
    return s + (new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 3600000;
  }, 0) ?? 0;

  const progress = Math.min(100, (hoursWorked / internship.totalHours) * 100);

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden">
      <div className="p-7 flex flex-col md:flex-row md:items-center gap-6">

        {/* Avatar + info */}
        <div className="flex items-center gap-5 flex-1 min-w-0">
          <div className="w-16 h-16 rounded-[1.5rem] bg-[#003366]/5 flex items-center justify-center text-xl font-black text-[#003366] flex-shrink-0">
            {internship.student.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-[#003366] truncate">{internship.student.fullName}</h3>
            <div className="flex flex-wrap gap-4 mt-1">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Calendar className="w-3 h-3" />
                {t.empresa.card.start}: {new Date(internship.startDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                {hoursWorked.toFixed(0)}h / {internship.totalHours}h
              </span>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                internship.status === "Finalizado" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              )}>
                {(t.tutor.internshipStatus as any)[internship.status] || internship.status}
              </span>
            </div>
            {/* Barra de progreso */}
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden w-48">
              <div
                className="h-full bg-[#003366] rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Estado del test */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {internship.evaluation ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                {t.empresa.card.test.completed}
              </span>
            </div>
          ) : internship.testEnabled ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-100 rounded-xl animate-pulse">
              <ClipboardList className="w-4 h-4 text-violet-600" />
              <span className="text-[10px] font-black text-violet-700 uppercase tracking-widest">
                {t.empresa.card.test.active}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <ClipboardList className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {t.empresa.card.test.inactive}
              </span>
            </div>
          )}

          {/* Toggle test */}
          {!internship.evaluation && (
            <button
              onClick={onToggleTest}
              disabled={toggling}
              title={internship.testEnabled ? t.empresa.card.test.deactivate : t.empresa.card.test.activate}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50",
                internship.testEnabled
                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100"
                  : "bg-[#003366] text-white hover:bg-[#004488] shadow-lg shadow-blue-900/10"
              )}
            >
              {toggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : internship.testEnabled ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              {internship.testEnabled ? t.empresa.card.test.deactivate : t.empresa.card.test.activate}
            </button>
          )}

          {/* Ir a evaluar */}
          {internship.testEnabled && !internship.evaluation && (
            <Link
              href={`/empresa/estudiantes/${internship.id}`}
              className="flex items-center gap-2 px-5 py-3 bg-[#C5A059] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#b08940] transition-all shadow-lg shadow-amber-900/10"
            >
              <Award className="w-4 h-4" />
              {t.empresa.card.test.evaluate}
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}

          {internship.evaluation && (
            <Link
              href={`/empresa/estudiantes/${internship.id}`}
              className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-[#003366] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              <Building2 className="w-4 h-4" />
              {t.empresa.card.test.details}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
