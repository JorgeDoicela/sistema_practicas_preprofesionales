"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { announcementsService, Announcement } from "@/services/announcements.service";
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
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await announcementsService.update(id, { isActive: !current });
      setAnnouncements(announcements.map(a => a.id === id ? { ...a, isActive: !current } : a));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este anuncio?")) return;
    try {
      await announcementsService.remove(id);
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
              Comunicación Institucional
            </span>
            <h2 className="text-4xl font-black text-[#003366] tracking-tight">
              Gestor de <span className="text-slate-400">Anuncios</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              Difunde noticias, alertas y éxitos a toda la comunidad estudiantil.
            </p>
          </div>
          <button 
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#003366] text-white rounded-2xl shadow-lg hover:shadow-[#003366]/20 transition-all text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            Nuevo Anuncio
          </button>
        </section>

        <AnimatePresence>
          {creating && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-10 border-2 border-dashed border-slate-200 shadow-xl"
            >
               <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight mb-8">Crear Comunicación</h3>
               <div className="grid gap-6">
                   <div className="grid md:grid-cols-5 gap-6">
                      <div className="md:col-span-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Título del Anuncio</label>
                        <input 
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                          placeholder="Ej: Mantenimiento programado"
                          className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#003366] focus:ring-2 focus:ring-[#C5A059]"
                        />
                     </div>
                     <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Expiración (Opcional)</label>
                        <input 
                          type="date"
                          value={newEndDate}
                          onChange={e => setNewEndDate(e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#003366] focus:ring-2 focus:ring-[#C5A059]"
                        />
                     </div>
                  </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tipo de Aviso</label>
                      <div className="flex flex-wrap gap-2">
                         {['INFO', 'SUCCESS', 'WARNING', 'DANGER'].map(t => (
                            <button
                               key={t}
                               type="button"
                               onClick={() => setNewType(t as any)}
                               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                  newType === t 
                                  ? 'bg-[#003366] text-white shadow-lg' 
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                               }`}
                            >
                               {t}
                            </button>
                         ))}
                      </div>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Contenido</label>
                      <textarea 
                         value={newContent}
                         onChange={e => setNewContent(e.target.value)}
                         rows={4}
                         placeholder="Escribe aquí el mensaje detallado..."
                         className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#003366] focus:ring-2 focus:ring-[#C5A059]"
                      />
                   </div>
                  <div className="flex justify-end gap-3 mt-4">
                     <button onClick={() => setCreating(false)} className="px-6 py-3 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancelar</button>
                     <button onClick={handleCreate} className="px-10 py-3 bg-[#C5A059] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-gold/20">Publicar Anuncio</button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6">
          {loading && announcements.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
               <Loader2 className="w-10 h-10 animate-spin text-[#003366]" />
               <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando comunicados…</span>
            </div>
          ) : (
            announcements.map((a) => (
              <div 
                key={a.id} 
                className={`bg-white rounded-3xl p-8 border border-slate-100 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 ${!a.isActive && 'opacity-60 grayscale'}`}
              >
                <div className="flex items-start gap-6">
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
                            Publicado: {new Date(a.createdAt).toLocaleDateString()}
                         </span>
                          {a.endDate && (
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-rose-400 uppercase tracking-widest">
                               <RefreshCcw className="w-3 h-3" />
                               Expira: {new Date(a.endDate).toLocaleDateString()}
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
                     title={a.isActive ? "Desactivar" : "Activar"}
                   >
                      {a.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                   </button>
                   <button 
                     onClick={() => handleDelete(a.id)}
                     className="p-3 text-rose-400 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all"
                     title="Eliminar"
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
