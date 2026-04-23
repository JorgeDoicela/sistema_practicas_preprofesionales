"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Smartphone, CheckCircle, XCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { authService } from "@/services/auth.service";
import Image from "next/image";

export default function ConfigurationPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [step, setStep] = useState<"status" | "setup">("status");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleStartSetup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[2FA Frontend] Iniciando generación de 2FA...");
      const data = await authService.generate2FA();
      console.log("[2FA Frontend] QR generado con éxito");
      setQrCode(data.qrCodeDataURL);
      setStep("setup");
    } catch (err: any) {
      console.error("[2FA Frontend] Error al generar QR:", err);
      setError(err.message || "Error al generar código QR");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[2FA Frontend] Verificando código:", code);
      await authService.turnOn2FA(code);
      console.log("[2FA Frontend] 2FA Activado en servidor");
      const updatedUser = { ...user, isTwoFactorEnabled: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setStep("status");
      setMessage("Autenticación de Dos Factores activada con éxito.");
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      console.error("[2FA Frontend] Error en la activación:", err);
      setError(err.message || "Código inválido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
      // In a real scenario, we might ask for a code here too.
      // But for simplicity in this MVP:
      if (!confirm("¿Estás seguro de que quieres desactivar el 2FA? Esto reducirá la seguridad de tu cuenta.")) return;
      
      setIsLoading(true);
      try {
          // Note: My backend turn-off currently requires a code for safety.
          // I will prompt for it if needed, but I'll try to reach it.
          const codeToDisable = prompt("Ingresa el código actual de tu aplicación para confirmar la desactivación:");
          if (!codeToDisable) {
              setIsLoading(false);
              return;
          }
          await authService.turnOff2FA(codeToDisable);
          const updatedUser = { ...user, isTwoFactorEnabled: false };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
          setMessage("2FA desactivado.");
          setTimeout(() => setMessage(null), 5000);
      } catch (err: any) {
          alert("Error: " + err.message);
      } finally {
          setIsLoading(false);
      }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight mb-2">Configuración de Seguridad</h1>
          <p className="text-slate-500 text-sm font-medium">Gestiona las capas de protección de tu cuenta institucional.</p>
        </header>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm font-bold"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {message}
          </motion.div>
        )}

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden"
          >
            <div className="p-5 md:p-8 lg:p-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-10">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${user.isTwoFactorEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Shield className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#003366] tracking-tight">Verificación en Dos Pasos (2FA)</h2>
                    <p className="text-slate-500 text-xs mt-1">
                      {user.isTwoFactorEnabled 
                        ? "Tu cuenta está protegida con una capa adicional de seguridad." 
                        : "Añade una capa de seguridad extra usando una aplicación de autenticación."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.isTwoFactorEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                    {user.isTwoFactorEnabled ? "Activado" : "Desactivado"}
                  </span>
                </div>
              </div>

              {step === "status" ? (
                <div className="bg-slate-50 rounded-3xl p-5 md:p-8 border border-slate-100">
                  <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-4">¿Cómo funciona?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#003366] font-black text-xs">1</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Descarga una app como Google Authenticator o Authy.</p>
                    </div>
                    <div className="space-y-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#003366] font-black text-xs">2</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Escanea el código QR que generaremos para ti.</p>
                    </div>
                    <div className="space-y-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#003366] font-black text-xs">3</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Usa los códigos de 6 dígitos para entrar y confirmar acciones.</p>
                    </div>
                  </div>

                  {!user.isTwoFactorEnabled ? (
                    <button 
                      onClick={handleStartSetup}
                      disabled={isLoading}
                      className="inline-flex items-center gap-3 bg-[#003366] text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:translate-y-0"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                      Activar ahora
                    </button>
                  ) : (
                    <button 
                      onClick={handleDisable}
                      disabled={isLoading}
                      className="inline-flex items-center gap-3 bg-white border border-red-100 text-red-500 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Desactivar 2FA
                    </button>
                  )}
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <button onClick={() => setStep("status")} className="flex items-center gap-2 text-slate-400 hover:text-[#003366] transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Cancelar configuración</span>
                  </button>

                  <div className="flex flex-col md:flex-row gap-12 items-start">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-inner border-2 border-slate-50 flex-shrink-0 mx-auto md:mx-0">
                      {qrCode ? (
                        <Image src={qrCode} alt="QR Setup" width={220} height={220} className="rounded-2xl" />
                      ) : (
                        <div className="w-[220px] h-[220px] bg-slate-50 animate-pulse rounded-2xl" />
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-6">
                      <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                        <p className="text-[11px] text-[#003366] font-bold leading-relaxed">
                          Escanea este código con tu aplicación de autenticación. Luego, ingresa el código de 6 dígitos que aparece en tu pantalla para confirmar la vinculación.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-2">Código de Verificación</label>
                          <input 
                            type="text" 
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="000000"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-blue-900/5 outline-none font-bold tracking-[0.5em] text-center"
                          />
                        </div>

                        {error && (
                          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                          </div>
                        )}

                        <button 
                          onClick={handleVerifyAndEnable}
                          disabled={isLoading || code.length < 6}
                          className="w-full bg-[#C5A059] text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:translate-y-0"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirmar y Activar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <div className="p-5 md:p-8 bg-slate-100/50 rounded-[2rem] border border-dashed border-slate-200">
             <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-[#003366] flex-shrink-0 mt-1" />
                <div>
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-[#003366] mb-1">Nota importante sobre recuperación</h4>
                   <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                     Asegúrate de tener acceso a tu dispositivo. Si pierdes el acceso a tu aplicación de autenticación y no tienes configurados métodos de recuperación adicionales, podrías perder el acceso a tu cuenta.
                   </p>
                </div>
             </div>
          </div>

          <div className="p-5 md:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-2">
              Datos personales (LOPDP Ecuador)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Información sobre finalidades, conservación y cómo ejercer tus derechos sobre los datos tratados en Emitesis.
            </p>
            <Link
              href="/privacidad"
              className="inline-flex text-xs font-black uppercase tracking-widest text-[#C5A059] hover:text-[#003366] underline-offset-4 hover:underline"
            >
              Ver aviso de privacidad
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
