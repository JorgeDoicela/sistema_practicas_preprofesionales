"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarOff, CheckCheck, XCircle, Loader2, AlertCircle, X, Clock,
} from "lucide-react";
import { absencesService, Absence } from "@/services/absences.service";
import { cn } from "@/lib/utils";

const ABSENCE_TYPES: Record<string, string> = {
  ENFERMEDAD: "Enfermedad", PERSONAL: "Motivo personal",
  LABORAL: "Motivo laboral", OTRA: "Otra",
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
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#003366]/5 text-[#003366] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#003366]/10">
            <CalendarOff size={12} /> Revisión de Ausencias
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight">Ausencias Pendientes</h1>
          <p className="text-slate-500 mt-1">Aprueba o rechaza las ausencias de tus estudiantes.</p>
        </div>

        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm font-bold">
              <CheckCheck size={18} /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#003366] animate-spin" />
          </div>
        ) : absences.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <CheckCheck size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold">Sin ausencias pendientes</p>
            <p className="text-sm mt-1">Todos los registros están al día.</p>
          </div>
        ) : (
          <div className="space-y-4" data-tour="tutor-ausencias-list">
            {absences.map(ab => (
              <motion.div key={ab.id} layout
                className="bg-white rounded-3xl border border-amber-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-black text-[#003366]">
                        {ab.internship?.student?.fullName || "Estudiante"}
                        {ab.internship?.student?.cedula && <span className="text-xs text-slate-400 font-normal ml-2">CI: {ab.internship.student.cedula}</span>}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {new Date(ab.date).toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-bold">Tipo:</span> {ABSENCE_TYPES[ab.type] ?? ab.type}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{ab.reason}</p>
                      {ab.filePath && (
                        <a href={ab.filePath} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] font-black uppercase tracking-widest text-[#003366] hover:text-[#C5A059] transition-colors mt-1 inline-block">
                          Ver documento
                        </a>
                      )}
                    </div>
                  </div>
                  <button onClick={() => { setReviewModal(ab); setReviewNotes(""); setError(null); }}
                    className="w-full sm:w-auto sm:flex-shrink-0 px-5 py-2.5 bg-[#003366] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:translate-y-[-1px] transition-all">
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
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-[#003366]">Revisar Ausencia</h2>
                  <button onClick={() => setReviewModal(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X size={18} /></button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl mb-5">
                  <p className="font-black text-[#003366] text-sm">{reviewModal.internship?.student?.fullName}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(reviewModal.date).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}</p>
                  <p className="text-sm text-slate-600 mt-2">{reviewModal.reason}</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl text-red-600 text-xs font-bold mb-4">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <div className="space-y-2 mb-5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nota / Comentario (opcional)</label>
                  <textarea rows={3} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Añade una observación para el estudiante..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#003366] resize-none" />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleReview("APROBADA")} disabled={saving}
                    className="flex-1 bg-green-600 text-white rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-green-700 transition-all">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />} Aprobar
                  </button>
                  <button onClick={() => handleReview("RECHAZADA")} disabled={saving}
                    className="flex-1 bg-red-100 text-red-600 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-red-200 transition-all">
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
