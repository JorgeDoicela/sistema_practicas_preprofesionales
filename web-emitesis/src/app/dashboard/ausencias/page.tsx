"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarOff, Plus, Loader2, AlertCircle, CheckCircle2, X,
  Clock, FileUp, Calendar, CheckCheck, XCircle,
} from "lucide-react";
import { absencesService, Absence } from "@/services/absences.service";
import { internshipsService } from "@/services/internships.service";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

export default function AusenciasPage() {
  const { t, locale } = useLanguage();

  const ABSENCE_TYPES = [
    { value: "ENFERMEDAD", label: t.studentAbsences.categories.ENFERMEDAD },
    { value: "PERSONAL", label: t.studentAbsences.categories.PERSONAL },
    { value: "LABORAL", label: t.studentAbsences.categories.LABORAL },
    { value: "OTRA", label: t.studentAbsences.categories.OTRA },
  ];

  const statusBadge: Record<string, { text: string; class: string; icon: React.ReactNode }> = {
    PENDIENTE: {
      text: t.studentAbsences.status.PENDIENTE,
      class: "text-amber-700",
      icon: <Clock size={11} />,
    },
    APROBADA: {
      text: t.studentAbsences.status.APROBADA,
      class: "text-green-700",
      icon: <CheckCheck size={11} />,
    },
    RECHAZADA: {
      text: t.studentAbsences.status.RECHAZADA,
      class: "text-red-600",
      icon: <XCircle size={11} />,
    },
  };

  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [internshipId, setInternshipId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    reason: "",
    type: "ENFERMEDAD",
  });

  const load = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const internships: any = await internshipsService.findByStudent(user.id);
      const list = Array.isArray(internships) ? internships : internships?.items || [];
      const active = list.find((i: any) => ["En Proceso", "Activo"].includes(i.status));
      if (active) {
        setInternshipId(active.id);
        const abs: any = await absencesService.findByInternship(active.id);
        setAbsences(Array.isArray(abs) ? abs : []);
      }
    } catch (err: any) {
      setPageError(err.message || t.studentAbsences.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim()) { setError(t.studentAbsences.reasonRequired); return; }
    setSaving(true);
    setError(null);
    try {
      await absencesService.create(form, file || undefined);
      setSuccess(t.studentAbsences.successMsg);
      setIsModalOpen(false);
      setForm({ date: new Date().toISOString().split("T")[0], reason: "", type: "ENFERMEDAD" });
      setFile(null);
      load();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || t.studentAbsences.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div 
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          data-tour="absences-header"
        >
          <div>
            <div className="flex items-center gap-2 text-[#003366] text-[10px] font-bold uppercase tracking-widest mb-4">
              <CalendarOff size={12} /> {t.studentAbsences.myAbsences}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight">{t.studentAbsences.title}</h1>
            <p className="text-slate-500 mt-1">{t.studentAbsences.subtitle}</p>
          </div>
          {internshipId && (
            <button onClick={() => setIsModalOpen(true)}
              className="flex w-full sm:w-auto items-center justify-center gap-2 bg-[#003366] text-white px-6 py-3.5 sm:py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all shrink-0">
              <Plus size={16} /> {t.studentAbsences.registerAbsence}
            </button>
          )}
        </div>

        {pageError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-bold shadow-sm animate-fade-in">
            <AlertCircle size={18} className="text-red-600 animate-bounce" />
            <span>{pageError}</span>
            <button onClick={load} className="ml-auto underline hover:text-red-900 transition-colors uppercase tracking-widest text-[10px] font-black">
              {t.studentAbsences.retry}
            </button>
          </div>
        )}

        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm font-bold">
              <CheckCircle2 size={18} /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#003366] animate-spin" />
          </div>
        ) : !internshipId ? (
          <div className="text-center py-20 text-slate-400">
            <CalendarOff size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold">{t.studentAbsences.noActiveInternship}</p>
          </div>
        ) : absences.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold">{t.studentAbsences.noRegisteredAbsences}</p>
            <p className="text-sm mt-1">{t.studentAbsences.canRegisterAbsenceDesc}</p>
          </div>
        ) : (
          <div className="space-y-4" data-tour="absences-list">
            {absences.map(ab => {
              const badge = statusBadge[ab.status] || statusBadge.PENDIENTE;
              return (
                <motion.div key={ab.id} layout
                  className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 mt-0.5">
                        <CalendarOff size={22} className={
                          ab.status === "APROBADA" ? "text-green-600" : ab.status === "RECHAZADA" ? "text-red-500" : "text-amber-600"
                        } />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-black text-[#003366]">
                            {new Date(ab.date).toLocaleDateString(locale === "es" ? "es-EC" : "en-US", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                          </p>
                          <span className={cn("flex items-center gap-1 text-[10px] font-black uppercase tracking-widest", badge.class)}>
                            {badge.icon} {badge.text}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{ab.reason}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {locale === "es" ? "Tipo:" : "Type:"} {ABSENCE_TYPES.find(t => t.value === ab.type)?.label ?? ab.type}
                        </p>
                        {ab.reviewNotes && (
                          <p className="text-xs text-slate-500 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="font-bold">{t.studentAbsences.tutorNote}</span> {ab.reviewNotes}
                          </p>
                        )}
                        {ab.reviewedBy && (
                          <p className="text-xs text-slate-400 mt-1">
                            {t.studentAbsences.reviewedBy} {ab.reviewedBy.fullName}
                          </p>
                        )}
                      </div>
                    </div>
                    {ab.filePath && (
                      <a href={ab.filePath} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] font-black uppercase tracking-widest text-[#003366] hover:text-[#C5A059] transition-colors flex-shrink-0">
                        {t.studentAbsences.viewDoc}
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de registro */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-[#003366]">{t.studentAbsences.registerAbsence}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
                    <X size={18} />
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold mb-4">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.studentAbsences.dateLabel}</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input type="date" required
                          value={form.date}
                          onChange={e => setForm({ ...form, date: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 text-sm outline-none focus:border-[#003366]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.studentAbsences.typeLabel}</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#003366] appearance-none">
                      {ABSENCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.studentAbsences.reasonLabel}</label>
                    <textarea required rows={3} value={form.reason}
                      onChange={e => setForm({ ...form, reason: e.target.value })}
                      placeholder={t.studentAbsences.reasonPlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#003366] resize-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.studentAbsences.supportingDocLabel}</label>
                    <div className={cn(
                      "relative border-2 border-dashed rounded-xl p-4 transition-colors cursor-pointer",
                      file ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50 hover:border-[#003366]/20"
                    )}>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                          file ? "bg-green-600 text-white" : "bg-white text-slate-400 shadow-sm")}>
                          {file ? <CheckCircle2 size={16} /> : <FileUp size={16} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#003366] truncate">{file ? file.name : t.studentAbsences.uploadCertHint}</p>
                          <p className="text-[10px] text-slate-400">{t.studentAbsences.uploadCertFormats}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving}
                      className="flex-1 bg-[#003366] text-white rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {t.studentAbsences.registerAbsence}
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)}
                      className="px-6 border-2 border-slate-200 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                      {t.studentAbsences.cancel}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
