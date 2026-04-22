"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { CalendarOff, CheckCheck, XCircle, Loader2, AlertCircle, Clock, X } from "lucide-react";
import { absencesService, Absence } from "@/services/absences.service";
import { cn } from "@/lib/utils";

const statusBadge: Record<string, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
  APROBADA: "bg-green-50 text-green-700 border-green-200",
  RECHAZADA: "bg-red-50 text-red-600 border-red-200",
};

export default function CoordinadorAusenciasPage() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [reviewModal, setReviewModal] = useState<Absence | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await absencesService.findAll();
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
      setReviewModal(null);
      setReviewNotes("");
      load();
    } catch (err: any) {
      setError(err.message || "Error al procesar");
    } finally {
      setSaving(false);
    }
  };

  const filtered = filterStatus === "Todos" ? absences : absences.filter(a => a.status === filterStatus);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#003366]/5 text-[#003366] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#003366]/10">
              <CalendarOff size={12} /> Coordinación
            </div>
            <h1 className="text-3xl font-black text-[#003366] tracking-tight">Ausencias del Sistema</h1>
            <p className="text-slate-500 mt-1">Visión global de todas las ausencias registradas.</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {["Todos", "PENDIENTE", "APROBADA", "RECHAZADA"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn(
                "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all",
                filterStatus === s ? "bg-[#003366] text-white border-[#003366]" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              )}>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-[#003366] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <CalendarOff size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold">Sin ausencias en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ab => (
              <motion.div key={ab.id} layout
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    ab.status === "APROBADA" ? "bg-green-50" : ab.status === "RECHAZADA" ? "bg-red-50" : "bg-amber-50")}>
                    <CalendarOff size={16} className={ab.status === "APROBADA" ? "text-green-600" : ab.status === "RECHAZADA" ? "text-red-500" : "text-amber-600"} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-[#003366] text-sm">{ab.internship?.student?.fullName || "Estudiante"}</p>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black border", statusBadge[ab.status])}>
                        {ab.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(ab.date).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{ab.reason}
                    </p>
                    {ab.internship?.tutor && (
                      <p className="text-[10px] text-slate-400">Tutor: {ab.internship.tutor.fullName}</p>
                    )}
                  </div>
                </div>
                {ab.status === "PENDIENTE" && (
                  <button onClick={() => { setReviewModal(ab); setReviewNotes(""); setError(null); }}
                    className="flex-shrink-0 px-4 py-2 bg-[#003366] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:translate-y-[-1px] transition-all">
                    Revisar
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-[#003366]">Revisar Ausencia</h2>
              <button onClick={() => setReviewModal(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl mb-4">
              <p className="font-black text-[#003366] text-sm">{reviewModal.internship?.student?.fullName}</p>
              <p className="text-xs text-slate-500">{new Date(reviewModal.date).toLocaleDateString("es-EC")}</p>
              <p className="text-sm text-slate-600 mt-2">{reviewModal.reason}</p>
            </div>
            {error && <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl text-red-600 text-xs font-bold mb-4"><AlertCircle size={14} /> {error}</div>}
            <textarea rows={2} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
              placeholder="Nota opcional..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none mb-4 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => handleReview("APROBADA")} disabled={saving}
                className="flex-1 bg-green-600 text-white rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />} Aprobar
              </button>
              <button onClick={() => handleReview("RECHAZADA")} disabled={saving}
                className="flex-1 bg-red-100 text-red-600 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <XCircle size={14} /> Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
