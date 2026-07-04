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
import { settingsService } from "@/services/settings.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

export function DocumentTemplatesView() {
  const { t, locale } = useLanguage();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [blankFormats, setBlankFormats] = useState<string[]>([]);
  const [protectedFormats, setProtectedFormats] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isRequired, setIsRequired] = useState(true);
  const [isCertificateSlot, setIsCertificateSlot] = useState(false);
  const [blankFileKey, setBlankFileKey] = useState<string>("");
  const [careerId, setCareerId] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, formatsMeta, careerList] = await Promise.all([
        documentTemplatesService.findAll(true),
        documentTemplatesService.blankFormatsMeta(),
        settingsService.findAllCareers(),
      ]);
      setTemplates(Array.isArray(list) ? list : []);
      setBlankFormats(formatsMeta && Array.isArray(formatsMeta.keys) ? formatsMeta.keys : []);
      setProtectedFormats(formatsMeta && Array.isArray(formatsMeta.protectedKeys) ? formatsMeta.protectedKeys : []);
      setCareers(Array.isArray(careerList) ? careerList : []);
    } catch (error) {
      toast.error(t.templates.toasts.syncError);
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
    setCareerId("");
    setEditingTemplate(null);
    setShowForm(false);
  };

  const handleEdit = (templateEntity: DocumentTemplate) => {
    setEditingTemplate(templateEntity);
    setName(templateEntity.name);
    setSortOrder(templateEntity.sortOrder);
    setIsRequired(templateEntity.isRequired);
    setIsCertificateSlot(templateEntity.isCertificateSlot);
    setBlankFileKey(templateEntity.blankFileKey || "");
    setCareerId(templateEntity.careerId || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      name,
      sortOrder: Number(sortOrder),
      isRequired,
      isCertificateSlot,
      blankFileKey: blankFileKey || null,
      careerId: careerId || null,
      isActive: editingTemplate ? editingTemplate.isActive : true,
    };

    try {
      if (editingTemplate) {
        await documentTemplatesService.update(editingTemplate.id, payload);
        toast.success(t.templates.toasts.updateSuccess);
      } else {
        await documentTemplatesService.create(payload);
        toast.success(t.templates.toasts.createSuccess);
      }
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || t.templates.toasts.processError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (templateEntity: DocumentTemplate) => {
    try {
      await documentTemplatesService.update(templateEntity.id, { isActive: !templateEntity.isActive });
      toast.success(templateEntity.isActive ? t.templates.toasts.deactivateSuccess : t.templates.toasts.activateSuccess);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.templates.confirmDelete)) return;
    try {
      await documentTemplatesService.remove(id);
      toast.success(t.templates.toasts.deleteSuccess);
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
      toast.success(t.templates.toasts.uploadSuccess.replace("{key}", key));
      setBlankFileKey(key);
      const formatsMeta = await documentTemplatesService.blankFormatsMeta();
      setBlankFormats(formatsMeta && Array.isArray(formatsMeta.keys) ? formatsMeta.keys : []);
      setProtectedFormats(formatsMeta && Array.isArray(formatsMeta.protectedKeys) ? formatsMeta.protectedKeys : []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFormat = async () => {
    if (!blankFileKey) return;
    if (!confirm(t.templates.confirmDeleteFormat.replace("{key}", blankFileKey))) return;
    
    try {
      await documentTemplatesService.deleteBlankDocx(blankFileKey);
      toast.success(t.templates.toasts.deleteFormatSuccess);
      setBlankFileKey("");
      const formatsMeta = await documentTemplatesService.blankFormatsMeta();
      setBlankFormats(formatsMeta && Array.isArray(formatsMeta.keys) ? formatsMeta.keys : []);
      setProtectedFormats(formatsMeta && Array.isArray(formatsMeta.protectedKeys) ? formatsMeta.protectedKeys : []);
    } catch (error: any) {
      toast.error(error.message || t.templates.toasts.deleteFormatError);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.4em] mb-2 block">
            {t.templates.sub}
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-brand-blue tracking-tight">
            {t.templates.title.split(t.templates.titleTemplates)[0]}<span className="text-slate-400">{t.templates.titleTemplates}</span>{t.templates.title.split(t.templates.titleTemplates)[1] || ""}
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            {t.templates.desc}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          data-tour="templates-new"
          className="flex items-center gap-3 px-8 py-4 bg-brand-blue text-white rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-brand-blue/90 transition-all text-[11px] font-black uppercase tracking-widest active:scale-95"
        >
          <Plus className="w-5 h-5" /> {t.templates.newTemplateBtn}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main List */}
        <div className={cn("space-y-6 transition-all duration-500 ease-in-out", showForm ? "lg:col-span-2" : "lg:col-span-3")} data-tour="templates-list">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <motion.div
                key="loading-catalog"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4"
              >
                <Loader2 className="w-10 h-10 animate-spin text-brand-blue" />
                <p className="text-[10px] font-black uppercase tracking-widest">{t.templates.syncing}</p>
              </motion.div>
            ) : templates.length === 0 ? (
              <motion.div
                key="empty-catalog"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-xl"
              >
                 <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                 <p className="text-slate-500 font-medium">{t.templates.noTemplates}</p>
              </motion.div>
            ) : (
              templates.map((tpl) => (
                <motion.div
                  key={tpl.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`group relative bg-white p-8 rounded-[2.5rem] border ${tpl.isActive ? 'border-slate-100 shadow-xl shadow-slate-200/50' : 'border-slate-100 opacity-60 grayscale shadow-none'} transition-all`}
                >
                  <div className="flex items-start justify-between animate-fadeIn">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tpl.isCertificateSlot ? 'bg-brand-gold/10 text-brand-gold' : 'bg-brand-blue/10 text-brand-blue'}`}>
                        {tpl.isCertificateSlot ? <CheckCircle2 className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                            {t.templates.orderLabel.replace("{order}", String(tpl.sortOrder))}
                          </span>
                          {tpl.isRequired && (
                            <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                              {t.templates.requiredLabel}
                            </span>
                          )}
                          <span className={cn(
                            "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest",
                            tpl.careerId ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-500"
                          )}>
                            {tpl.careerId ? careers.find(c => c.id === tpl.careerId)?.name || (locale === 'es' ? 'Carrera Específica' : 'Specific Career') : t.templates.globalLabel}
                          </span>
                        </div>
                        <h4 className="text-xl font-black text-brand-blue tracking-tight">{tpl.name}</h4>
                        {tpl.blankFileKey && (
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                            <FileDown className="w-3 h-3" /> {t.templates.formatLabel.replace("{key}", tpl.blankFileKey)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(tpl)}
                        className={`p-3 rounded-2xl transition-all ${tpl.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-50'}`}
                        title={tpl.isActive ? t.templates.activeToggle.deactivate : t.templates.activeToggle.activate}
                      >
                         {tpl.isActive ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                      </button>
                      <button
                        onClick={() => handleEdit(tpl)}
                        className="p-3 text-slate-400 hover:text-brand-blue hover:bg-slate-50 rounded-2xl transition-all"
                      >
                         <Settings2 className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => handleDelete(tpl.id)}
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
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              data-tour="templates-form"
              className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 h-fit sticky top-10"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-brand-blue tracking-tight">
                  {editingTemplate ? t.templates.editTitle : t.templates.newTitle}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.templates.careerSelectLabel}</label>
                  <div className="relative">
                    <select
                      className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none focus:outline-none focus:ring-2 focus:ring-brand-blue/10 cursor-pointer"
                      value={careerId}
                      onChange={e => setCareerId(e.target.value)}
                    >
                      <option value="">{t.templates.careerGlobalOption}</option>
                      {careers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight className="w-5 h-5 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.templates.nameLabel}</label>
                  <input
                    type="text"
                    required
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
                    placeholder={t.templates.namePlaceholder}
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.templates.orderSecuential}</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="number"
                        required
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
                        value={sortOrder}
                        onChange={e => setSortOrder(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end pb-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRequired(!isRequired)}
                      className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${isRequired ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                    >
                      {isRequired ? t.templates.requiredLabel : t.templates.optionalLabel}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.templates.formatSelectLabel}</label>
                  <div className="grid grid-cols-4 gap-3">
                    <div className={cn(
                      "relative transition-all duration-300",
                      (blankFileKey && !protectedFormats.includes(blankFileKey)) ? "col-span-2" : "col-span-3"
                    )}>
                        <select
                          className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none focus:outline-none cursor-pointer"
                          value={blankFileKey}
                          onChange={e => setBlankFileKey(e.target.value)}
                        >
                          <option value="">{t.templates.noFormatOption}</option>
                          {blankFormats.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronRight className="w-5 h-5 rotate-90" />
                        </div>
                    </div>

                    {blankFileKey && !protectedFormats.includes(blankFileKey) && (
                      <button
                        type="button"
                        onClick={handleDeleteFormat}
                        className="col-span-1 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:bg-rose-100 border border-rose-100"
                        title={t.templates.deleteFormatTitle}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}

                    <label className="col-span-1 cursor-pointer bg-brand-gold text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-yellow-600/20">
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                      <input type="file" accept=".docx" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCertificateSlot(!isCertificateSlot)}
                      className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${isCertificateSlot ? 'bg-brand-gold text-white shadow-xl shadow-yellow-600/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                    >
                      {isCertificateSlot ? t.templates.certificateSlotTrue : t.templates.certificateSlotFalse}
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-brand-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-900/30 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> {t.templates.processing}
                        </>
                      ) : (
                        editingTemplate ? t.templates.saveChanges : t.templates.createTemplate
                      )}
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
