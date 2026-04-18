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
      label: "Asignación",
      description: "Práctica registrada y validada",
      icon: UserPlus,
      status: "completed",
    },
    {
      id: "documentacion",
      label: "Documentación",
      description: `${approvedDocs} aprobados`,
      icon: FileStack,
      status: approvedDocs > 0 ? (approvedDocs >= docs.length && docs.length > 0 ? "completed" : "current") : "pending",
    },
    {
      id: "asistencia",
      label: "Asistencia",
      description: `${Math.round((workedHours / (totalHours || 1)) * 100)}% de horas`,
      icon: Clock,
      status: workedHours > 0 ? (workedHours >= totalHours ? "completed" : "current") : "pending",
    },
    {
      id: "evaluacion",
      label: "Evaluación",
      description: hasEvaluations ? "Dual completada" : "Pendiente de tutores",
      icon: Star,
      status: hasEvaluations ? "completed" : (workedHours >= totalHours ? "current" : "pending"),
    },
    {
      id: "cierre",
      label: "Aprobación Final",
      description: internship.status === "Finalizado" ? "Acreditado" : "En espera",
      icon: CheckCircle2,
      status: internship.status === "Finalizado" ? "completed" : "pending",
    },
  ];

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
        <CheckCircle2 className="w-40 h-40 text-[#003366]" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">Mi Trayectoria</span>
            <h3 className="text-2xl font-black text-[#003366] tracking-tight text-balance">Ruta Crítica hacia la Acreditación</h3>
          </div>
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado: {internship.status}</span>
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
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                      step.status === "completed" ? "bg-[#003366] text-white shadow-blue-900/20" :
                      step.status === "current" ? "bg-[#C5A059] text-white shadow-amber-900/20 animate-pulse" :
                      "bg-slate-50 text-slate-300 border border-slate-100 shadow-none"
                    )}
                  >
                    <Icon className="w-6 h-6" />
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
