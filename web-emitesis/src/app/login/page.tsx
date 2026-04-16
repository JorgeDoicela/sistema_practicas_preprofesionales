"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Lock,
    Mail,
    Eye,
    EyeOff
} from "lucide-react";
import { authService } from "@/services/auth.service";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { sanitizeEmailClient, sanitizePasswordClient } from "@/utils/security";
import { ROLE_REDIRECTS, Role, normalizeApiRoleToAppRole } from "@/constants/roles";
import { AlertTriangle, Info } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { executeRecaptcha } = useGoogleReCaptcha();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMfaRequired, setIsMfaRequired] = useState(false);
    const [mfaCode, setMfaCode] = useState("");
    const [mfaUserId, setMfaUserId] = useState<string | null>(null);
    
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    const isDev = process.env.NODE_ENV === "development";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            let currentToken = null;

            if (siteKey && executeRecaptcha) {
                try {
                    currentToken = await executeRecaptcha("login");
                } catch (recaptchaErr) {
                    console.error("Error al ejecutar reCAPTCHA v3:", recaptchaErr);
                    if (process.env.NODE_ENV === "production") {
                        throw new Error("No se pudo validar la seguridad de la sesión.");
                    }
                }
            }

            if (siteKey && !currentToken && process.env.NODE_ENV === "production") {
                setError("Por favor, inténtalo de nuevo (Error de validación).");
                setIsLoading(false);
                return;
            }

            const data = await authService.login(
                sanitizeEmailClient(email), 
                sanitizePasswordClient(password), 
                currentToken || "dev_bypass"
            );
            
            if (data.mfaRequired) {
                setIsMfaRequired(true);
                setMfaUserId(data.userId);
                setIsLoading(false);
                return;
            }

            localStorage.setItem("token", data.access_token);
            const user = { ...data.user, role: normalizeApiRoleToAppRole(String(data.user.role)) };
            localStorage.setItem("user", JSON.stringify(user));

            const role = user.role as Role;
            const redirectPath = ROLE_REDIRECTS[role] || "/dashboard";
            router.push(redirectPath);
        } catch (err: unknown) {
            setError((err as Error).message || "Credenciales inválidas.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (!mfaUserId) return;
            const data = await authService.authenticate2FA(mfaUserId, mfaCode);
            
            localStorage.setItem("token", data.access_token);
            const user = { ...data.user, role: normalizeApiRoleToAppRole(String(data.user.role)) };
            localStorage.setItem("user", JSON.stringify(user));

            const role = user.role as Role;
            const redirectPath = ROLE_REDIRECTS[role] || "/dashboard";
            router.push(redirectPath);
        } catch (err: unknown) {
            setError((err as Error).message || "Código inválido.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 p-5">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                   <div className="bg-[#003366] p-1.5 rounded-lg">
                      <Image src={BRAND_LOGO_SRC} alt="Logo" width={100} height={40} className="h-8 w-auto object-contain" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Portal Académico</span>
                </Link>
                <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-[#003366] hover:text-[#C5A059] transition-colors">Volver al Inicio</Link>
              </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden relative">
                         <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#003366] to-[#C5A059]" />
                         <div className="p-10 md:p-12">
                            <div className="text-center mb-10">
                                <h1 className="text-3xl font-black text-[#003366] tracking-tight mb-2">Ingresar</h1>
                                <p className="text-slate-500 text-sm">Credenciales ISTPET</p>
                            </div>

                            {!isMfaRequired ? (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Institucional</label>
                                        <div className="relative">
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 text-sm focus:ring-2 focus:ring-blue-900/5 outline-none" placeholder="correo@istpet.edu.ec" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña</label>
                                        <div className="relative">
                                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                required 
                                                value={password} 
                                                onChange={(e) => setPassword(e.target.value)} 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-sm focus:ring-2 focus:ring-blue-900/5 outline-none" 
                                                placeholder="••••••••" 
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-blue transition-colors focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <div className="flex justify-end mt-1 px-1">
                                            <Link href="/olvido-password" className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] hover:text-[#003366] transition-colors">
                                                ¿Olvidaste tu contraseña?
                                            </Link>
                                        </div>
                                    </div>

                                    {!siteKey && isDev && (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-amber-800 tracking-widest">Modo Desarrollo</p>
                                                <p className="text-[10px] font-medium text-amber-600 leading-tight">
                                                    ReCAPTCHA v3 no configurado (Invisible). Use <code className="bg-amber-100 px-1 rounded">SKIP_RECAPTCHA=true</code> en el backend.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold text-center border border-red-100">{error}</div>}

                                    <button type="submit" disabled={isLoading} className="w-full bg-[#003366] text-white rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] transition-all">
                                        {isLoading ? "Validando..." : "Entrar al Sistema"}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleMfaSubmit} className="space-y-6">
                                    <div className="text-center mb-6">
                                        <p className="text-slate-500 text-xs">Ingresa el código de 6 dígitos de tu aplicación de autenticación.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Código de Seguridad</label>
                                        <div className="relative">
                                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <input 
                                                type="text" 
                                                required 
                                                autoFocus
                                                maxLength={6}
                                                value={mfaCode} 
                                                onChange={(e) => setMfaCode(e.target.value)} 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 text-sm focus:ring-2 focus:ring-blue-900/5 outline-none tracking-[0.5em] font-bold text-center" 
                                                placeholder="000000" 
                                            />
                                        </div>
                                    </div>

                                    {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold text-center border border-red-100">{error}</div>}

                                    <button type="submit" disabled={isLoading} className="w-full bg-[#C5A059] text-white rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] transition-all">
                                        {isLoading ? "Verificando..." : "Confirmar Acceso"}
                                    </button>
                                    
                                    <button type="button" onClick={() => setIsMfaRequired(false)} className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#003366] transition-colors">
                                        Volver al Login
                                    </button>
                                </form>
                            )}
                         </div>
                    </div>
                </motion.div>
            </div>

            <footer className="py-6 px-4 text-center border-t border-slate-100 bg-white/60">
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
                    Al usar el portal usted puede ejercer sus derechos sobre datos personales según la ley ecuatoriana.{" "}
                    <Link href="/privacidad" className="text-[#003366] font-bold underline-offset-2 hover:underline">
                        Aviso de privacidad
                    </Link>
                </p>
            </footer>
        </div>
    );
}
