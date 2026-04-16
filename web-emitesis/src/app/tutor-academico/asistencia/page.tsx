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
  Building2,
  ChevronDown,
  ChevronUp,
  ArrowRightCircle,
  ArrowLeftCircle,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";
import { attendancesService } from "@/services/attendances.service";

interface StudentAttendance {
  internshipId: string;
  studentName: string;
  companyName: string;
  status: string;
  summary: {
    totalHours: number;
    requiredHours: number;
    progressPercentage: number;
    totalRecords: number;
    remainingHours: number;
  } | null;
  history: any[];
  loadingDetail: boolean;
}

export default function TutorAsistenciaPage() {
  const [rows, setRows] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadBase = useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const internships = await internshipsService.findByTutor(user.id);
      setRows(
        internships.map((i: any) => ({
          internshipId: i.id,
          studentName: i.student?.fullName ?? "—",
          companyName: i.company?.name ?? "—",
          status: i.status ?? "—",
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

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  const loadDetail = useCallback(async (internshipId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.internshipId === internshipId ? { ...r, loadingDetail: true } : r)),
    );
    try {
      const [summary, history] = await Promise.all([
        attendancesService.getSummary(internshipId),
        attendancesService.findByInternship(internshipId),
      ]);
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
    if (expandedId === internshipId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(internshipId);
    const row = rows.find((r) => r.internshipId === internshipId);
    if (row && !row.summary && !row.loadingDetail) {
      loadDetail(internshipId);
    }
  };

  const filtered = rows.filter(
    (r) =>
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.companyName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalHours = rows.reduce((acc, r) => acc + (r.summary?.totalHours ?? 0), 0);
  const avgProgress =
    rows.filter((r) => r.summary).length > 0
      ? Math.round(
          rows
            .filter((r) => r.summary)
            .reduce((acc, r) => acc + (r.summary?.progressPercentage ?? 0), 0) /
            rows.filter((r) => r.summary).length,
        )
      : null;

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-[1300px] mx-auto pb-20">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
              Portal de Tutor Académico
            </span>
            <h2 className="text-4xl font-black text-[#003366] tracking-tight">
              Asistencia <span className="text-slate-400">de Pasantes</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              Monitorea el registro de horas y asistencia de cada estudiante bajo tu tutoría.
            </p>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
            <input
              type="text"
              placeholder="Buscar pasante o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-[300px] outline-none focus:ring-4 focus:ring-[#003366]/5 focus:border-[#003366] transition-all font-medium text-sm shadow-sm"
            />
          </div>
        </section>

        {/* KPIs rápidos */}
        {!loading && rows.length > 0 && (
          <section className="grid sm:grid-cols-3 gap-6">
            <KpiCard
              icon={<Clock className="w-6 h-6" />}
              title="Pasantes activos"
              value={rows.filter((r) => r.status !== "Finalizado").length}
              color="bg-blue-500"
            />
            <KpiCard
              icon={<CheckCircle2 className="w-6 h-6" />}
              title="Horas registradas"
              value={`${totalHours}h`}
              color="bg-emerald-500"
            />
            <KpiCard
              icon={<CalendarCheck className="w-6 h-6" />}
              title="Progreso promedio"
              value={avgProgress !== null ? `${avgProgress}%` : "—"}
              color="bg-amber-500"
            />
          </section>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Cargando pasantes...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 text-center">
            <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">
              {searchTerm ? "Sin resultados" : "No tienes pasantes asignados"}
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
                {/* Fila principal */}
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
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Building2 className="w-3 h-3" />
                        {row.companyName}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                          row.status === "Finalizado"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700",
                        )}
                      >
                        {row.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress mini */}
                  <div className="flex items-center gap-4 shrink-0">
                    {row.summary ? (
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {row.summary.totalHours}h / {row.summary.requiredHours}h
                        </p>
                        <div className="w-32 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-[#003366] rounded-full transition-all"
                            style={{ width: `${row.summary.progressPercentage}%` }}
                          />
                        </div>
                        <p className="text-[9px] font-black text-[#C5A059] mt-0.5">
                          {row.summary.progressPercentage}% completado
                        </p>
                      </div>
                    ) : row.loadingDetail ? (
                      <Loader2 className="w-5 h-5 text-[#003366] animate-spin" />
                    ) : null}
                    {expandedId === row.internshipId ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Detalle de historial */}
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
                            {/* Resumen KPIs */}
                            {row.summary && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                {[
                                  { label: "Horas registradas", value: `${row.summary.totalHours}h` },
                                  { label: "Horas requeridas", value: `${row.summary.requiredHours}h` },
                                  { label: "Registros", value: String(row.summary.totalRecords) },
                                  { label: "Horas pendientes", value: `${row.summary.remainingHours}h` },
                                ].map((kpi) => (
                                  <div
                                    key={kpi.label}
                                    className="bg-slate-50 rounded-2xl p-4 border border-slate-100"
                                  >
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                      {kpi.label}
                                    </p>
                                    <p className="text-xl font-black text-[#003366]">{kpi.value}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Historial tabla */}
                            {row.history.length === 0 ? (
                              <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-300 py-8">
                                Sin registros de asistencia
                              </p>
                            ) : (
                              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">Fecha</th>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">Entrada</th>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">Salida</th>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">Distancia</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {row.history.slice(0, 10).map((h: any) => (
                                      <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3 font-bold text-[#003366]">
                                          {new Date(h.checkIn).toLocaleDateString("es-ES", {
                                            day: "numeric", month: "short",
                                          })}
                                        </td>
                                        <td className="px-5 py-3">
                                          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                            <ArrowRightCircle className="w-3.5 h-3.5" />
                                            {new Date(h.checkIn).toLocaleTimeString([], {
                                              hour: "2-digit", minute: "2-digit",
                                            })}
                                          </div>
                                        </td>
                                        <td className="px-5 py-3">
                                          {h.checkOut ? (
                                            <div className="flex items-center gap-1.5 text-rose-500 font-bold">
                                              <ArrowLeftCircle className="w-3.5 h-3.5" />
                                              {new Date(h.checkOut).toLocaleTimeString([], {
                                                hour: "2-digit", minute: "2-digit",
                                              })}
                                            </div>
                                          ) : (
                                            <span className="text-amber-500 font-black text-[9px] uppercase">Pendiente</span>
                                          )}
                                        </td>
                                        <td className="px-5 py-3">
                                          <div className="flex items-center gap-1 text-slate-400 font-bold">
                                            <MapPin className="w-3 h-3" />
                                            {h.distanceKm
                                              ? `${(h.distanceKm * 1000).toFixed(0)}m`
                                              : "N/A"}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {row.history.length > 10 && (
                                  <p className="text-center text-[9px] font-black uppercase tracking-widest text-slate-300 py-3 border-t border-slate-100">
                                    Mostrando los últimos 10 registros
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

function KpiCard({
  icon, title, value, color,
}: {
  icon: React.ReactElement; title: string; value: string | number; color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl"
    >
      <div className={cn("p-4 rounded-2xl inline-flex mb-6", color.replace("bg-", "bg-") + "/10")}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: `w-6 h-6 ${color.replace("bg-", "text-")}`,
        })}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-3xl font-black text-[#003366] tracking-tighter">{value}</h4>
    </motion.div>
  );
}
