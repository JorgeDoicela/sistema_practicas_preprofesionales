"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, 
  ShieldAlert, 
  X, 
  ChevronRight,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DoubleConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  criticalActionLabel?: string;
}

export const DoubleConfirmationModal: React.FC<DoubleConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  criticalActionLabel = "Confirmar eliminación"
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const resetAndClose = () => {
    setStep(1);
    setLoading(false);
    onClose();
  };

  const handleNextStep = () => {
    setStep(2);
  };

  const handleFinalConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      resetAndClose();
    } catch (error) {
      console.error("Error in critical action:", error);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetAndClose}
          className="absolute inset-0 bg-[#001A33]/80 backdrop-blur-md" 
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden"
        >
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                step === 1 ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
              )}>
                {step === 1 ? <AlertTriangle className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
              </div>
              <button 
                onClick={resetAndClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <h3 className="text-2xl font-black text-[#003366] mb-3 tracking-tight">
              {step === 1 ? "¿Está seguro del procedimiento?" : "Atención: Acción Irreversible"}
            </h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              {step === 1 
                ? description 
                : "Usted está a punto de ejecutar un proceso que no se puede revertir una vez aceptado. ¿Desea continuar de todas formas?"
              }
            </p>

            <div className="flex flex-col gap-3">
              {step === 1 ? (
                <button
                  onClick={handleNextStep}
                  className="w-full py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2 group"
                >
                  Continuar proceso
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={handleFinalConfirm}
                  disabled={loading}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                  {criticalActionLabel}
                </button>
              )}
              
              <button
                onClick={resetAndClose}
                disabled={loading}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar y abortar
              </button>
            </div>
          </div>

          <div className="h-2 w-full bg-slate-100">
            <motion.div 
               initial={{ width: "50%" }}
               animate={{ width: step === 1 ? "50%" : "100%" }}
               className={cn("h-full transition-colors", step === 1 ? "bg-amber-500" : "bg-rose-600")}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
