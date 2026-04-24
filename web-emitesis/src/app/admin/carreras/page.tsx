"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Plus, Edit, Trash2, Loader2, X, AlertCircle,
  CheckCircle2, BookOpen, Clock, Layers, Users, Briefcase,
} from "lucide-react";
import { careersService, Career } from "@/services/careers.service";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";


export default function CarrerasAdminPage() {
  const { t } = useLanguage();
  
  const MODALIDADES = [
    { value: "PRESENCIAL", label: t.common.modalities.PRESENCIAL },
    { value: "SEMIPRESENCIAL", label: t.common.modalities.SEMIPRESENCIAL },
    { value: "EN_LINEA", label: t.common.modalities.EN_LINEA },
    { value: "HIBRIDA", label: t.common.modalities.HIBRIDA },
  ];
  // Wait, MODALIDADES was outside. I'll move it inside or use a function.
  // Actually, I should probably add modalities to translation files too.
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    faculty: "",
    modalidad: "PRESENCIAL",
    requiredHours: 160,
  });

  const loadCareers = async () => {
    try {
      setLoading(true);
      const res: any = await careersService.findAll();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setCareers(list);
    } catch {
      setError(t.admin.careers.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCareers(); }, []);

  const openModal = (career: Career | null = null) => {
    setEditingCareer(career);
    setForm(career ? {
      name: career.name,
      faculty: career.faculty || "",
      modalidad: career.modalidad || "PRESENCIAL",
      requiredHours: career.config?.requiredHours ?? 160,
    } : { name: "", faculty: "", modalidad: "PRESENCIAL", requiredHours: 160 });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingCareer) {
        await careersService.update(editingCareer.id, form);
        setSuccess(t.admin.careers.updateSuccess);
      } else {
        await careersService.create(form);
        setSuccess(t.admin.careers.createSuccess);
      }
      setIsModalOpen(false);
      loadCareers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.admin.careers.deleteConfirm)) return;
    setDeleting(id);
    try {
      await careersService.remove(id);
      setSuccess(t.admin.careers.deleteSuccess);
      loadCareers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#003366]/5 text-[#003366] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#003366]/10">
              <GraduationCap size={12} /> {t.admin.careers.academicMgmt}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight">{t.admin.careers.title}</h1>
            <p className="text-slate-500 mt-1">{t.admin.careers.subtitle}</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 bg-[#003366] text-white px-6 py-3.5 sm:py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all shrink-0"
          >
            <Plus size={16} /> {t.admin.careers.newCareer}
          </button>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm font-bold">
              <CheckCircle2 size={18} /> {success}
            </motion.div>
          )}
          {error && !isModalOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold">
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Careers Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#003366] animate-spin" />
          </div>
        ) : careers.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold">{t.admin.careers.noCareers}</p>
            <p className="text-sm mt-1">{t.admin.careers.createFirst}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {careers.map((career) => (
              <motion.div key={career.id} layout
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#003366] text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <GraduationCap size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-[#003366] truncate">{career.name}</h3>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">
                      <Layers size={12} className="text-[#C5A059]" />
                      {career.faculty || t.admin.careers.noFaculty}
                    </div>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => openModal(career)}
                      title={t.common.edit}
                      className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 transition-all">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(career.id)} disabled={deleting === career.id}
                      title={t.common.delete}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-50 transition-all disabled:opacity-40">
                      {deleting === career.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.admin.careers.modality}</span>
                    <span className="text-xs font-bold text-[#003366] uppercase">{t.common.modalities[career.modalidad as keyof typeof t.common.modalities] || career.modalidad}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.admin.careers.hours}</span>
                    <span className="text-xs font-bold text-[#003366]">{career.config?.requiredHours || 0}h</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users size={13} className="text-[#C5A059]" />
                    <span>{career._count?.users ?? 0} {t.admin.careers.users}</span>
                    <Briefcase size={13} className="text-[#C5A059] ml-2" />
                    <span>{career._count?.internships ?? 0} {t.admin.careers.internships}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-5 sm:p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-[#003366]">
                    {editingCareer ? t.admin.careers.editCareer : t.admin.careers.newCareer}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
                    <X size={18} />
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold mb-4">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <form onSubmit={handleSave} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.careers.name}</label>
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Ej: Desarrollo de Software"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#003366]" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.careers.faculty}</label>
                    <input value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })}
                      placeholder="Ej: TIC, Administración"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#003366]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.careers.modality}</label>
                      <select value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#003366] appearance-none">
                        {MODALIDADES.map(m => <option key={m.value} value={m.value}>{t.common.modalities[m.value as keyof typeof t.common.modalities] || m.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.careers.hours}</label>
                      <input type="number" min={1} max={2000} required
                        value={form.requiredHours}
                        onChange={e => setForm({ ...form, requiredHours: parseInt(e.target.value) || 160 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#003366]" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving}
                      className="flex-1 bg-[#003366] text-white rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {editingCareer ? t.admin.users.saveChanges : t.admin.careers.newCareer}
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)}
                      className="px-6 border-2 border-slate-200 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                      {t.common.cancel}
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
