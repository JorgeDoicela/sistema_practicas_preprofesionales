"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  User,
  Star,
  Loader2,
  AlertCircle,
  GraduationCap,
  ClipboardList,
  SaveAll,
  TrendingUp,
  Camera,
  FileCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";
import { evaluationsService, EvaluationPayload } from "@/services/evaluations.service";
import { CertificatePreview } from "@/components/dashboard/CertificatePreview";

const CRITERIA = [
  {
    key: "punctuality" as keyof Omit<EvaluationPayload, "internshipId" | "observations">,
    label: "Puntualidad",
    description: "Asistencia y cumplimiento de horarios en la empresa.",
  },
  {
    key: "teamwork" as keyof Omit<EvaluationPayload, "internshipId" | "observations">,
    label: "Trabajo en equipo",
    description: "Colaboración, comunicación y relaciones interpersonales.",
  },
  {
    key: "technicalSkills" as keyof Omit<EvaluationPayload, "internshipId" | "observations">,
    label: "Aptitud técnica",
    description: "Dominio de conocimientos y habilidades requeridas.",
  },
  {
    key: "proactivity" as keyof Omit<EvaluationPayload, "internshipId" | "observations">,
    label: "Proactividad",
    description: "Iniciativa, autonomía y resolución de problemas.",
  },
  {
    key: "attitude" as keyof Omit<EvaluationPayload, "internshipId" | "observations">,
    label: "Actitud",
    description: "Disposición, compromiso y ética profesional.",
  },
];

type ScoreMap = Record<string, number>;

