"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Settings2,
  Trash2,
  FileDown,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Hash,
  ToggleLeft,
  ToggleRight,
  MoreVertical,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { documentTemplatesService, DocumentTemplate } from "@/services/document-templates.service";
import { toast } from "sonner";

export function DocumentTemplatesView() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [blankFormats, setBlankFormats] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isRequired, setIsRequired] = useState(true);
  const [isCertificateSlot, setIsCertificateSlot] = useState(false);
  const [blankFileKey, setBlankFileKey] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, formats] = await Promise.all([
        documentTemplatesService.findAll(true),
        documentTemplatesService.knownFormatKeys(),
      ]);
      setTemplates(list);
      setBlankFormats(formats);
    } catch (error) {
      toast.error("Error al sincronizar plantillas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setName("");
    setSortOrder(templates.length + 1);
    setIsRequired(true);
    setIsCertificateSlot(false);
    setBlankFileKey("");
    setEditingTemplate(null);
    setShowForm(false);
  };

  const handleEdit = (t: DocumentTemplate) => {
    setEditingTemplate(t);
    setName(t.name);
    setSortOrder(t.sortOrder);
    setIsRequired(t.isRequired);
    setIsCertificateSlot(t.isCertificateSlot);
    setBlankFileKey(t.blankFileKey || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      sortOrder: Number(sortOrder),
      isRequired,
      isCertificateSlot,
      blankFileKey: blankFileKey || null,
      isActive: editingTemplate ? editingTemplate.isActive : true,
    };

    try {
      if (editingTemplate) {
        await documentTemplatesService.update(editingTemplate.id, payload);
        toast.success("Plantilla actualizada");
      } else {
        await documentTemplatesService.create(payload);
        toast.success("Nueva plantilla creada");
      }
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleActive = async (t: DocumentTemplate) => {
    try {
      await documentTemplatesService.update(t.id, { isActive: !t.isActive });
      toast.success(t.isActive ? "Plantilla desactivada" : "Plantilla activada");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta plantilla? Los expedientes existentes podrían verse afectados.")) return;
    try {
      await documentTemplatesService.remove(id);
      toast.success("Plantilla eliminada");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { key } = await documentTemplatesService.uploadBlankDocx(file);
      toast.success("Formato subido: " + key);
      setBlankFileKey(key);
      const updatedFormats = await documentTemplatesService.knownFormatKeys();
      setBlankFormats(updatedFormats);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.4em] mb-2 block">
            Configuración Estructural
          </span>
          <h2 className="text-4xl font-black text-brand-blue tracking-tight">
            Gestión de <span className="text-slate-400">Plantillas</span>
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            Define los pasos y documentos obligatorios para el expediente de pasantías.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-3 px-8 py-4 bg-brand-blue text-white rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-brand-blue/90 transition-all text-[11px] font-black uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" /> Nueva Plantilla
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-blue" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando catálogo...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-xl">
                 <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                 <p className="text-slate-500 font-medium">No hay plantillas configuradas aún.</p>
              </div>
            ) : (
              templates.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group relative bg-white p-8 rounded-[2.5rem] border ${t.isActive ? 'border-slate-100 shadow-xl shadow-slate-200/50' : 'border-slate-100 opacity-60 grayscale shadow-none'} transition-all`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${t.isCertificateSlot ? 'bg-brand-gold/10 text-brand-gold' : 'bg-brand-blue/10 text-brand-blue'}`}>
                        {t.isCertificateSlot ? <CheckCircle2 className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                            Orden {t.sortOrder}
                          </span>
                          {t.isRequired && (
                            <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                              Obligatorio
                            </span>
                          )}
                        </div>
                        <h4 className="text-xl font-black text-brand-blue tracking-tight">{t.name}</h4>
                        {t.blankFileKey && (
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                            <FileDown className="w-3 h-3" /> Formato: {t.blankFileKey}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(t)}
                        className={`p-3 rounded-2xl transition-all ${t.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-50'}`}
                        title={t.isActive ? 'Desactivar' : 'Activar'}
                      >
                         {t.isActive ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                      </button>
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-3 text-slate-400 hover:text-brand-blue hover:bg-slate-50 rounded-2xl transition-all"
                      >
                         <Settings2 className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                      >
                         <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Form Overlay/Sidebar */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 h-fit sticky top-10"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-brand-blue tracking-tight">
                  {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre descriptivo</label>
                  <input
                    type="text"
                    required
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
                    placeholder="Ej: F01 - Solicitud de prácticas"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Orden secuencial</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="number"
                        required
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black"
                        value={sortOrder}
                        onChange={e => setSortOrder(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end pb-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRequired(!isRequired)}
                      className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${isRequired ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                    >
                      {isRequired ? 'Es Obligatorio' : 'Es Opcional'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Formato Institucional (.docx)</label>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-3">
                        <select
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none focus:outline-none"
                          value={blankFileKey}
                          onChange={e => setBlankFileKey(e.target.value)}
                        >
                          <option value="">SIN FORMATO</option>
                          {blankFormats.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                    </div>
                    <label className="cursor-pointer bg-brand-gold text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-yellow-600/20">
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                      <input type="file" accept=".docx" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium px-4">Si subes un formato, el estudiante podrá descargarlo para completarlo.</p>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCertificateSlot(!isCertificateSlot)}
                      className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${isCertificateSlot ? 'bg-brand-gold text-white shadow-xl shadow-yellow-600/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                    >
                      {isCertificateSlot ? 'Marcar como Slot de Certificado' : 'Es documento normal'}
                    </button>
                    
                    <button
                      type="submit"
                      className="w-full py-4 bg-brand-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-900/30 hover:scale-[1.02] transition-all"
                    >
                      {editingTemplate ? 'Guardar Cambios' : 'Crear Plantilla'}
                    </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
