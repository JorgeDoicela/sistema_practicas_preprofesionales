"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarOff, CheckCheck, XCircle, Loader2, AlertCircle, Clock, X, FileText } from "lucide-react";
import { absencesService, Absence } from "@/services/absences.service";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { API_URL } from "@/lib/api-base";

const statusBadge: Record<string, { class: string; dot: string }> = {
  PENDIENTE: {
    class: "bg-amber-50 text-amber-700 border-amber-100/80",
    dot: "bg-amber-500",
  },
  APROBADA: {
    class: "bg-emerald-50 text-emerald-700 border-emerald-100/80",
    dot: "bg-emerald-500",
  },
  RECHAZADA: {
    class: "bg-rose-50 text-rose-700 border-rose-100/80",
    dot: "bg-rose-500",
  },
};

export default function CoordinadorAusenciasPage() {
  const { t, locale } = useLanguage();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [reviewModal, setReviewModal] = useState<Absence | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res: any = await absencesService.findAll();
      setAbsences(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setPageError(err.message || t.coordinator.absences.errorLoad);
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
      setError(err.message || t.coordinator.absences.errorReview);
    } finally {
      setSaving(false);
    }
  };

  const getFileUrl = (filePath?: string) => {
    if (!filePath) return undefined;
    return filePath.startsWith("http") ? filePath : `${API_URL.replace("/api", "")}${filePath}`;
  };

  const getFilterLabel = (status: string) => {
    if (status === "Todos") return t.coordinator.absences.filterAll;
    if (status === "PENDIENTE") return t.coordinator.absences.filterPending;
    if (status === "APROBADA") return t.coordinator.absences.filterApproved;
    if (status === "RECHAZADA") return t.coordinator.absences.filterRejected;
    return status;
  };

  const filtered = filterStatus === "Todos" ? absences : absences.filter(a => a.status === filterStatus);
  const dateFormat = locale === "es" ? "es-EC" : "en-US";

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto py-10 px-4 md:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block flex items-center gap-2">
              <CalendarOff size={12} /> {t.coordinator.absences.metaTitle}
            </span>
            <h1 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">{t.coordinator.absences.title}</h1>
            <p className="text-slate-500 font-medium mt-2">{t.coordinator.absences.subtitle}</p>
          </div>
        </div>

        {pageError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-bold shadow-sm animate-fade-in">
            <AlertCircle size={18} className="text-red-600 animate-bounce" />
            <span>{pageError}</span>
            <button onClick={load} className="ml-auto underline hover:text-red-900 transition-colors uppercase tracking-widest text-[10px] font-black">
              {t.common.retry || "Reintentar"}
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap" data-tour="ausencias-filters">
          {["Todos", "PENDIENTE", "APROBADA", "RECHAZADA"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm",
                filterStatus === s ? "bg-[#003366] text-white border-[#003366]" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}>
              {getFilterLabel(s)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-[#003366] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400">
            <CalendarOff size={48} className="mx-auto mb-4 opacity-30 text-[#003366]" />
            <p className="font-bold">{t.coordinator.absences.noAbsences}</p>
          </div>
        ) : (
          <div className="space-y-4" data-tour="ausencias-list">
            {filtered.map(ab => {
              const badge = statusBadge[ab.status] || statusBadge.PENDIENTE;
              const fileUrl = getFileUrl(ab.filePath);
              return (
                <motion.div key={ab.id} layout
                  className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="shrink-0 p-3 bg-slate-50 rounded-2xl mt-0.5">
                        <CalendarOff size={22} className={ab.status === "APROBADA" ? "text-emerald-600" : ab.status === "RECHAZADA" ? "text-rose-500" : "text-amber-600"} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-black text-[#003366] text-base">{ab.internship?.student?.fullName || t.coordinator.absences.student}</p>
                          {ab.internship?.student?.cedula && (
                            <span className="text-xs text-slate-400 font-medium">{t.coordinator.absences.idCard}: {ab.internship.student.cedula}</span>
                          )}
                          <span className={cn("flex items-center gap-1.5 px-3 py-1 border rounded-full text-[9px] font-black uppercase tracking-widest", badge.class)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", badge.dot)} />
                            {t.coordinator.absences.status[ab.status] || ab.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <span className="font-bold text-[#003366]">{t.coordinator.absences.dateLabel}:</span>
                            {new Date(ab.date).toLocaleDateString(dateFormat, { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" })}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden sm:inline" />
                          <span className="flex items-center gap-1">
                            <span className="font-bold text-[#003366]">{t.coordinator.absences.categoryLabel}:</span>
                            {(t.coordinator.absences.types as Record<string, string>)[ab.type] || ab.type}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-2xl border border-slate-50">{ab.reason}</p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-[11px] text-slate-400 font-semibold">
                          {ab.internship?.tutor && (
                            <span className="flex items-center gap-1.5">
                              <span className="text-[#003366]">{t.coordinator.absences.tutorLabel}:</span> {ab.internship.tutor.fullName}
                            </span>
                          )}
                          {fileUrl && (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden sm:inline" />
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#003366] hover:text-[#C5A059] transition-colors uppercase tracking-wider text-[10px] font-black">
                                <FileText size={13} /> {t.coordinator.absences.viewDoc}
                              </a>
                            </>
                          )}
                        </div>

                        {/* Review History Card */}
                        {ab.status !== "PENDIENTE" && (
                          <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/60 space-y-1">
                            <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider gap-2">
                              <span>{t.coordinator.absences.reviewTitle}</span>
                              {ab.reviewedAt && (
                                <span>{new Date(ab.reviewedAt).toLocaleDateString(dateFormat, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 font-semibold">
                              <span className="text-[#003366] font-bold">{t.coordinator.absences.processedBy}:</span> {ab.reviewedBy?.fullName || "Revisor Autorizado"}
                            </p>
                            {ab.reviewNotes && (
                              <p className="text-xs text-slate-500 mt-1 italic">
                                <span className="font-bold not-italic text-[#003366]">{t.coordinator.absences.notesLabel}:</span> &quot;{ab.reviewNotes}&quot;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {ab.status === "PENDIENTE" && (
                      <button onClick={() => { setReviewModal(ab); setReviewNotes(""); setError(null); }}
                        className="w-full md:w-auto flex-shrink-0 px-6 py-3.5 bg-[#003366] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:translate-y-[-1px] hover:bg-[#002244] transition-all shadow-md">
                        {t.coordinator.absences.reviewBtn}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-[#003366]">{t.coordinator.absences.modalTitle}</h2>
                <button onClick={() => setReviewModal(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X size={18} /></button>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl mb-4 space-y-2">
                <div>
                  <p className="font-black text-[#003366] text-sm">{reviewModal.internship?.student?.fullName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.coordinator.absences.student}</p>
                </div>
                
                <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-slate-100">
                  <span className="text-slate-500">{t.coordinator.absences.modalDate}:</span>
                  <span className="text-[#003366]">{new Date(reviewModal.date).toLocaleDateString(dateFormat, { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" })}</span>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500">{t.coordinator.absences.modalCategory}:</span>
                  <span className="text-[#003366]">{(t.coordinator.absences.types as Record<string, string>)[reviewModal.type] || reviewModal.type}</span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{t.coordinator.absences.modalReason}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{reviewModal.reason}</p>
                </div>
              </div>

              {/* Document link inside modal */}
              {reviewModal.filePath && (
                <div className="mb-4">
                  <a href={getFileUrl(reviewModal.filePath)} target="_blank" rel="noopener noreferrer"
                    className="w-full py-3 border border-[#003366]/20 text-[#003366] hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                    <FileText size={14} /> {t.coordinator.absences.viewDoc}
                  </a>
                </div>
              )}

              {error && <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl text-red-600 text-xs font-bold mb-4"><AlertCircle size={14} /> {error}</div>}
              
              <div className="space-y-1.5 mb-5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.absences.modalNotesLabel}</label>
                <textarea rows={3} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                  placeholder={t.coordinator.absences.modalNotesPlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#003366] resize-none" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => handleReview("APROBADA")} disabled={saving}
                  className="flex-1 bg-emerald-600 text-white rounded-2xl py-3.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-emerald-700 transition-all shadow-sm">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />} {t.coordinator.absences.approveBtn}
                </button>
                <button onClick={() => handleReview("RECHAZADA")} disabled={saving}
                  className="flex-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl py-3.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-rose-100 transition-all shadow-sm">
                  <XCircle size={14} /> {t.coordinator.absences.rejectBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
