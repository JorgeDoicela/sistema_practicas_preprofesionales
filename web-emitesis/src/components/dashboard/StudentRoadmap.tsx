"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  UserPlus, 
  FileStack, 
  Clock, 
  Star, 
  CheckCircle2, 
  ChevronRight,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface Step {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  status: "completed" | "current" | "pending";
}

interface StudentRoadmapProps {
  internship: any;
}

export function StudentRoadmap({ internship }: StudentRoadmapProps) {
  const { t } = useLanguage();
  if (!internship) return null;

  const docs = internship.documents || [];
  const approvedDocs = docs.filter((d: any) => d.status === "APROBADO_DEFINITIVO").length;
  const totalHours = internship.totalHours || 0;
  const workedHours = internship.attendances?.reduce((acc: number, a: any) => {
    if (!a.checkOut) return acc;
    return acc + (new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 3600000;
  }, 0) || 0;

  const hasEvaluations = (internship.evaluations?.length ?? 0) > 0;

  const steps: Step[] = [
    {
      id: "asignacion",
      label: t.roadmap.steps.asignacion.label,
      description: t.roadmap.steps.asignacion.desc,
      icon: UserPlus,
      status: "completed",
    },
    {
      id: "documentacion",
      label: t.roadmap.steps.documentacion.label,
      description: t.roadmap.steps.documentacion.desc.replace("{count}", String(approvedDocs)),
      icon: FileStack,
      status: approvedDocs > 0 ? (approvedDocs >= docs.length && docs.length > 0 ? "completed" : "current") : "pending",
    },
    {
      id: "asistencia",
      label: t.roadmap.steps.asistencia.label,
      description: t.roadmap.steps.asistencia.desc.replace("{pct}", String(Math.round((workedHours / (totalHours || 1)) * 100))),
      icon: Clock,
      status: workedHours > 0 ? (workedHours >= totalHours ? "completed" : "current") : "pending",
    },
    {
      id: "evaluacion",
      label: t.roadmap.steps.evaluacion.label,
      description: hasEvaluations ? t.roadmap.steps.evaluacion.completed : t.roadmap.steps.evaluacion.pending,
      icon: Star,
      status: hasEvaluations ? "completed" : (workedHours >= totalHours ? "current" : "pending"),
    },
    {
      id: "cierre",
      label: t.roadmap.steps.cierre.label,
      description: internship.status === "Finalizado" ? t.roadmap.steps.cierre.completed : t.roadmap.steps.cierre.pending,
      icon: CheckCircle2,
      status: internship.status === "Finalizado" ? "completed" : "pending",
    },
  ];

  return (
    <div 
      className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10 relative overflow-hidden"
      data-tour="dashboard-roadmap"
    >
      <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
        <CheckCircle2 className="w-40 h-40 text-[#003366]" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">{t.roadmap.title}</span>
            <h3 className="text-2xl font-black text-[#003366] tracking-tight text-balance">{t.roadmap.subtitle}</h3>
          </div>
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.roadmap.status}: {internship.status}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1 group">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "w-14 h-14 flex items-center justify-center transition-all",
                      step.status === "completed" ? "text-[#003366]" :
                      step.status === "current" ? "text-[#C5A059] animate-pulse" :
                      "text-slate-200"
                    )}
                  >
                    <Icon className="w-8 h-8" />
                  </motion.div>
                  <div className="text-center mt-4">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest mb-1",
                      step.status === "pending" ? "text-slate-400" : "text-[#003366]"
                    )}>
                      {step.label}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight max-w-[120px] mx-auto opacity-70">
                      {step.description}
                    </p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden md:flex flex-1 items-center justify-center pt-7">
                    <ChevronRight className={cn(
                      "w-5 h-5",
                      steps[idx].status === "completed" ? "text-[#C5A059]" : "text-slate-100"
                    )} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Barra de progreso conectora (mobile) */}
        <div className="md:hidden w-1 bg-slate-100 h-20 mx-auto -mt-4 mb-4" />
      </div>
    </div>
  );
}
