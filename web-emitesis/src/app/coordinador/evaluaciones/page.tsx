"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  ClipboardCheck,
  Star,
  Search,
  Users,
  Award,
  TrendingUp,
  Building2,
  GraduationCap,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";
import { evaluationsService } from "@/services/evaluations.service";
import { useLanguage } from "@/providers/LanguageProvider";

interface EvalResult {
  internshipId: string;
  studentName: string;
  companyName: string;
  tutorName: string;
  status: string;
  evaluation: {
    punctuality: number;
    teamwork: number;
    technicalSkills: number;
    proactivity: number;
    attitude: number;
    observations?: string;
    total: number;
    percentage: number;
  } | null;
}

// Local criteria labels mapping is now handled inside the component via the t object.

function StarRow({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "w-3.5 h-3.5",
            s <= score ? "fill-[#C5A059] text-[#C5A059]" : "text-slate-200",
          )}
        />
      ))}
      <span className="ml-1 text-[10px] font-black text-slate-500">{score}/5</span>
    </div>
  );
}

function PercentageBadge({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
    pct >= 60 ? "bg-amber-50 text-amber-700 border-amber-100" :
    "bg-rose-50 text-rose-700 border-rose-100";
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", color)}>
      {pct}%
    </span>
  );
}

export default function EvaluacionesPage() {
  const { t } = useLanguage();
  const [results, setResults] = useState<EvalResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await internshipsService.findAll();
      const list = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
      const rows: EvalResult[] = await Promise.all(
        list.map(async (i: any) => {
          let evaluation: EvalResult["evaluation"] = null;
          try {
            const evRes: any = await evaluationsService.findByInternship(i.id);
            // Desempaquetado industrial de la respuesta
            const ev = evRes?.data ? (Array.isArray(evRes.data) ? evRes.data[0] : evRes.data) : (Array.isArray(evRes) ? evRes[0] : null);

            if (ev) {
              const p = Number(ev.punctuality) || 0;
              const tw = Number(ev.teamwork) || 0;
              const ts = Number(ev.technicalSkills) || 0;
              const pr = Number(ev.proactivity) || 0;
              const at = Number(ev.attitude) || 0;
              
              const total = p + tw + ts + pr + at;
              evaluation = {
                punctuality: p,
                teamwork: tw,
                technicalSkills: ts,
                proactivity: pr,
                attitude: at,
                observations: ev.observations,
                total,
                percentage: Math.round((total / 25) * 100),
              };
            }
          } catch (err) {
            console.error(`Error loading evaluation for ${i.id}:`, err);
          }
          return {
            internshipId: i.id,
            studentName: i.student?.fullName ?? "—",
            companyName: i.company?.name ?? "—",
            tutorName: i.tutor?.fullName ?? "—",
            status: i.status ?? "—",
            evaluation,
          };
        }),
      );
      setResults(rows);
    } catch (error) {
      console.error("Error cargando evaluaciones:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = results.filter(
    (r) =>
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.companyName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const withEval = results.filter((r) => r.evaluation).length;
  const avgPct =
    withEval > 0
      ? Math.round(
          results
            .filter((r) => r.evaluation)
            .reduce((acc, r) => acc + (r.evaluation?.percentage ?? 0), 0) / withEval,
        )
      : 0;

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-[1400px] mx-auto pb-20">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
              {t.coordinator.evaluations.subtitle}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">
              {t.coordinator.evaluations.title}
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              {t.coordinator.evaluations.description}
            </p>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
            <input
              type="text"
              placeholder={t.coordinator.evaluations.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-[340px] outline-none focus:ring-4 focus:ring-[#003366]/5 focus:border-[#003366] transition-all font-medium text-sm shadow-sm"
            />
          </div>
        </section>

        {/* KPIs */}
        {!loading && (
          <section className="grid sm:grid-cols-3 gap-6">
             <KpiCard
              icon={<Users className="w-6 h-6" />}
              title={t.coordinator.evaluations.kpis.total}
              value={results.length}
              color="bg-blue-500"
            />
            <KpiCard
              icon={<Award className="w-6 h-6" />}
              title={t.coordinator.evaluations.kpis.evaluated}
              value={withEval}
              color="bg-emerald-500"
            />
            <KpiCard
              icon={<TrendingUp className="w-6 h-6" />}
              title={t.coordinator.evaluations.kpis.average}
              value={`${avgPct}%`}
              color="bg-amber-500"
            />
          </section>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t.common.loading}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 text-center">
                <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                 <p className="font-black text-slate-400 uppercase tracking-widest text-sm">
                  {t.coordinator.evaluations.detail.noResults}
                </p>
              </div>
            ) : (
              filtered.map((r, idx) => (
                <motion.div
                  key={r.internshipId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={cn(
                    "bg-white rounded-[2rem] border shadow-sm transition-all overflow-hidden",
                    r.evaluation ? "border-slate-200 hover:shadow-md" : "border-dashed border-slate-200 opacity-80",
                  )}
                >
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === r.internshipId ? null : r.internshipId)
                    }
                    className="w-full p-7 flex flex-col md:flex-row md:items-center gap-5 text-left"
                  >
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-[1.5rem] bg-[#003366]/5 flex items-center justify-center text-xl font-black text-[#003366] shrink-0">
                      {r.studentName.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-black text-[#003366] truncate">{r.studentName}</h3>
                      <div className="flex flex-wrap gap-4 mt-1">
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Building2 className="w-3 h-3" />
                          {r.companyName}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <GraduationCap className="w-3 h-3" />
                          {r.tutorName}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                            r.status === "Finalizado"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700",
                          )}
                        >
                          {(t.tutor.internshipStatus as any)[r.status] || r.status}
                        </span>
                      </div>
                    </div>

                    {/* Estado evaluación */}
                    <div className="flex items-center gap-4 shrink-0">
                      {r.evaluation ? (
                        <>
                          <PercentageBadge pct={r.evaluation.percentage} />
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t.coordinator.evaluations.status.evaluated}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                          <Clock className="w-3.5 h-3.5" />
                          {t.coordinator.evaluations.status.notEvaluated}
                        </div>
                      )}
                      {r.evaluation &&
                        (expandedId === r.internshipId ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ))}
                    </div>
                  </button>

                  {/* Detalle expandido */}
                  <AnimatePresence>
                    {expandedId === r.internshipId && r.evaluation && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-100"
                      >
                        <div className="p-7 pt-5 grid md:grid-cols-2 gap-8">
                          {/* Criterios */}
                           <div className="space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                              {t.coordinator.evaluations.detail.criteriaTitle}
                            </p>
                            {Object.entries(t.coordinator.evaluations.criteria).map(([key, label]) => (
                              <div key={key} className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-600">{label as string}</span>
                                <StarRow
                                  score={
                                    (r.evaluation as unknown as Record<string, number>)[key]
                                  }
                                />
                              </div>
                            ))}
                          </div>

                          {/* Resumen + observaciones */}
                           <div className="space-y-4">
                            <div className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                {t.coordinator.evaluations.detail.globalScore}
                              </p>
                              <div className="flex items-end gap-2 mb-3">
                                <span className="text-2xl md:text-4xl font-black text-[#003366]">
                                  {r.evaluation.total}
                                </span>
                                <span className="text-xl font-black text-slate-300 mb-1">/ 25</span>
                              </div>
                              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${r.evaluation.percentage}%` }}
                                  className={cn(
                                    "h-full rounded-full",
                                    r.evaluation.percentage >= 80
                                      ? "bg-emerald-500"
                                      : r.evaluation.percentage >= 60
                                        ? "bg-amber-400"
                                        : "bg-rose-500",
                                  )}
                                />
                              </div>
                              <p
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-widest mt-2",
                                  r.evaluation.percentage >= 80
                                    ? "text-emerald-600"
                                    : r.evaluation.percentage >= 60
                                      ? "text-amber-600"
                                      : "text-rose-600",
                                )}
                               >
                                {r.evaluation.percentage >= 80
                                  ? t.coordinator.evaluations.performance.outstanding
                                  : r.evaluation.percentage >= 60
                                    ? t.coordinator.evaluations.performance.acceptable
                                    : t.coordinator.evaluations.performance.improving}
                              </p>
                            </div>
                             {r.evaluation.observations && (
                              <div className="bg-amber-50/50 rounded-[1.5rem] p-5 border border-amber-100">
                                <p className="text-[9px] font-black uppercase tracking-widest text-amber-700 mb-2">
                                  {t.coordinator.evaluations.detail.observationsLabel}
                                </p>
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                  {r.evaluation.observations}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function KpiCard({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactElement;
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl"
    >
      <div
        className={cn(
          "p-4 rounded-2xl inline-flex mb-6",
          color.replace("bg-", "bg-") + "/10",
        )}
      >
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: `w-6 h-6 ${color.replace("bg-", "text-")}`,
        })}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tighter break-words">{value}</h4>
    </motion.div>
  );
}