export default function EvaluarEstudiantePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [internship, setInternship] = useState<any>(null);
  const [existingEval, setExistingEval] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);

  const [scores, setScores] = useState<ScoreMap>({
    punctuality: 0,
    teamwork: 0,
    technicalSkills: 0,
    proactivity: 0,
    attitude: 0,
  });
  const [observations, setObservations] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [internshipData, evalRaw] = await Promise.all([
        internshipsService.findOne(id),
        evaluationsService.findByInternship(id),
      ]);
      setInternship(internshipData);
      
      // Filtrar por tipo EMPRESARIAL
      const evalData = Array.isArray(evalRaw) 
        ? evalRaw.find((e: any) => e.type === 'EMPRESARIAL') 
        : evalRaw;

      if (evalData) {
        setExistingEval(evalData);
        setScores({
          punctuality: evalData.punctuality,
          teamwork: evalData.teamwork,
          technicalSkills: evalData.technicalSkills,
          proactivity: evalData.proactivity,
          attitude: evalData.attitude,
        });
        setObservations(evalData.observations || "");
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = CRITERIA.length * 5;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const handleSubmit = async () => {
    const incomplete = CRITERIA.some((c) => (scores[c.key] ?? 0) === 0);
    if (incomplete) {
      alert("Por favor califica todos los criterios antes de guardar.");
      return;
    }

    setSaving(true);
    try {
      await evaluationsService.createOrUpdate({
        internshipId: id,
        type: 'EMPRESARIAL',
        punctuality: scores.punctuality,
        teamwork: scores.teamwork,
        technicalSkills: scores.technicalSkills,
        proactivity: scores.proactivity,
        attitude: scores.attitude,
        observations,
      });
      setSaved(true);
      await loadData();
    } catch (error: any) {
      alert(error.message || "Error al guardar la evaluación");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Cargando expediente...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!internship) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <AlertCircle className="w-12 h-12 text-rose-400" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Pasante no encontrado
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const hoursWorked = internship.attendances?.reduce((s: number, a: any) => {
    if (!a.checkOut) return s;
    return s + (new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 3600000;
  }, 0) ?? 0;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-0 pb-20 space-y-8 md:space-y-10">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4 min-w-0">
          <div className="flex items-start gap-3 min-w-0">
          <button
            onClick={() => router.push("/empresa/dashboard")}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em]">
              RF-07 · Test de Aptitud y Actitud
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight">
              Evaluar Pasante
            </h2>
          </div>
          </div>
          {hoursWorked >= internship.totalHours && existingEval && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCertOpen(true)}
              className="w-full sm:w-auto sm:ml-auto px-5 sm:px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4" /> Generar Certificado
            </motion.button>
          )}
        </div>

        {/* Ficha del pasante */}
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm p-5 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[1.75rem] bg-[#003366]/5 flex items-center justify-center text-2xl md:text-3xl font-black text-[#003366] flex-shrink-0">
              {internship.student.fullName.charAt(0)}
            </div>
            <div className="flex-1 grid md:grid-cols-3 gap-6">
              <InfoBlock icon={<GraduationCap className="w-4 h-4" />} label="Pasante" value={internship.student.fullName} />
              <InfoBlock icon={<Building2 className="w-4 h-4" />} label="Empresa" value={internship.company.name} />
              <InfoBlock icon={<User className="w-4 h-4" />} label="Tutor académico" value={internship.tutor.fullName} />
              <InfoBlock icon={<Calendar className="w-4 h-4" />} label="Inicio" value={new Date(internship.startDate).toLocaleDateString()} />
              <InfoBlock icon={<Clock className="w-4 h-4" />} label="Horas trabajadas" value={`${hoursWorked.toFixed(0)}h de ${internship.totalHours}h`} />
              <InfoBlock icon={<ClipboardList className="w-4 h-4" />} label="Estado práctica" value={internship.status} highlight />
            </div>
          </div>
        </div>

        {/* Evidence Explorer */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
               <Camera className="w-5 h-5 text-[#C5A059]" />
               <h3 className="text-lg font-black text-[#003366]">Explorador de Evidencias</h3>
            </div>
          </div>
          <div className="p-4 sm:p-6 md:p-8">
            {internship.attendances?.filter((a:any) => a.activityPhotoKey).length === 0 ? (
               <div className="py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin evidencias fotográficas aún</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {internship.attendances?.filter((a:any) => a.activityPhotoKey).map((a:any, i:number) => (
                  <motion.div 
                    key={a.id}
                    whileHover={{ scale: 1.05 }}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group"
                  >
                     <img 
                       src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${a.activityPhotoKey}`}
                       alt="Evidencia"
                       className="w-full h-full object-cover"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-[9px] font-black text-white uppercase tracking-widest">{new Date(a.checkIn).toLocaleDateString()}</p>
                     </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Formulario de evaluación */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-[#003366]">Test de Aptitud y Actitud</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Califica del 1 al 5 cada criterio. Este formulario es opcional y puede actualizarse.
              </p>
            </div>
            {existingEval && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                  Evaluación guardada
                </span>
              </div>
            )}
          </div>

          <div className="p-5 md:p-10 space-y-6 md:space-y-8">
            {CRITERIA.map((criterion, idx) => (
              <motion.div
                key={criterion.key}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1">
                  <h4 className="font-black text-[#003366] text-sm">{criterion.label}</h4>
                  <p className="text-slate-400 text-[11px] font-medium mt-0.5">{criterion.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setScores((prev) => ({ ...prev, [criterion.key]: star }))}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95",
                        (scores[criterion.key] ?? 0) >= star
                          ? "bg-[#C5A059] text-white shadow-md shadow-amber-900/10"
                          : "bg-slate-100 text-slate-300 hover:bg-amber-50 hover:text-amber-400"
                      )}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  ))}
                  <span className="ml-2 w-8 text-center text-[13px] font-black text-[#003366]">
                    {scores[criterion.key] || "–"}/5
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Observaciones */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Observaciones generales (opcional)
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Comentarios adicionales sobre el desempeño del pasante..."
                rows={4}
                className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] resize-none outline-none focus:ring-2 focus:ring-[#003366]/10 focus:border-[#003366] transition-all font-medium text-slate-700 text-sm hover:bg-white"
              />
            </div>

            {/* Resultado parcial */}
            <div className="bg-slate-50 rounded-[2rem] p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 border border-slate-100">
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Puntaje total
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-[#003366]">{totalScore}</span>
                  <span className="text-2xl font-black text-slate-300 mb-1">/ {maxScore}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rendimiento</span>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    percentage >= 80 ? "text-emerald-600" : percentage >= 60 ? "text-amber-600" : "text-rose-600"
                  )}>
                    {percentage}%
                  </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      percentage >= 80 ? "bg-emerald-500" : percentage >= 60 ? "bg-amber-400" : "bg-rose-500"
                    )}
                  />
                </div>
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-widest mt-2",
                  percentage >= 80 ? "text-emerald-600" : percentage >= 60 ? "text-amber-600" : "text-rose-600"
                )}>
                  {percentage >= 80 ? "Desempeño sobresaliente" : percentage >= 60 ? "Desempeño aceptable" : percentage > 0 ? "Desempeño en mejora" : "Sin calificar"}
                </p>
              </div>
            </div>

            {/* Botón guardar */}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full h-16 bg-[#003366] hover:bg-[#004488] text-white rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-blue-900/20 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="w-5 h-5 text-[#C5A059]" />
              ) : (
                <SaveAll className="w-5 h-5 text-[#C5A059]" />
              )}
              {saved ? "Evaluación actualizada" : existingEval ? "Actualizar evaluación" : "Guardar evaluación"}
            </button>
          </div>
        </div>
        
        <CertificatePreview 
          isOpen={isCertOpen}
          onClose={() => setIsCertOpen(false)}
          internship={internship}
        />
      </div>
    </DashboardLayout>
  );
}

function InfoBlock({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
        {icon}
        {label}
      </div>
      <p className={cn("font-black text-sm", highlight ? "text-[#C5A059]" : "text-[#003366]")}>{value}</p>
    </div>
  );
}
