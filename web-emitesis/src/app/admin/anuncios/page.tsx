"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { announcementsService, Announcement } from "@/services/announcements.service";
import { useLanguage } from "@/providers/LanguageProvider";
import { toast } from "sonner";
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Clock, 
  Info,
  Loader2,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminAnnouncementsPage() {
  const { t } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<Announcement['type']>("INFO");
  const [newEndDate, setNewEndDate] = useState("");

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      setLoading(true);
      const res: any = await announcementsService.findAll();
      const data = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
      toast.error(t.common.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newTitle || !newContent) return;
    try {
      const res = await announcementsService.create({
        title: newTitle,
        content: newContent,
        type: newType,
        endDate: newEndDate || undefined,
      });
      setAnnouncements([res, ...announcements]);
      setCreating(false);
      setNewTitle("");
      setNewContent("");
      setNewEndDate("");
      toast.success(t.admin.announcements.successCreated);
    } catch (err) {
      console.error(err);
      toast.error(t.admin.announcements.errorCreated);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await announcementsService.update(id, { isActive: !current });
      setAnnouncements(announcements.map(a => a.id === id ? { ...a, isActive: !current } : a));
      toast.success(t.admin.announcements.successUpdated);
    } catch (err) {
      console.error(err);
      toast.error(t.admin.announcements.errorUpdated);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t.admin.announcements.confirmDelete)) return;
    try {
      await announcementsService.remove(id);
      setAnnouncements(announcements.filter(a => a.id !== id));
      toast.success(t.admin.announcements.successDeleted);
    } catch (err) {
      console.error(err);
      toast.error(t.admin.announcements.errorDeleted);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
              {t.admin.announcements.communication}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">
              {t.admin.announcements.title}
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              {t.admin.announcements.subtitle}
            </p>
          </div>
          <button 
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#003366] text-white rounded-2xl shadow-lg hover:shadow-[#003366]/20 transition-all text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            {t.admin.announcements.newBtn}
          </button>
        </section>

        <AnimatePresence>
          {creating && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-10 border-2 border-dashed border-slate-200 shadow-xl"
            >
               <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight mb-8">{t.admin.announcements.createTitle}</h3>
               <div className="grid gap-6">
                   <div className="grid md:grid-cols-5 gap-6">
                      <div className="md:col-span-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t.admin.announcements.titleLabel}</label>
                        <input 
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                          placeholder={t.admin.announcements.titlePlaceholder}
                          className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#003366] focus:ring-2 focus:ring-[#C5A059]"
                        />
                     </div>
                     <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t.admin.announcements.expirationLabel}</label>
                        <input 
                          type="date"
                          value={newEndDate}
                          onChange={e => setNewEndDate(e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#003366] focus:ring-2 focus:ring-[#C5A059]"
                        />
                     </div>
                  </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t.admin.announcements.typeLabel}</label>
                      <div className="flex flex-wrap gap-2">
                         {['INFO', 'SUCCESS', 'WARNING', 'DANGER'].map(tType => (
                            <button
                               key={tType}
                               type="button"
                               onClick={() => setNewType(tType as any)}
                               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                  newType === tType 
                                  ? 'bg-[#003366] text-white shadow-lg' 
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                               }`}
                            >
                               {tType}
                            </button>
                         ))}
                      </div>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t.admin.announcements.contentLabel}</label>
                      <textarea 
                         value={newContent}
                         onChange={e => setNewContent(e.target.value)}
                         rows={4}
                         placeholder={t.admin.announcements.contentPlaceholder}
                         className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#003366] focus:ring-2 focus:ring-[#C5A059]"
                      />
                   </div>
                  <div className="flex justify-end gap-3 mt-4">
                     <button onClick={() => setCreating(false)} className="px-6 py-3 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">{t.admin.announcements.cancel}</button>
                     <button onClick={handleCreate} className="px-10 py-3 bg-[#C5A059] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-gold/20">{t.admin.announcements.publish}</button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6" data-tour="anuncios-list">
          {loading && announcements.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
               <Loader2 className="w-10 h-10 animate-spin text-[#003366]" />
               <span className="text-[10px] font-black uppercase tracking-widest">{t.admin.announcements.syncing}</span>
            </div>
          ) : (
            announcements.map((a) => (
              <div 
                key={a.id} 
                className={`bg-white rounded-3xl p-4 md:p-8 border border-slate-100 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 ${!a.isActive && 'opacity-60 grayscale'}`}
              >
                <div className="flex items-start gap-3 md:gap-6">
                   <div className={`p-4 rounded-2xl ${
                     a.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                     a.type === 'WARNING' ? 'bg-amber-50 text-amber-600' :
                     a.type === 'DANGER' ? 'bg-rose-50 text-rose-600' :
                     'bg-blue-50 text-blue-600'
                   }`}>
                      <Megaphone className="w-6 h-6" />
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-[#003366] tracking-tight">{a.title}</h4>
                      <p className="text-sm font-medium text-slate-500 mt-1 max-w-xl">{a.content}</p>
                      <div className="flex items-center gap-4 mt-4">
                         <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            {t.admin.announcements.published} {new Date(a.createdAt).toLocaleDateString()}
                         </span>
                          {a.endDate && (
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-rose-400 uppercase tracking-widest">
                               <RefreshCcw className="w-3 h-3" />
                               {t.admin.announcements.expires} {new Date(a.endDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${
                            a.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                            a.type === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                            a.type === 'DANGER' ? 'bg-rose-100 text-rose-700' :
                            'bg-blue-100 text-blue-700'
                         }`}>
                            {a.type}
                         </span>
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => toggleActive(a.id, a.isActive)}
                     className={`p-3 rounded-xl transition-all ${a.isActive ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                     title={a.isActive ? t.admin.announcements.deactivate : t.admin.announcements.activate}
                   >
                      {a.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                   </button>
                   <button 
                     onClick={() => handleDelete(a.id)}
                     className="p-3 text-rose-400 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all"
                     title={t.admin.announcements.delete}
                   >
                      <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
