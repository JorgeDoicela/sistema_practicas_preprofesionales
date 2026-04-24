"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  CalendarCheck,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowRightCircle,
  ArrowLeftCircle,
  MapPin,
  TrendingUp,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";
import { attendancesService } from "@/services/attendances.service";
import { useLanguage } from "@/providers/LanguageProvider";

interface RowState {
  internshipId: string;
  studentName: string;
  status: string;
  totalHours: number;
  summary: any | null;
  history: any[];
  loadingDetail: boolean;
}

export default function EmpresaAsistenciaPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadBase = useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      if (!user.companyId) { setLoading(false); return; }

      const res: any = await internshipsService.findByCompany(user.companyId);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);

      setRows(
        list.map((i: any) => ({
          internshipId: i.id,
          studentName: i.student?.fullName ?? "—",
          status: i.status ?? "—",
          totalHours: i.totalHours ?? 0,
          summary: null,
          history: [],
          loadingDetail: false,
        })),
      );
    } catch (error) {
      console.error("Error cargando pasantes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBase(); }, [loadBase]);

  const loadDetail = useCallback(async (internshipId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.internshipId === internshipId ? { ...r, loadingDetail: true } : r)),
    );
    try {
      const [sumRes, histRes]: [any, any] = await Promise.all([
        attendancesService.getSummary(internshipId),
        attendancesService.findByInternship(internshipId),
      ]);

      const summary = sumRes?.data || sumRes || null;
      const history = Array.isArray(histRes) ? histRes : (Array.isArray(histRes?.data) ? histRes.data : []);

      setRows((prev) =>
        prev.map((r) =>
          r.internshipId === internshipId
            ? { ...r, summary, history: history as any[], loadingDetail: false }
            : r,
        ),
      );
    } catch {
      setRows((prev) =>
        prev.map((r) =>
          r.internshipId === internshipId ? { ...r, loadingDetail: false } : r,
        ),
      );
    }
  }, []);

  const handleToggle = (internshipId: string) => {
    if (expandedId === internshipId) { setExpandedId(null); return; }
    setExpandedId(internshipId);
    const row = rows.find((r) => r.internshipId === internshipId);
    if (row && !row.summary && !row.loadingDetail) loadDetail(internshipId);
  };

  const filtered = rows.filter((r) =>
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalAccum = rows.reduce((acc, r) => acc + (r.summary?.totalHours ?? 0), 0);
  const activeCount = rows.filter((r) => r.status !== "Finalizado").length;

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-[1300px] mx-auto pb-20">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
              {t.asistencia.company.portal}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">
              {t.asistencia.title} <span className="text-slate-400">{t.asistencia.company.interns}</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              {t.asistencia.company.desc}
            </p>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
            <input
              type="text"
              placeholder={t.common.search + "..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-[280px] outline-none focus:ring-4 focus:ring-[#003366]/5 focus:border-[#003366] transition-all font-medium text-sm shadow-sm"
            />
          </div>
        </section>

        {/* KPIs */}
        {!loading && rows.length > 0 && (
          <section className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: <TrendingUp className="w-6 h-6" />, title: t.asistencia.company.activeInterns, value: activeCount, color: "bg-blue-500" },
              { icon: <Clock className="w-6 h-6" />, title: t.asistencia.company.accumulatedHours, value: `${totalAccum.toFixed(0)}h`, color: "bg-emerald-500" },
              { icon: <CheckCircle2 className="w-6 h-6" />, title: t.asistencia.company.totalInterns, value: rows.length, color: "bg-amber-500" },
            ].map((kpi) => (
              <motion.div key={kpi.title} whileHover={{ y: -4 }} className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl">
                <div className={cn("p-4 rounded-2xl inline-flex mb-6", kpi.color.replace("bg-", "bg-") + "/10")}>
                  {React.cloneElement(kpi.icon as React.ReactElement<{ className?: string }>, { className: `w-6 h-6 ${kpi.color.replace("bg-", "text-")}` })}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.title}</p>
                <h4 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tighter break-words">{kpi.value}</h4>
              </motion.div>
            ))}
          </section>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t.asistencia.company.loadingInterns}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 text-center">
            <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">
              {searchTerm ? t.asistencia.company.noResults : t.asistencia.company.noInterns}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((row, idx) => (
              <motion.div
                key={row.internshipId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => handleToggle(row.internshipId)}
                  className="w-full p-7 flex flex-col md:flex-row md:items-center gap-5 text-left hover:bg-slate-50/50 transition-colors"
                >
                  <div className="w-14 h-14 rounded-[1.5rem] bg-[#003366]/5 flex items-center justify-center text-xl font-black text-[#003366] shrink-0">
                    {row.studentName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-[#003366] truncate">{row.studentName}</h3>
                    <div className="flex flex-wrap gap-4 mt-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                        row.status === "Finalizado" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                      )}>
                        {row.status}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {row.totalHours}h {t.asistencia.company.planned}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {row.summary ? (
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {row.summary.totalHours}h / {row.summary.requiredHours}h
                        </p>
                        <div className="w-28 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-[#003366] rounded-full transition-all"
                            style={{ width: `${row.summary.progressPercentage}%` }}
                          />
                        </div>
                        <p className="text-[9px] font-black text-[#C5A059] mt-0.5">
                          {row.summary.progressPercentage}% {t.asistencia.company.completed}
                        </p>
                      </div>
                    ) : row.loadingDetail ? (
                      <Loader2 className="w-4 h-4 text-[#003366] animate-spin" />
                    ) : null}
                    {expandedId === row.internshipId
                      ? <ChevronUp className="w-4 h-4 text-slate-400" />
                      : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedId === row.internshipId && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <div className="p-7">
                        {row.loadingDetail ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 text-[#003366] animate-spin" />
                          </div>
                        ) : (
                          <>
                            {row.summary && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                {[
                                  { label: t.asistencia.stats.hours, value: `${row.summary.totalHours}h` },
                                  { label: t.asistencia.stats.progress, value: `${row.summary.requiredHours}h` },
                                  { label: t.asistencia.stats.records, value: String(row.summary.totalRecords) },
                                  { label: t.asistencia.stats.pending, value: `${row.summary.remainingHours}h` },
                                ].map((kpi) => (
                                  <div key={kpi.label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{kpi.label}</p>
                                    <p className="text-xl font-black text-[#003366]">{kpi.value}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {row.history.length === 0 ? (
                              <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-300 py-8">
                                {t.asistencia.history.noRecords}
                              </p>
                            ) : (
                              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">{t.common.date}</th>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">{t.asistencia.actions.markIn}</th>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">{t.asistencia.actions.markOut}</th>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">{t.asistencia.actions.gps}</th>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">{t.asistencia.actions.photo}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {row.history.slice(0, 10).map((h: any) => (
                                      <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3 font-bold text-[#003366]">
                                          {new Date(h.checkIn).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                                        </td>
                                        <td className="px-5 py-3">
                                          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                            <ArrowRightCircle className="w-3.5 h-3.5" />
                                            {new Date(h.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                          </div>
                                        </td>
                                        <td className="px-5 py-3">
                                          {h.checkOut ? (
                                            <div className="flex items-center gap-1.5 text-rose-500 font-bold">
                                              <ArrowLeftCircle className="w-3.5 h-3.5" />
                                              {new Date(h.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                          ) : (
                                            <span className="text-amber-500 font-black text-[9px] uppercase">{t.common.pending}</span>
                                          )}
                                        </td>
                                        <td className="px-5 py-3">
                                          <div className="flex items-center gap-1 text-slate-400 font-bold">
                                            <MapPin className="w-3 h-3" />
                                            {h.distanceKm ? `${(h.distanceKm * 1000).toFixed(0)}m` : "N/A"}
                                          </div>
                                        </td>
                                        <td className="px-5 py-3">
                                          <div className="flex items-center gap-2">
                                            {h.checkInPhoto && (
                                              <a href={h.checkInPhoto} target="_blank" className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black hover:bg-emerald-100 transition-colors">
                                                <Camera className="w-3 h-3" />
                                                {t.asistencia.actions.markIn}
                                              </a>
                                            )}
                                            {h.checkOutPhoto && (
                                              <a href={h.checkOutPhoto} target="_blank" className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded-lg text-[9px] font-black hover:bg-rose-100 transition-colors">
                                                <Camera className="w-3 h-3" />
                                                {t.asistencia.actions.markOut}
                                              </a>
                                            )}
                                            {!h.checkInPhoto && !h.checkOutPhoto && (
                                              <span className="text-slate-300 text-[9px]">—</span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {row.history.length > 10 && (
                                  <p className="text-center text-[9px] font-black uppercase tracking-widest text-slate-300 py-3 border-t border-slate-100">
                                    Mostrando últimos 10 registros
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
