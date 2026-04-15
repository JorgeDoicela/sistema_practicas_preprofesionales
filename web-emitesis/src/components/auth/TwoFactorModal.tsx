"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, AlertCircle, Loader2 } from "lucide-react";

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (code: string) => Promise<void>;
  title?: string;
  description?: string;
}

export function TwoFactorModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Verificación de Seguridad",
  description = "Para completar esta operación crítica, ingresa el código de 6 dígitos de tu aplicación de autenticación.",
}: TwoFactorModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;

    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(code);
      setCode("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Código inválido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#003366] to-[#C5A059]" />
            
            <div className="p-8 md:p-10">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#003366] mb-6 shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-[#003366] tracking-tight mb-2">{title}</h2>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                  {description}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-2 text-center">Código de Seguridad</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="000000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-blue-900/5 outline-none font-bold tracking-[0.6em] text-center"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[11px] font-bold text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    type="submit"
                    disabled={isLoading || code.length < 6}
                    className="w-full bg-[#003366] text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:translate-y-0"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirmar Operación"}
                  </button>
                  <button 
                    type="button"
                    onClick={onClose}
                    className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#003366] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
