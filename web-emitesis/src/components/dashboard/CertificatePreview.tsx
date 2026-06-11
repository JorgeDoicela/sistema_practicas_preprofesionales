"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Award, Printer, Download, CheckCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CertificatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  internship: any;
}

export function CertificatePreview({ isOpen, onClose, internship }: CertificatePreviewProps) {
  if (!internship) return null;

  const today = new Date().toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#003366]/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Sidebar de acciones */}
            <div className="w-full md:w-64 bg-slate-50 p-8 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col">
              <div className="flex-1">
                <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-6">Certificado Digial</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">
                  Este documento certifica legalmente el cumplimiento de las {internship.totalHours} horas de prácticas preprofesionales.
                </p>
                
                <div className="space-y-3">
                   <button 
                     onClick={() => window.print()}
                     className="w-full py-4 bg-[#003366] text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#004488] transition-all"
                   >
                     <Printer className="w-4 h-4" /> Imprimir
                   </button>
                   <button className="w-full py-4 border border-slate-200 text-slate-600 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                     <Download className="w-4 h-4" /> Descargar PDF
                   </button>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Validado por ISTPET</span>
                </div>
                <p className="text-[9px] font-medium text-slate-400">ID: {internship.id.substring(0,8).toUpperCase()}</p>
              </div>
            </div>

            {/* Visualización del Certificado */}
            <div className="flex-1 p-8 md:p-16 overflow-y-auto bg-slate-100/30 flex items-center justify-center">
              <div className="w-full aspect-[1.414/1] bg-white shadow-2xl rounded-sm p-12 border-[12px] border-double border-[#C5A059] relative flex flex-col items-center text-center print:shadow-none print:border-none">
                
                {/* Marcas de agua y logos */}
                <div className="absolute top-8 left-8 text-left opacity-20">
                   <Award className="w-16 h-16 text-[#C5A059]" />
                </div>
                
                <h1 className="text-2xl font-black text-[#003366] uppercase tracking-[0.3em] mb-2 mt-8">
                  INSTITUTO SUPERIOR TECNOLÓGICO PET
                </h1>
                <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest mb-12 border-b border-[#C5A059] pb-4 px-10">
                  Departamento de Prácticas Preprofesionales
                </p>

                <p className="text-lg font-serif italic text-slate-600 mb-8">Otorga el presente certificado a:</p>
                
                <h2 className="text-4xl font-black text-[#003366] mb-8 tracking-tight">
                  {internship.student?.fullName}
                </h2>

                <p className="max-w-xl text-sm leading-relaxed text-slate-600 mb-10">
                  Por haber cumplido satisfactoriamente con el programa de prácticas preprofesionales en 
                  la institución <strong className="text-[#003366]">{internship.company?.name}</strong>, 
                  completando un total de <strong className="text-[#003366] text-lg">{internship.totalHours} horas</strong> cronológicas
                  bajo la supervisión institucional de la empresa receptora y el acompañamiento del tutor académico.
                </p>

                <div className="grid grid-cols-2 gap-20 mt-12 w-full max-w-lg">
                  <div className="border-t border-slate-300 pt-4">
                     <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest">Empresa Receptora</p>
                     <p className="text-[9px] text-slate-400">{internship.company?.name}</p>
                  </div>
                  <div className="border-t border-slate-300 pt-4">
                     <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest">Tutor Académico</p>
                     <p className="text-[9px] text-slate-400">ISTPET</p>
                  </div>
                </div>

                <div className="mt-12">
                   <p className="text-[10px] font-medium text-slate-400 italic">Emitido en Quito, el {today}</p>
                </div>

                <div className="absolute bottom-8 right-8">
                   <div className="w-12 h-12 border border-[#C5A059] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-[#C5A059]" />
                   </div>
                </div>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white/50 hover:bg-white text-slate-500 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
