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

const MODALIDADES = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "SEMIPRESENCIAL", label: "Semipresencial" },
  { value: "EN_LINEA", label: "En Línea" },
  { value: "HIBRIDA", label: "Híbrida" },
];

export default function CarrerasAdminPage() {
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
      setError("Error al cargar las carreras");
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
        setSuccess("Carrera actualizada correctamente");
      } else {
        await careersService.create(form);
        setSuccess("Carrera creada correctamente");
      }
      setIsModalOpen(false);
      loadCareers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta carrera? Solo es posible si no tiene prácticas asociadas.")) return;
    setDeleting(id);
    try {
      await careersService.remove(id);
      setSuccess("Carrera eliminada");
      loadCareers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "No se puede eliminar");
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
              <GraduationCap size={12} /> Gestión Académica
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight">Carreras / Programas</h1>
            <p className="text-slate-500 mt-1">Administra las carreras del instituto y sus configuraciones.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 bg-[#003366] text-white px-6 py-3.5 sm:py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all shrink-0"
          >
            <Plus size={16} /> Nueva Carrera
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
            <p className="font-bold">No hay carreras registradas</p>
            <p className="text-sm mt-1">Crea la primera carrera para comenzar.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {careers.map((career) => (
              <motion.div key={career.id} layout
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#003366]/5 flex items-center justify-center">
                    <GraduationCap size={22} className="text-[#003366]" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(career)}
                      className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 transition-all">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(career.id)} disabled={deleting === career.id}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-50 transition-all disabled:opacity-40">
                      {deleting === career.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>

                <h3 className="font-black text-[#003366] text-base leading-tight mb-1">{career.name}</h3>
                {career.faculty && <p className="text-xs text-slate-400 mb-3">{career.faculty}</p>}

                <div className="space-y-2 mt-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={13} className="text-[#C5A059]" />
                    <span>{career.config?.requiredHours ?? 160} horas requeridas</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Layers size={13} className="text-[#C5A059]" />
                    <span>{MODALIDADES.find(m => m.value === career.modalidad)?.label ?? career.modalidad}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users size={13} className="text-[#C5A059]" />
                    <span>{career._count?.users ?? 0} usuarios</span>
                    <Briefcase size={13} className="text-[#C5A059] ml-2" />
                    <span>{career._count?.internships ?? 0} prácticas</span>
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
                    {editingCareer ? "Editar Carrera" : "Nueva Carrera"}
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre de la Carrera *</label>
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Ej: Desarrollo de Software"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#003366]" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Facultad / Departamento</label>
                    <input value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })}
                      placeholder="Ej: TIC, Administración"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#003366]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modalidad</label>
                      <select value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#003366] appearance-none">
                        {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Horas Requeridas</label>
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
                      {editingCareer ? "Guardar Cambios" : "Crear Carrera"}
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)}
                      className="px-6 border-2 border-slate-200 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                      Cancelar
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
