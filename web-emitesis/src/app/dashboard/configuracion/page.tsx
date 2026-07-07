"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Shield, Smartphone, XCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { authService } from "@/services/auth.service";
import Image from "next/image";
import Cookies from "js-cookie";
import { toast } from "sonner";

export default function ConfigurationPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [step, setStep] = useState<"status" | "setup" | "disable">("status");
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Garantizar que isTwoFactorEnabled sea siempre booleano
        setUser({ ...parsed, isTwoFactorEnabled: parsed.isTwoFactorEnabled === true });
      } catch {
        // Si el JSON está corrupto, limpiar sesión inválida
        localStorage.removeItem("user");
      }
    }
  }, []);

  /** Persiste el usuario actualizado tanto en localStorage como en cookie */
  const persistUser = (updatedUser: Record<string, unknown>) => {
    const serialized = JSON.stringify(updatedUser);
    localStorage.setItem("user", serialized);
    Cookies.set("user", serialized, {
      expires: 1,
      secure: typeof window !== "undefined" && window.location.protocol === "https:",
      sameSite: "strict",
      path: "/",
    });
    setUser(updatedUser);
  };

  /** Filtra el input para aceptar solo dígitos numéricos */
  const handleCodeChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (error) setError(null);
  };

  const handleDisableCodeChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    setDisableCode(digits);
    if (error) setError(null);
  };

  const handleStartSetup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.generate2FA();
      setQrCode((data as any).qrCodeDataURL);
      setStep("setup");
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Error al generar el código QR. Intenta de nuevo.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (code.length !== 6) return;
    setIsLoading(true);
    setError(null);
    try {
      await authService.turnOn2FA(code);
      persistUser({ ...user, isTwoFactorEnabled: true });
      setStep("status");
      setCode("");
      toast.success("Autenticación de Dos Factores activada con éxito.");
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Código de verificación inválido o expirado.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndDisable = async () => {
    if (disableCode.length !== 6) return;
    setIsLoading(true);
    setError(null);
    try {
      await authService.turnOff2FA(disableCode);
      persistUser({ ...user, isTwoFactorEnabled: false });
      setStep("status");
      setDisableCode("");
      toast.success("La Autenticación de Dos Factores ha sido desactivada.");
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Código de verificación inválido o expirado.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {user ? (
        <div className="max-w-4xl mx-auto py-8 px-4">
          <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
            <h1 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight mb-2">Configuración de Seguridad</h1>
            <p className="text-slate-500 text-sm font-medium">Gestiona las capas de protección de tu cuenta institucional.</p>
          </header>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden"
              data-tour="settings-security"
            >
              <div className="p-5 md:p-8 lg:p-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-10">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${user.isTwoFactorEnabled ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                      <Shield className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#003366] tracking-tight">Verificación en Dos Pasos (2FA)</h2>
                      <p className="text-slate-500 text-xs mt-1">
                        {user.isTwoFactorEnabled
                          ? "Tu cuenta está protegida con una capa adicional de seguridad avanzada."
                          : "Añade una capa de seguridad extra usando una aplicación de autenticación."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full ${user.isTwoFactorEnabled ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"}`}>
                      {user.isTwoFactorEnabled ? "Activado" : "Desactivado"}
                    </span>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {step === "status" && (
                    <motion.div
                      key="status"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="bg-slate-50 rounded-3xl p-5 md:p-8 border border-slate-100"
                    >
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
                          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Usa los códigos de 6 dígitos para entrar y proteger tu sesión.</p>
                        </div>
                      </div>

                      {/* Error inline al fallar generateQR desde el paso status */}
                      {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {error}
                        </div>
                      )}

                      {!user.isTwoFactorEnabled ? (
                        <button
                          onClick={handleStartSetup}
                          disabled={isLoading}
                          className="inline-flex items-center gap-3 bg-[#003366] text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:translate-y-0 cursor-pointer"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                          Activar ahora
                        </button>
                      ) : (
                        <button
                          onClick={() => { setStep("disable"); setError(null); }}
                          disabled={isLoading}
                          className="inline-flex items-center gap-3 bg-white border border-red-100 text-red-500 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          Desactivar 2FA
                        </button>
                      )}
                    </motion.div>
                  )}

                  {step === "setup" && (
                    <motion.div
                      key="setup"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="space-y-6"
                    >
                      <button
                        onClick={() => { setStep("status"); setError(null); setCode(""); }}
                        className="flex items-center gap-2 text-slate-400 hover:text-[#003366] transition-colors mb-4 group"
                      >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Cancelar configuración</span>
                      </button>

                      <div className="flex flex-col md:flex-row gap-12 items-start">
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-inner border-2 border-slate-50 flex-shrink-0 mx-auto md:mx-0">
                          {qrCode ? (
                            <Image src={qrCode} alt="Código QR para configurar 2FA" width={220} height={220} className="rounded-2xl" />
                          ) : (
                            <div className="w-[220px] h-[220px] bg-slate-50 animate-pulse rounded-2xl" />
                          )}
                        </div>

                        <div className="flex-1 space-y-6 w-full">
                          <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                            <p className="text-[11px] text-[#003366] font-bold leading-relaxed">
                              Escanea este código con tu aplicación de autenticación (Google Authenticator, Authy, etc.). Luego, ingresa el código de 6 dígitos para confirmar la vinculación.
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label htmlFor="totp-enable-code" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-2">
                                Código de Verificación
                              </label>
                              <input
                                id="totp-enable-code"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={code}
                                onChange={(e) => handleCodeChange(e.target.value)}
                                placeholder="000000"
                                autoComplete="one-time-code"
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
                              className="w-full bg-[#C5A059] text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:translate-y-0 cursor-pointer"
                            >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirmar y Activar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === "disable" && (
                    <motion.div
                      key="disable"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="space-y-6"
                    >
                      <button
                        onClick={() => { setStep("status"); setError(null); setDisableCode(""); }}
                        className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors mb-4 group"
                      >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Cancelar desactivación</span>
                      </button>

                      <div className="flex flex-col md:flex-row gap-12 items-start">
                        <div className="bg-red-50 p-6 rounded-[2.5rem] shadow-inner border border-red-100/50 flex-shrink-0 mx-auto md:mx-0 flex items-center justify-center w-[220px] h-[220px]">
                          <Shield className="w-20 h-20 text-red-500 animate-pulse" />
                        </div>

                        <div className="flex-1 space-y-6 w-full">
                          <div className="p-5 bg-red-50/50 border border-red-100 rounded-2xl">
                            <h4 className="text-xs font-black uppercase tracking-widest text-red-700 mb-1">Confirmar desactivación de 2FA</h4>
                            <p className="text-[11px] text-red-600 font-semibold leading-relaxed">
                              Esta acción reducirá significativamente la seguridad de tu cuenta. Para confirmar, introduce el código de 6 dígitos generado por tu aplicación de autenticación.
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label htmlFor="totp-disable-code" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-2">
                                Código de Verificación Actual
                              </label>
                              <input
                                id="totp-disable-code"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={disableCode}
                                onChange={(e) => handleDisableCodeChange(e.target.value)}
                                placeholder="000000"
                                autoComplete="one-time-code"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-red-500/10 outline-none font-bold tracking-[0.5em] text-center"
                              />
                            </div>

                            {error && (
                              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                              </div>
                            )}

                            <button
                              onClick={handleVerifyAndDisable}
                              disabled={isLoading || disableCode.length < 6}
                              className="w-full bg-red-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-red-700 hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:translate-y-0 cursor-pointer"
                            >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirmar y Desactivar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <div className="p-5 md:p-8 bg-slate-100/50 rounded-[2rem] border border-dashed border-slate-200 animate-in fade-in duration-500 delay-150">
               <div className="flex items-start gap-4">
                 <AlertCircle className="w-5 h-5 text-[#003366] flex-shrink-0 mt-1" />
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#003366] mb-1">Nota importante sobre recuperación</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      Asegúrate de mantener el acceso a tu dispositivo de autenticación. Si pierdes el acceso y no tienes configurados métodos de recuperación alternativos, deberás contactar con soporte técnico para restablecer tu cuenta.
                    </p>
                 </div>
               </div>
            </div>

            <div className="p-5 md:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in duration-500 delay-300" data-tour="settings-sessions">
              <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-2">
                Datos personales (LOPDP Ecuador)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Información sobre finalidades, conservación y cómo ejercer tus derechos ARCO sobre los datos personales tratados en Praxis Hub.
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
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="w-10 h-10 text-[#003366] animate-spin" />
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Cargando perfil de seguridad...</p>
        </div>
      )}
    </DashboardLayout>
  );
}
