"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, AlertTriangle, ShieldCheck, MapPin, Brain, Fingerprint } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { sanitizeEmailClient, sanitizePasswordClient } from "@/utils/security";
import { ROLE_REDIRECTS, Role, normalizeApiRoleToAppRole } from "@/constants/roles";

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
                    if (process.env.NODE_ENV === "production") throw new Error("No se pudo validar la seguridad de la sesión.");
                }
            }
            if (siteKey && !currentToken && process.env.NODE_ENV === "production") {
                setError("Por favor, inténtalo de nuevo (Error de validación).");
                setIsLoading(false);
                return;
            }

            const data = await authService.login(sanitizeEmailClient(email), sanitizePasswordClient(password), currentToken || "dev_bypass");

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
            router.push(ROLE_REDIRECTS[role] || "/dashboard");
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
            router.push(ROLE_REDIRECTS[role] || "/dashboard");
        } catch (err: unknown) {
            setError((err as Error).message || "Código inválido.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* topbar */}
            <header className="bg-white border-b border-slate-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="bg-brand-blue p-1.5 rounded-lg">
                            <Image src={BRAND_LOGO_SRC} alt="Logo" width={100} height={40} className="h-7 w-auto object-contain" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 hidden sm:block">Portal Académico ISTPET</span>
                    </Link>
                    <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-brand-blue transition-colors">
                        ← Volver al inicio
                    </Link>
                </div>
            </header>

            {/* main */}
            <div className="flex-1 grid lg:grid-cols-2">

                {/* left — brand panel */}
                <div className="hidden lg:flex bg-brand-blue relative overflow-hidden flex-col justify-between p-12">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/15 via-transparent to-transparent" />

                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-xl bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center mb-10">
                            <ShieldCheck className="w-7 h-7 text-brand-gold" />
                        </div>
                        <h2 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
                            Bienvenido al<br />
                            <span className="text-brand-gold italic">ecosistema EmiTesis</span>
                        </h2>
                        <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                            Gestión integral de prácticas preprofesionales con IA, geofencing y certificación verificable.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-3">
                        {[
                            { icon: <MapPin className="w-4 h-4" />, label: "Asistencia con Geofencing Haversine" },
                            { icon: <Brain className="w-4 h-4" />, label: "Nexo AI · GPT-4o" },
                            { icon: <Fingerprint className="w-4 h-4" />, label: "Passkeys WebAuthn FIDO2" },
                        ].map(f => (
                            <div key={f.label} className="flex items-center gap-3 text-sm text-white/70">
                                <div className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-brand-gold">
                                    {f.icon}
                                </div>
                                {f.label}
                            </div>
                        ))}

                        <p className="text-[10px] text-white/30 pt-4 border-t border-white/8">
                            Al ingresar acepta la{" "}
                            <Link href="/privacidad" className="text-brand-gold/70 hover:text-brand-gold underline-offset-2 hover:underline transition-colors">
                                política de privacidad LOPDP
                            </Link>
                        </p>
                    </div>
                </div>

                {/* right — form */}
                <div className="flex items-center justify-center p-6 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-sm"
                    >
                        {!isMfaRequired ? (
                            <>
                                <div className="mb-8">
                                    <h1 className="text-3xl font-black text-brand-blue tracking-tight mb-2">Iniciar sesión</h1>
                                    <p className="text-slate-500 text-sm">Ingresa tus credenciales institucionales ISTPET.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* email */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 block">Correo institucional</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="email" required value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="correo@istpet.edu.ec"
                                                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    {/* password */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-600">Contraseña</label>
                                            <Link href="/olvido-password" className="text-xs font-semibold text-brand-gold hover:text-brand-blue transition-colors">
                                                ¿Olvidaste tu contraseña?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type={showPassword ? "text" : "password"} required value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all placeholder:text-slate-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {!siteKey && isDev && (
                                        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-amber-700">Modo Desarrollo</p>
                                                <p className="text-xs text-amber-600 mt-0.5">
                                                    ReCAPTCHA v3 no configurado. Use <code className="bg-amber-100 px-1 rounded">SKIP_RECAPTCHA=true</code> en el backend.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-600 font-medium">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-brand-blue text-white rounded-xl py-3.5 text-sm font-bold hover:bg-brand-gold transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Validando…
                                            </span>
                                        ) : "Entrar al Sistema"}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <>
                                <div className="mb-8 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-blue flex items-center justify-center mx-auto mb-5">
                                        <Lock className="w-7 h-7 text-white" />
                                    </div>
                                    <h1 className="text-2xl font-black text-brand-blue tracking-tight mb-2">Verificación en dos pasos</h1>
                                    <p className="text-slate-500 text-sm">Ingresa el código de 6 dígitos de tu aplicación de autenticación.</p>
                                </div>

                                <form onSubmit={handleMfaSubmit} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 block">Código de seguridad</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text" required autoFocus maxLength={6}
                                                value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                                                placeholder="000000"
                                                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all tracking-[0.5em] font-bold text-center placeholder:tracking-normal placeholder:font-normal"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-600 font-medium">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-brand-gold text-white rounded-xl py-3.5 text-sm font-bold hover:bg-brand-blue transition-all shadow-lg disabled:opacity-60"
                                    >
                                        {isLoading ? "Verificando…" : "Confirmar Acceso"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsMfaRequired(false)}
                                        className="w-full text-xs font-semibold text-slate-400 hover:text-brand-blue transition-colors py-2"
                                    >
                                        ← Volver al inicio de sesión
                                    </button>
                                </form>
                            </>
                        )}

                        <p className="text-center text-xs text-slate-400 mt-8">
                            <Link href="/privacidad" className="hover:text-brand-blue transition-colors hover:underline underline-offset-2">
                                Aviso de privacidad (LOPDP)
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
