"use client";

/**
 * RF-19: Confirmación Doble para Eliminación.
 *
 * Muestra DOS pasos de confirmación antes de ejecutar una acción destructiva:
 *  - Paso 1: "¿Estás seguro?"
 *  - Paso 2: "Esta acción es IRREVERSIBLE"
 *
 * Uso:
 *   <DoubleConfirmModal
 *     isOpen={open}
 *     onClose={() => setOpen(false)}
 *     onConfirm={handleDelete}
 *     title="Eliminar usuario"
 *     description="Se eliminará el usuario Juan Pérez y todos sus datos asociados."
 *     confirmLabel="Eliminar definitivamente"
 *     loading={deleting}
 *   />
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DoubleConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  /** Texto del elemento a eliminar (nombre, ID, etc.) */
  itemLabel?: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function DoubleConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Eliminar registro",
  description,
  itemLabel,
  confirmLabel = "Sí, eliminar",
  loading = false,
}: DoubleConfirmModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [executing, setExecuting] = useState(false);

  // Resetear al abrir
  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  const handleFirstConfirm = () => setStep(2);

  const handleFinalConfirm = async () => {
    setExecuting(true);
    try {
      await onConfirm();
    } finally {
      setExecuting(false);
    }
  };

  const isLoading = loading || executing;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* ── PASO 1: Primera confirmación ──────────────────────────── */}
            {step === 1 && (
              <>
                <div className="bg-amber-50 border-b border-amber-100 p-6 flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1">Confirmación requerida</p>
                    <h3 className="text-lg font-black text-amber-900">{title}</h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-500 hover:text-amber-700 hover:bg-amber-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {itemLabel && (
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <Trash2 className="w-5 h-5 text-slate-400 shrink-0" />
                      <p className="text-sm font-bold text-[#003366] truncate">{itemLabel}</p>
                    </div>
                  )}

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {description || "¿Estás seguro de que deseas eliminar este registro?"}
                  </p>

                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-amber-700">
                      Se te pedirá una segunda confirmación antes de proceder.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 border-2 border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleFirstConfirm}
                      className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── PASO 2: Segunda confirmación (irreversible) ───────────── */}
            {step === 2 && (
              <>
                <div className="bg-rose-600 p-6 flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-rose-200 uppercase tracking-[0.3em] mb-1">Acción Irreversible</p>
                    <h3 className="text-lg font-black text-white">Confirmación Final</h3>
                  </div>
                  <button
                    onClick={() => !isLoading && onClose()}
                    disabled={isLoading}
                    className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/30 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 space-y-3">
                    <p className="text-sm font-black text-rose-800 text-center">
                      ¿Confirmas que deseas eliminar este registro?
                    </p>
                    {itemLabel && (
                      <div className="bg-white border border-rose-200 rounded-xl p-3 text-center">
                        <p className="text-xs font-black text-rose-700 truncate">{itemLabel}</p>
                      </div>
                    )}
                  </div>

                  <div className={cn(
                    "rounded-2xl p-4 flex items-start gap-3",
                    "bg-rose-50 border border-rose-200"
                  )}>
                    <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-rose-700 uppercase tracking-wider">
                        Este proceso es IRREVERSIBLE
                      </p>
                      <p className="text-[11px] text-rose-600">
                        Una vez eliminado, no podrá recuperarse el registro ni sus datos asociados.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                      className="flex-1 py-3 border-2 border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      ← Volver
                    </button>
                    <button
                      onClick={handleFinalConfirm}
                      disabled={isLoading}
                      className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando...</>
                        : <><Trash2 className="w-4 h-4" /> {confirmLabel}</>
                      }
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook auxiliar para manejar el estado del modal de doble confirmación.
 *
 * Uso:
 *   const { modalProps, openFor } = useDoubleConfirm();
 *   <button onClick={() => openFor(user.id, user.fullName)}>Eliminar</button>
 *   <DoubleConfirmModal {...modalProps} onConfirm={() => deleteUser(pendingId)} />
 */
export function useDoubleConfirm<T = string>() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<T | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string>("");

  const openFor = (item: T, label?: string) => {
    setPendingItem(item);
    setPendingLabel(label ?? String(item));
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setPendingItem(null);
    setPendingLabel("");
  };

  return {
    isOpen,
    pendingItem,
    pendingLabel,
    openFor,
    close,
    modalProps: {
      isOpen,
      onClose: close,
      itemLabel: pendingLabel,
    },
  };
}
