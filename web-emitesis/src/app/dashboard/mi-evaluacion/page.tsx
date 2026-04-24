"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Star,
  Award,
  Building2,
  GraduationCap,
  Clock,
  AlertCircle,
  Loader2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";
import { evaluationsService } from "@/services/evaluations.service";
import { useLanguage } from "@/providers/LanguageProvider";

const getCriteria = (t: any) => [
  { key: "punctuality",    label: t.evaluation.criteria.punctuality.label,    desc: t.evaluation.criteria.punctuality.desc },
  { key: "teamwork",       label: t.evaluation.criteria.teamwork.label,       desc: t.evaluation.criteria.teamwork.desc },
  { key: "technicalSkills",label: t.evaluation.criteria.technicalSkills.label, desc: t.evaluation.criteria.technicalSkills.desc },
  { key: "proactivity",    label: t.evaluation.criteria.proactivity.label,    desc: t.evaluation.criteria.proactivity.desc },
  { key: "attitude",       label: t.evaluation.criteria.attitude.label,       desc: t.evaluation.criteria.attitude.desc },
];

function StarDisplay({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-5 h-5 transition-all",
            i < score ? "fill-[#C5A059] text-[#C5A059]" : "text-slate-200",
          )}
        />
      ))}
      <span className="ml-2 text-sm font-black text-[#003366]">{score}/{max}</span>
    </div>
  );
}

export default function MiEvaluacionPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [internship, setInternship] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [finalGrade, setFinalGrade] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const internships = await internshipsService.findByStudent(user.id);
      if (!internships || internships.length === 0) return;

      const primary = internships[0];
      setInternship(primary);

      const [evs, gradeRes] = await Promise.all([
        evaluationsService.findByInternship(primary.id),
        evaluationsService.getGrade(primary.id),
      ]);
      setEvaluations(Array.isArray(evs) ? evs : []);
      setFinalGrade(gradeRes?.grade ?? null);
    } catch (error) {
      console.error("Error cargando evaluaciones:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const evalAcademica = evaluations.find((e) => e.type === "ACADEMICA");
  const evalEmpresarial = evaluations.find((e) => e.type === "EMPRESARIAL");

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pb-20 space-y-10">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
              {t.evaluation.title}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">
              {t.evaluation.hubTitle.split(" ")[0]} <span className="text-slate-400">{t.evaluation.hubTitle.split(" ").slice(1).join(" ")}</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              {t.evaluation.description}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.evaluation.updated}</span>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t.evaluation.syncing}
            </p>
          </div>
        ) : !internship ? (
          <div className="bg-amber-50 rounded-[2.5rem] border border-amber-100 p-16 text-center">
            <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-5" />
            <h3 className="text-xl font-black text-amber-900 uppercase tracking-tight">{t.evaluation.noInternship}</h3>
            <p className="text-amber-700 font-medium mt-2">
              {t.evaluation.noInternshipDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Nota Final Ponderada */}
            {finalGrade !== null && finalGrade > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[#003366] to-[#001a44] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl shadow-blue-900/30 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 sm:p-10 opacity-5">
                  <Trophy className="w-40 h-40" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#C5A059] rounded-2xl flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">
                        {t.evaluation.finalGrade.title}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white/70 mb-1">{t.evaluation.finalGrade.subtitle}</h3>
                    <p className="text-sm text-white/40 font-medium">{t.evaluation.finalGrade.regulation}</p>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="flex items-end gap-2 justify-center md:justify-end">
                      <span className={cn(
                        "text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter",
                        finalGrade >= 7 ? "text-emerald-400" : finalGrade >= 5 ? "text-[#C5A059]" : "text-rose-400"
                      )}>
                        {finalGrade.toFixed(2)}
                      </span>
                      <span className="text-2xl font-black text-white/30 mb-2">/10</span>
                    </div>
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest mt-1",
                      finalGrade >= 7 ? "text-emerald-400" : finalGrade >= 5 ? "text-[#C5A059]" : "text-rose-400"
                    )}>
                      {finalGrade >= 7 ? t.evaluation.finalGrade.status.excellent : finalGrade >= 5 ? t.evaluation.finalGrade.status.approved : t.evaluation.finalGrade.status.inProcess}
                    </p>
                  </div>
                </div>
                {/* Barra de progreso */}
                <div className="relative z-10 mt-8 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(finalGrade / 10) * 100}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                    className={cn(
                      "h-full rounded-full",
                      finalGrade >= 7 ? "bg-emerald-400" : finalGrade >= 5 ? "bg-[#C5A059]" : "bg-rose-400"
                    )}
                  />
                </div>
              </motion.div>
            )}

            <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
              {/* Tarjeta Académica */}
              <EvalCard 
                type="ACADEMICA"
                title={t.evaluation.cards.academic.title}
                subtitle={t.evaluation.cards.academic.subtitle}
                evaluation={evalAcademica}
                icon={<GraduationCap className="w-6 h-6" />}
                color="blue"
              />

              {/* Tarjeta Empresarial */}
              <EvalCard 
                type="EMPRESARIAL"
                title={t.evaluation.cards.business.title}
                subtitle={t.evaluation.cards.business.subtitle}
                evaluation={evalEmpresarial}
                icon={<Building2 className="w-6 h-6" />}
                color="gold"
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function EvalCard({ type, title, subtitle, evaluation, icon, color }: any) {
  const total = evaluation
    ? evaluation.punctuality +
      evaluation.teamwork +
      evaluation.technicalSkills +
      evaluation.proactivity +
      evaluation.attitude
    : 0;
  const percentage = evaluation ? Math.round((total / 25) * 100) : 0;
  
  const isBlue = color === "blue";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col"
    >
      <div className={cn(
        "p-5 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        isBlue ? "bg-[#003366] text-white" : "bg-[#C5A059] text-white"
      )}>
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">{title}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{subtitle}</p>
          </div>
        </div>
        {evaluation && (
          <div className="text-left sm:text-right sm:shrink-0">
             <span className="text-2xl md:text-3xl font-black">{total}</span>
             <span className="text-sm font-black opacity-40 ml-1">/25</span>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-8 flex-1 space-y-6 sm:space-y-8">
        {!evaluation ? (
          <div className="py-20 text-center space-y-4">
            <Clock className="w-12 h-12 text-slate-200 mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.evaluation.cards.pending}</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {getCriteria(t).map((c) => (
                <div key={c.key} className="flex items-center justify-between group">
                  <div>
                    <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest">{c.label}</p>
                    <p className="text-[9px] font-medium text-slate-400 max-w-[150px]">{c.desc}</p>
                  </div>
                  <StarDisplay score={evaluation[c.key]} />
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.evaluation.cards.performance}</span>
                <span className="text-lg font-black text-[#003366]">{percentage}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  className={cn(
                    "h-full rounded-full",
                    percentage >= 80 ? "bg-emerald-500" : percentage >= 60 ? "bg-[#C5A059]" : "bg-rose-500"
                  )}
                />
              </div>
            </div>

            {evaluation.observations && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-[#C5A059]" /> {t.evaluation.cards.feedback}
                </p>
                <p className="text-xs font-medium text-slate-600 italic">"{evaluation.observations}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function InfoBlock({
  icon, label, value, highlight,
}: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
        {icon}{label}
      </div>
      <p className={cn("font-black text-sm", highlight ? "text-[#C5A059]" : "text-[#003366]")}>
        {value}
      </p>
    </div>
  );
}
