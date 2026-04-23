"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { settingsService, SystemSetting } from "@/services/settings.service";
import { 
  Settings, 
  MapPin, 
  Mail, 
  ShieldCheck, 
  Save, 
  Loader2, 
  RefreshCcw,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await settingsService.findAll();
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(key: string, value: string) {
    try {
      setSaving(key);
      await settingsService.update(key, value);
      setMessage({ type: "success", text: `Configuración ${key} actualizada con éxito.` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Error al actualizar la configuración." });
    } finally {
      setSaving(null);
    }
  }

  const sections = [
    { id: "GPS", title: "Asistencia y GPS", icon: <MapPin className="w-5 h-5" /> },
    { id: "EMAIL", title: "Notificaciones por Correo", icon: <Mail className="w-5 h-5" /> },
    { id: "AUTH", title: "Seguridad y Autenticación", icon: <ShieldCheck className="w-5 h-5" /> },
    { id: "GENERAL", title: "General", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
              Configuración Avanzada
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">
              Parámetros del <span className="text-slate-400">Sistema</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              Ajusta los límites técnicos y comportamientos globales del sistema Emitesis.
            </p>
          </div>
          <button 
            onClick={loadSettings}
            className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-sm font-bold text-slate-600"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </section>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'} text-sm font-bold flex items-center gap-3`}
          >
            <CheckCircle2 className="w-5 h-5" />
            {message.text}
          </motion.div>
        )}

        {loading && settings.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
             <Loader2 className="w-10 h-10 animate-spin text-[#003366]" />
             <span className="text-[10px] font-black uppercase tracking-widest">Cargando parámetros…</span>
          </div>
        ) : (
          <div className="grid gap-6 md:gap-10">
            {sections.map(section => {
              const sectionSettings = settings.filter(s => s.category === section.id);
              if (sectionSettings.length === 0) return null;

              return (
                <div key={section.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
                  <div className="p-5 md:p-10 border-b border-slate-50 bg-slate-50/30">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#003366] text-white rounded-2xl">
                        {section.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight">{section.title}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gestión de recursos {section.id.toLowerCase()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 md:p-10 divide-y divide-slate-100">
                    {sectionSettings.map(setting => (
                      <div key={setting.id} className="py-5 md:py-8 first:pt-0 last:pb-0 grid md:grid-cols-3 gap-4 md:gap-8 items-center">
                        <div className="md:col-span-1">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">
                            {setting.key.replace(/_/g, " ")}
                          </label>
                          <p className="text-sm font-bold text-[#003366]">{setting.description || "Sin descripción disponible"}</p>
                        </div>
                        <div className="md:col-span-2 flex items-center gap-4">
                          <input 
                            type="text"
                            defaultValue={setting.value}
                            onBlur={(e) => {
                              if (e.target.value !== setting.value) {
                                handleUpdate(setting.key, e.target.value);
                              }
                            }}
                            className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#003366] focus:ring-2 focus:ring-[#C5A059] transition-all"
                          />
                          {saving === setting.key && (
                            <Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
