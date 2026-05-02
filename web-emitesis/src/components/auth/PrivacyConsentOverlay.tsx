"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  ExternalLink, 
  Check,
  ChevronRight,
  Info,
  Lock,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { privacyService } from "@/services/privacy.service";

interface PrivacyConsentOverlayProps {
  isOpen: boolean;
  onConsentAccepted: () => void;
}

export const PrivacyConsentOverlay: React.FC<PrivacyConsentOverlayProps> = ({
  isOpen,
  onConsentAccepted
}) => {
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [linkOpened, setLinkOpened] = useState(false);

  const handleAccept = async () => {
    if (!acceptedTerms || !linkOpened) return;
    
    setLoading(true);
    try {
      await privacyService.recordConsent(true, "1.0");
      // Actualizar el objeto user en localStorage para que la app sepa que ya aceptó
      const userStr = localStorage.getItem("user");
      if (userStr) {
          const user = JSON.parse(userStr);
          user.lopdpAccepted = true;
          localStorage.setItem("user", JSON.stringify(user));
      }
      onConsentAccepted();
    } catch (error) {
      console.error("Error accepting privacy policy:", error);
      alert("No se pudo registrar su consentimiento. Por favor intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 overflow-hidden">
        {/* Backdrop con desenfoque extremo para enfoque total */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#001A33]/90 backdrop-blur-2xl" 
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col md:flex-row h-full max-h-[850px]"
        >
          {/* Lado Izquierdo - Visual/Branding */}
          <div className="md:w-1/3 bg-[#003366] p-12 text-white flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C5A059]/10 rounded-full -ml-24 -mb-24 blur-2xl" />
             
             <div className="relative z-10">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 border border-white/10">
                   <ShieldCheck className="text-[#C5A059] w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-6 leading-tight">Su Privacidad es Nuestra Prioridad</h2>
                <p className="text-white/60 font-medium leading-relaxed">
                   En cumplimiento con la <span className="text-white font-bold">LOPDP de Ecuador</span>, hemos actualizado nuestras políticas para garantizarle un control total sobre su información personal.
                </p>
             </div>

             <div className="relative z-10 mt-20 md:mt-0">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                      <Lock className="w-5 h-5 text-[#C5A059]" />
                   </div>
                   <span className="text-xs font-black uppercase tracking-widest opacity-80">Segregación de Roles</span>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-emerald-400" />
                   </div>
                   <span className="text-xs font-black uppercase tracking-widest opacity-80">Auditoría Permanente</span>
                </div>
             </div>
          </div>

          {/* Lado Derecho - Contrato/Acción */}
          <div className="flex-1 p-10 md:p-16 flex flex-col justify-between overflow-y-auto">
             <div>
                <div className="flex items-center gap-3 mb-10">
                   <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Actualización LOPDP — Versión 2026</span>
                </div>

                <div className="space-y-8 mb-12">
                   <section>
                      <h4 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-3 flex items-center gap-2">
                         <Info className="w-4 h-4 text-[#C5A059]" />
                         ¿Qué datos tratamos y por qué?
                      </h4>
                      <p className="text-slate-500 text-sm leading-relaxed font-medium">
                         Tratamos sus datos identificativos, académicos y de ubicación geográfica únicamente para la gestión de sus prácticas preprofesionales y el registro de asistencia obligatoria según la normativa del <span className="text-[#003366] font-bold">ISTPET</span>.
                      </p>
                   </section>

                   <section className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                      <h4 className="text-[10px] font-black text-[#003366] uppercase tracking-widest mb-4">Sus Derechos Fundamentales (ARCO+)</h4>
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-1">
                            <span className="text-[9px] font-black text-[#C5A059] uppercase">Derecho de Acceso</span>
                            <p className="text-[11px] text-slate-500 font-bold">Descargue su expediente completo en cualquier momento.</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[9px] font-black text-[#C5A059] uppercase">Derecho de Portabilidad</span>
                            <p className="text-[11px] text-slate-500 font-bold">Transfiera sus registros de pasantías de forma segura.</p>
                         </div>
                      </div>
                   </section>
                </div>
             </div>

             <div className="space-y-8">
                <div className={cn(
                    "flex flex-col gap-2 p-6 rounded-2xl border transition-all",
                    linkOpened ? "bg-blue-50/50 border-blue-100" : "bg-slate-50 border-slate-200 opacity-60"
                )}>
                    <label className={cn(
                        "flex items-start gap-4 cursor-pointer group",
                        !linkOpened && "cursor-not-allowed"
                    )}>
                    <div className="relative mt-1">
                        <input 
                            type="checkbox" 
                            checked={acceptedTerms}
                            disabled={!linkOpened}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="peer hidden" 
                        />
                        <div className="w-6 h-6 border-2 border-[#003366]/20 rounded-lg flex items-center justify-center transition-all peer-checked:bg-[#003366] peer-checked:border-[#003366]">
                            <Check className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-[#003366] leading-relaxed">
                            He leído y acepto expresamente el <Link onClick={() => setLinkOpened(true)} href="/privacidad" target="_blank" className="underline decoration-2 underline-offset-4 hover:text-[#C5A059]">Aviso de Privacidad</Link> y el tratamiento de mis datos personales según la ley ecuatoriana.
                        </p>
                        {!linkOpened && (
                            <p className="text-[9px] font-black text-red-500 uppercase mt-2 animate-pulse">
                                * Debe abrir el link de política antes de aceptar
                            </p>
                        )}
                    </div>
                    </label>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                   <button
                     onClick={handleAccept}
                     disabled={!acceptedTerms || !linkOpened || loading}
                     className={cn(
                        "flex-1 h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl",
                        acceptedTerms && linkOpened && !loading 
                           ? "bg-[#003366] text-white hover:bg-[#003366]/90 shadow-blue-900/10 active:scale-[0.98]" 
                           : "bg-slate-200 text-slate-400 cursor-not-allowed"
                     )}
                   >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                      Confirmar y Entrar al Sistema
                   </button>
                   
                   <Link 
                     onClick={() => setLinkOpened(true)}
                     href="/privacidad" 
                     target="_blank"
                     className="px-8 h-16 rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-[0.98]"
                   >
                      Ver Política Full
                      <ExternalLink className="w-4 h-4" />
                   </Link>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
