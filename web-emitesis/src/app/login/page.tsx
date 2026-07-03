"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BRAND_LOGO_SRC, BRAND_LOGO_BANNER, BRAND_LOGO_WHITE, BRAND_LOGO_MAIN } from "@/lib/brand";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, AlertTriangle, MapPin, Brain, Fingerprint } from "lucide-react";
import { authService, notifyTokenUpdated } from "@/services/auth.service";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { sanitizeEmailClient, sanitizePasswordClient } from "@/utils/security";
import { ROLE_REDIRECTS, Role, normalizeApiRoleToAppRole } from "@/constants/roles";
import { useLanguage } from "@/providers/LanguageProvider";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import Cookies from "js-cookie";

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
    const { t } = useLanguage();

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6Lej8bosAAAAAHS1jnehMjfBm1FZ6a6a__3Yuteg";
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
                }
            }

            const data = await authService.login(sanitizeEmailClient(email), sanitizePasswordClient(password), currentToken || "dev_bypass");

            if (data.mfaRequired) {
                setIsMfaRequired(true);
                setMfaUserId(data.userId);
                setIsLoading(false);
                return;
            }

            // Guardar en LocalStorage para compatibilidad con hooks existentes
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
            localStorage.setItem("session_start", Date.now().toString());
            localStorage.setItem("last_activity", Date.now().toString());
            const user = { ...data.user, role: normalizeApiRoleToAppRole(String(data.user.role)) };
            localStorage.setItem("user", JSON.stringify(user));

            // GUARDAR EN COOKIES (Nivel Bancario - Permite que el Middleware lo vea en el Servidor)
            Cookies.set("token", data.access_token, { expires: 1, secure: typeof window !== 'undefined' && window.location.protocol === 'https:', sameSite: 'strict', path: '/' });
            Cookies.set("user", JSON.stringify(user), { expires: 1, secure: typeof window !== 'undefined' && window.location.protocol === 'https:', sameSite: 'strict', path: '/' });
            notifyTokenUpdated(data.access_token);

            const role = user.role as Role;
            router.push(ROLE_REDIRECTS[role] || "/dashboard");
        } catch (err: unknown) {
            setError((err as Error).message || t.login.errors.generic);
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
            localStorage.setItem("refresh_token", data.refresh_token);
            localStorage.setItem("session_start", Date.now().toString());
            localStorage.setItem("last_activity", Date.now().toString());
            const user = { ...data.user, role: normalizeApiRoleToAppRole(String(data.user.role)) };
            localStorage.setItem("user", JSON.stringify(user));

            // Cookies para Middleware
            Cookies.set("token", data.access_token, { expires: 1, secure: typeof window !== 'undefined' && window.location.protocol === 'https:', sameSite: 'strict', path: '/' });
            Cookies.set("user", JSON.stringify(user), { expires: 1, secure: typeof window !== 'undefined' && window.location.protocol === 'https:', sameSite: 'strict', path: '/' });
            notifyTokenUpdated(data.access_token);

            const role = user.role as Role;
            router.push(ROLE_REDIRECTS[role] || "/dashboard");
        } catch (err: unknown) {
            setError((err as Error).message || t.login.mfa.verifying);
        } finally {
            setIsLoading(false);
        }
    };

    const brandTopOnBlue = (
        <Link href="/" className="flex items-center gap-2.5 focus:outline-none">
            <Image src={BRAND_LOGO_MAIN} alt="Logo" width={280} height={70} className="h-16 w-auto object-contain" priority />
        </Link>
    );




    const brandTopOnWhite = (
        <Link href="/" className="flex items-center gap-2.5 focus:outline-none">
            <Image src={BRAND_LOGO_MAIN} alt="Logo" width={240} height={60} className="h-12 w-auto object-contain" />
        </Link>
    );




    return (
        <div className="min-h-screen lg:grid lg:grid-cols-2 bg-slate-50">
            {/* Izquierda — desktop: todo el bloque es continuo, sin header separado */}
            <aside className="relative hidden min-h-0 flex-col overflow-hidden bg-brand-blue lg:flex lg:min-h-screen">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/15 via-transparent to-transparent" />

                <div className="relative z-10 px-8 pt-6 xl:px-12 xl:pt-8">
                    {brandTopOnBlue}
                </div>

                <div className="relative z-10 flex flex-1 flex-col justify-between p-5 sm:p-8 pb-8 sm:pb-10 pt-10 sm:pt-12 xl:p-12 xl:pb-12 xl:pt-16">
                    <div className="max-w-md">
                        <h2 className="mb-4 text-2xl md:text-3xl xl:text-4xl font-black leading-tight tracking-tight text-white">
                            {t.home.hero.title1}<br />
                            <span className="italic text-brand-gold">{t.home.hero.badge}</span>
                        </h2>
                        <p className="max-w-sm text-sm leading-relaxed text-white/60">
                            {t.home.hero.subtitle.replace('{highlight1}', t.home.hero.subtitleHighlight1).replace('{highlight2}', t.home.hero.subtitleHighlight2)}
                        </p>
                    </div>

                    <div className="max-w-md space-y-8 pt-10">
                        <div className="space-y-3">
                            {[
                                { icon: <MapPin className="h-4 w-4" />, label: t.home.pillars.items[0].tag },
                                { icon: <Brain className="h-4 w-4" />, label: t.home.ai.label },
                                { icon: <Fingerprint className="h-4 w-4" />, label: t.home.pillars.items[0].tag.split(' · ')[1] },
                            ].map((f) => (
                                <div key={f.label} className="flex items-center gap-3 text-sm text-white/70">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] text-brand-gold">
                                        {f.icon}
                                    </div>
                                    {f.label}
                                </div>
                            ))}
                        </div>

                        <p className="max-w-sm border-t border-white/8 pt-4 text-[11px] leading-relaxed text-white/40">
                            {t.login.privacy}{" "}
                            <Link href="/privacidad" className="text-brand-gold/70 underline-offset-2 transition-colors hover:text-brand-gold hover:underline">
                                {t.login.privacyLink}
                            </Link>
                        </p>
                    </div>
                </div>
            </aside>

            {/* Derecha (y pantalla completa en móvil) */}
            <div className="relative flex min-h-screen flex-col bg-slate-50">
                <header className="flex items-center justify-between px-6 py-4 xl:px-12 xl:py-5 lg:hidden">
                    <div className="lg:hidden">{brandTopOnWhite}</div>
                    <div className="flex items-center gap-4">
                        <LanguageToggle />
                        <Link href="/" className="text-xs font-semibold text-slate-500 transition-colors hover:text-brand-blue">
                            ← {t.common.back}
                        </Link>
                    </div>
                </header>

                <div className="absolute right-8 top-6 hidden items-center gap-4 lg:flex xl:right-12 xl:top-8">
                    <LanguageToggle />
                    <ThemeToggle />
                    <Link
                        href="/"
                        className="text-xs font-semibold text-slate-500 transition-colors hover:text-brand-blue"
                    >
                        ← {t.common.back}
                    </Link>
                </div>

                <div className="flex flex-1 items-center justify-center p-6 py-12 lg:py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-sm"
                    >
                        {!isMfaRequired ? (
                            <>
                                <div className="mb-8">
                                    <h1 className="text-2xl sm:text-3xl font-black text-brand-blue tracking-tight mb-2">{t.login.title}</h1>
                                    <p className="text-slate-500 text-sm">{t.login.subtitle}</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* email */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 block">{t.login.email}</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="email" required value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder={t.login.emailPlaceholder}
                                                className="w-full bg-white border border-slate-200 rounded-full py-3.5 pl-12 pr-5 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    {/* password */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-600">{t.login.password}</label>
                                            <Link href="/olvido-password" className="text-xs font-semibold text-brand-gold hover:text-brand-blue transition-colors">
                                                {t.login.forgotPassword}
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type={showPassword ? "text" : "password"} required value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder={t.login.passwordPlaceholder}
                                                className="w-full bg-white border border-slate-200 rounded-full py-3.5 pl-12 pr-12 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all placeholder:text-slate-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors cursor-pointer"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {!siteKey && isDev && (
                                        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
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
                                        <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
                                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-600 font-medium">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full btn-pill-primary py-4 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                {t.login.submitting}
                                            </span>
                                        ) : t.login.submit}
                                    </button>


                                </form>
                            </>
                        ) : (
                            <>
                                <div className="mb-8 text-center">
                                    <div className="flex items-center justify-center mx-auto mb-5 text-brand-blue">
                                        <Lock className="w-12 h-12" />
                                    </div>
                                    <h1 className="text-2xl font-black text-brand-blue tracking-tight mb-2">{t.login.mfa.title}</h1>
                                    <p className="text-slate-500 text-sm">{t.login.mfa.subtitle}</p>
                                </div>
                                <form onSubmit={handleMfaSubmit} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 block">{t.login.mfa.label}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text" required autoFocus maxLength={6}
                                                value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                                                placeholder={t.login.mfa.placeholder}
                                                className="w-full bg-white border border-slate-200 rounded-full py-3.5 text-center text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all tracking-[0.5em] font-bold placeholder:tracking-normal placeholder:font-normal"
                                            />
                                        </div>
                                    </div>
                                    {error && (
                                        <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
                                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-600 font-medium">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full rounded-full bg-brand-gold text-white py-4 text-sm font-bold hover:bg-brand-blue transition-all shadow-lg disabled:opacity-60 cursor-pointer"
                                    >
                                        {isLoading ? t.login.mfa.verifying : t.login.mfa.confirm}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsMfaRequired(false)}
                                        className="w-full btn-pill-outline py-2.5 text-xs font-semibold mt-2 cursor-pointer"
                                    >
                                        ← {t.login.backToLogin}
                                    </button>
                                </form>
                            </>
                        )}

                        <p className="text-center text-xs text-slate-400 mt-8">
                            <Link href="/privacidad" className="hover:text-brand-blue transition-colors hover:underline underline-offset-2">
                                {t.login.privacyLink}
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
