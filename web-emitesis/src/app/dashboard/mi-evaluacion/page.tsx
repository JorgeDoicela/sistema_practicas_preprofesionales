"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Star,
  Award,
  Building2,
  GraduationCap,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";
import { evaluationsService } from "@/services/evaluations.service";

const CRITERIA = [
  { key: "punctuality",    label: "Puntualidad",       desc: "Asistencia y cumplimiento de horarios." },
  { key: "teamwork",       label: "Trabajo en equipo", desc: "Colaboración y relaciones interpersonales." },
  { key: "technicalSkills",label: "Aptitud técnica",   desc: "Dominio de conocimientos y habilidades." },
  { key: "proactivity",    label: "Proactividad",      desc: "Iniciativa y resolución de problemas." },
  { key: "attitude",       label: "Actitud",           desc: "Disposición, compromiso y ética profesional." },
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
  const [loading, setLoading] = useState(true);
  const [internship, setInternship] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const internships = await internshipsService.findByStudent(user.id);
      if (!internships || internships.length === 0) return;

      const primary = internships[0];
      setInternship(primary);

      const ev = await evaluationsService.findByInternship(primary.id);
      setEvaluation(ev);
    } catch (error) {
      console.error("Error cargando evaluación:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const total = evaluation
    ? evaluation.punctuality +
      evaluation.teamwork +
      evaluation.technicalSkills +
      evaluation.proactivity +
      evaluation.attitude
    : 0;
  const percentage = evaluation ? Math.round((total / 25) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-20 space-y-10">
        {/* Header */}
        <section>
          <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
            Mi Práctica Preprofesional
          </span>
          <h2 className="text-4xl font-black text-[#003366] tracking-tight">
            Mi <span className="text-slate-400">Evaluación</span>
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            Resultado del test de aptitud y actitud emitido por la empresa donde realizaste tus prácticas.
          </p>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Cargando tu evaluación...
            </p>
          </div>
        ) : !internship ? (
          <div className="bg-amber-50 rounded-[2.5rem] border border-amber-100 p-16 text-center">
            <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-5" />
            <h3 className="text-xl font-black text-amber-900 uppercase tracking-tight">Sin práctica asignada</h3>
            <p className="text-amber-700 font-medium mt-2">
              Aún no tienes una práctica preprofesional registrada en el sistema.
            </p>
          </div>
        ) : !evaluation ? (
          <>
            {/* Ficha de práctica */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-5">
                Tu práctica activa
              </p>
              <div className="grid sm:grid-cols-3 gap-6">
                <InfoBlock icon={<Building2 className="w-4 h-4" />} label="Empresa" value={internship.company?.name ?? "—"} />
                <InfoBlock icon={<User className="w-4 h-4" />} label="Tutor académico" value={internship.tutor?.fullName ?? "—"} />
                <InfoBlock icon={<GraduationCap className="w-4 h-4" />} label="Estado" value={internship.status ?? "—"} highlight />
              </div>
            </div>
            <div className="bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 p-16 text-center">
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-5" />
              <h3 className="text-xl font-black text-slate-500 uppercase tracking-tight">
                Evaluación pendiente
              </h3>
              <p className="text-slate-400 font-medium mt-2 max-w-sm mx-auto leading-relaxed">
                La empresa aún no ha completado el test de aptitud y actitud. Te notificaremos cuando esté disponible.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Ficha de práctica */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-5">
                Tu práctica
              </p>
              <div className="grid sm:grid-cols-3 gap-6">
                <InfoBlock icon={<Building2 className="w-4 h-4" />} label="Empresa evaluadora" value={internship.company?.name ?? "—"} />
                <InfoBlock icon={<User className="w-4 h-4" />} label="Tutor académico" value={internship.tutor?.fullName ?? "—"} />
                <InfoBlock icon={<GraduationCap className="w-4 h-4" />} label="Estado práctica" value={internship.status ?? "—"} highlight />
              </div>
            </div>

            {/* Resultado global */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#003366] to-[#004a99] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-900/30"
            >
              <div className="flex items-center gap-3 mb-8">
                <Award className="w-8 h-8 text-[#C5A059]" />
                <div>
                  <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em]">
                    Resultado final
                  </p>
                  <h3 className="text-xl font-black">Test de Aptitud y Actitud</h3>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-7xl font-black text-white">{total}</span>
                    <span className="text-3xl font-black text-white/40 mb-2">/ 25</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        percentage >= 80 ? "bg-emerald-400" : percentage >= 60 ? "bg-amber-400" : "bg-rose-400",
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#C5A059]" />
                    <span
                      className={cn(
                        "text-sm font-black",
                        percentage >= 80 ? "text-emerald-300" : percentage >= 60 ? "text-amber-300" : "text-rose-300",
                      )}
                    >
                      {percentage}% ·{" "}
                      {percentage >= 80
                        ? "Desempeño sobresaliente"
                        : percentage >= 60
                          ? "Desempeño aceptable"
                          : "Desempeño en mejora"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div
                    className={cn(
                      "w-36 h-36 rounded-full flex flex-col items-center justify-center border-4",
                      percentage >= 80
                        ? "border-emerald-400 bg-emerald-400/10"
                        : percentage >= 60
                          ? "border-amber-400 bg-amber-400/10"
                          : "border-rose-400 bg-rose-400/10",
                    )}
                  >
                    <span className="text-5xl font-black text-white">{percentage}%</span>
                    <CheckCircle2
                      className={cn(
                        "w-6 h-6 mt-2",
                        percentage >= 80 ? "text-emerald-400" : percentage >= 60 ? "text-amber-400" : "text-rose-400",
                      )}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Desglose por criterio */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-10 py-8 border-b border-slate-100">
                <h3 className="text-lg font-black text-[#003366]">Desglose por criterio</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Puntuación detallada entregada por la empresa evaluadora.
                </p>
              </div>
              <div className="p-10 space-y-7">
                {CRITERIA.map((c, idx) => (
                  <motion.div
                    key={c.key}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="flex flex-col md:flex-row md:items-center gap-4"
                  >
                    <div className="flex-1">
                      <h4 className="font-black text-[#003366] text-sm">{c.label}</h4>
                      <p className="text-slate-400 text-[11px] font-medium mt-0.5">{c.desc}</p>
                    </div>
                    <StarDisplay score={evaluation[c.key] ?? 0} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Observaciones */}
            {evaluation.observations && (
              <div className="bg-amber-50 rounded-[2.5rem] border border-amber-100 p-8">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-700 mb-3">
                  Observaciones de la empresa
                </p>
                <p className="text-slate-700 font-medium leading-relaxed text-sm">
                  {evaluation.observations}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
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
