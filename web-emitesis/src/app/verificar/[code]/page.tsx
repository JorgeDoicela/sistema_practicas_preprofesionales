"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, GraduationCap, Building2, Clock, Calendar, User, ShieldCheck } from "lucide-react";
import { api } from "@/services/auth.service";
import { motion } from "framer-motion";

interface VerifyResult {
  valid: boolean;
  verificationCode: string;
  student: string;
  cedula?: string;
  company: string;
  tutor: string;
  totalHours: number;
  startDate: string;
  endDate?: string;
  issuedAt: string;
  certificateUrl?: string;
}

export default function VerificarCertificadoPage() {
  const { code } = useParams<{ code: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    api.get(`/certification/verify/${code}`)
      .then((res: any) => setResult(res))
      .catch(() => setError("Certificado no encontrado o código inválido"))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-[#003366] flex items-center justify-center mx-auto mb-4 shadow-xl">
            <ShieldCheck size={32} className="text-[#C5A059]" />
          </div>
          <h1 className="text-2xl font-black text-[#003366]">Verificación de Certificado</h1>
          <p className="text-slate-500 text-sm mt-1">Sistema de Prácticas Preprofesionales</p>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 text-center shadow-sm border border-slate-100">
            <Loader2 className="w-10 h-10 text-[#003366] animate-spin mx-auto mb-3" />
            <p className="text-slate-500 font-bold text-sm">Verificando autenticidad...</p>
          </div>
        )}

        {!loading && error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-red-100 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle size={36} className="text-red-500" />
            </div>
            <h2 className="text-xl font-black text-red-700 mb-2">Certificado Inválido</h2>
            <p className="text-red-500 text-sm">{error}</p>
            <p className="text-slate-400 text-xs mt-4">Código consultado: <span className="font-mono font-bold">{code}</span></p>
          </motion.div>
        )}

        {!loading && result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Validación banner */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
              <CheckCircle2 size={40} className="mx-auto mb-2" />
              <h2 className="text-xl font-black">Certificado Auténtico</h2>
              <p className="text-green-100 text-xs mt-1">Este documento fue emitido oficialmente por el sistema</p>
            </div>

            {/* Datos */}
            <div className="p-5 sm:p-8 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#003366]/5 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-[#003366]" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estudiante</p>
                  <p className="font-black text-[#003366]">{result.student}</p>
                  {result.cedula && <p className="text-xs text-slate-400">Identificación: {result.cedula}</p>}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#003366]/5 flex items-center justify-center flex-shrink-0">
                  <Building2 size={16} className="text-[#003366]" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empresa Receptora</p>
                  <p className="font-black text-[#003366]">{result.company}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#003366]/5 flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={16} className="text-[#003366]" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tutor Académico</p>
                  <p className="font-black text-[#003366]">{result.tutor}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock size={14} className="text-[#C5A059]" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Horas</p>
                  <p className="font-black text-[#003366] text-lg">{result.totalHours}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar size={14} className="text-[#C5A059]" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inicio</p>
                  <p className="font-bold text-[#003366] text-sm">{new Date(result.startDate).toLocaleDateString("es-EC")}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar size={14} className="text-[#C5A059]" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Emisión</p>
                  <p className="font-bold text-[#003366] text-sm">{new Date(result.issuedAt).toLocaleDateString("es-EC")}</p>
                </div>
              </div>

              <div className="mt-2 p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Código de Verificación</p>
                <p className="font-mono font-black text-[#003366] tracking-[0.2em]">{result.verificationCode}</p>
              </div>

              {result.certificateUrl && (
                <a href={result.certificateUrl} target="_blank" rel="noopener noreferrer"
                  className="block text-center w-full bg-[#003366] text-white rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest hover:bg-[#002244] transition-all">
                  Ver Certificado Original
                </a>
              )}
            </div>
          </motion.div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Verificación oficial del Sistema de Prácticas Preprofesionales
        </p>
      </div>
    </div>
  );
}
