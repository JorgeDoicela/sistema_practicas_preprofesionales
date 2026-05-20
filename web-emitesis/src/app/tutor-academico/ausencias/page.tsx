"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarOff, CheckCheck, XCircle, Loader2, AlertCircle, X, Clock, FileText,
} from "lucide-react";
import { absencesService, Absence } from "@/services/absences.service";
import { cn } from "@/lib/utils";

const ABSENCE_TYPES: Record<string, string> = {
  ENFERMEDAD: "Enfermedad",
  PERSONAL: "Motivo personal",
  LABORAL: "Motivo laboral",
  OTRA: "Otra",
};

export default function TutorAusenciasPage() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<Absence | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await absencesService.findPendingForTutor();
      setAbsences(Array.isArray(res) ? res : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleReview = async (status: "APROBADA" | "RECHAZADA") => {
    if (!reviewModal) return;
    setSaving(true);
    setError(null);
    try {
      await absencesService.review(reviewModal.id, status, reviewNotes || undefined);
      setSuccess(`Ausencia ${status === "APROBADA" ? "aprobada" : "rechazada"} correctamente`);
      setReviewModal(null);
      setReviewNotes("");
      load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al procesar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto py-10 px-4 md:px-8 space-y-10">
        <div>
          <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block flex items-center gap-2">
            <CalendarOff size={12} /> Revisión de Ausencias
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">Ausencias Pendientes</h1>
          <p className="text-slate-500 font-medium mt-2">Revisa, aprueba o rechaza de forma oficial las justificaciones de tus estudiantes.</p>
        </div>

        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm font-bold shadow-sm">
              <CheckCheck size={18} className="text-green-600" /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#003366] animate-spin" />
          </div>
        ) : absences.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400">
            <CheckCheck size={48} className="mx-auto mb-4 opacity-30 text-[#003366]" />
            <p className="font-bold">Sin ausencias pendientes</p>
            <p className="text-sm mt-1">Todos los registros de tus estudiantes están al día.</p>
          </div>
        ) : (
          <div className="space-y-4" data-tour="tutor-ausencias-list">
            {absences.map(ab => (
              <motion.div key={ab.id} layout
                className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="shrink-0 p-3 bg-amber-50 rounded-2xl mt-0.5 text-amber-600">
                      <Clock size={22} className="animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-black text-[#003366] text-base">
                          {ab.internship?.student?.fullName || "Estudiante"}
                        </p>
                        {ab.internship?.student?.cedula && (
                          <span className="text-xs text-slate-400 font-medium">CI: {ab.internship.student.cedula}</span>
                        )}
                        <span className="flex items-center gap-1.5 px-3 py-1 border rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border-amber-100/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pendiente de Revisión
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <span className="font-bold text-[#003366]">Fecha:</span>
                          {new Date(ab.date).toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden sm:inline" />
                        <span className="flex items-center gap-1">
                          <span className="font-bold text-[#003366]">Categoría:</span>
                          {ABSENCE_TYPES[ab.type] ?? ab.type}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-2xl border border-slate-50">{ab.reason}</p>

                      {ab.filePath && (
                        <div className="pt-1">
                          <a href={ab.filePath} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[#003366] hover:text-[#C5A059] transition-colors uppercase tracking-wider text-[10px] font-black">
                            <FileText size={14} /> Ver Documento Justificativo
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => { setReviewModal(ab); setReviewNotes(""); setError(null); }}
                    className="w-full md:w-auto flex-shrink-0 px-6 py-3.5 bg-[#003366] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:translate-y-[-1px] hover:bg-[#002244] transition-all shadow-md">
                    Revisar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {reviewModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setReviewModal(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-[#003366]">Revisar Ausencia</h2>
                  <button onClick={() => setReviewModal(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X size={18} /></button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl mb-5 space-y-2">
                  <div>
                    <p className="font-black text-[#003366] text-sm">{reviewModal.internship?.student?.fullName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estudiante</p>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Fecha:</span>
                    <span className="text-[#003366]">{new Date(reviewModal.date).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500">Categoría:</span>
                    <span className="text-[#003366]">{ABSENCE_TYPES[reviewModal.type] ?? reviewModal.type}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Motivo Reportado</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{reviewModal.reason}</p>
                  </div>
                </div>

                {/* Enlace al justificativo dentro del modal del tutor */}
                {reviewModal.filePath && (
                  <div className="mb-5">
                    <a href={reviewModal.filePath} target="_blank" rel="noopener noreferrer"
                      className="w-full py-3 border border-[#003366]/20 text-[#003366] hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                      <FileText size={14} /> Ver Documento Justificativo
                    </a>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl text-red-600 text-xs font-bold mb-4">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <div className="space-y-1.5 mb-5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nota / Comentario (opcional)</label>
                  <textarea rows={3} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Añade una observación para el estudiante..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#003366] resize-none" />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleReview("APROBADA")} disabled={saving}
                    className="flex-1 bg-emerald-600 text-white rounded-2xl py-3.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-emerald-700 transition-all shadow-sm">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />} Aprobar
                  </button>
                  <button onClick={() => handleReview("RECHAZADA")} disabled={saving}
                    className="flex-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl py-3.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-rose-100 transition-all shadow-sm">
                    <XCircle size={14} /> Rechazar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
