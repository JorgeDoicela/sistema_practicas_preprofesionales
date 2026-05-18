'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { authService } from '@/services/auth.service';
import { sanitizeEmailClient } from '@/utils/security';
import { BRAND_LOGO_SRC } from '@/lib/brand';
import { Mail, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

export default function ForgotPasswordPage() {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const { executeRecaptcha } = useGoogleReCaptcha();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        let token = null;
        if (executeRecaptcha) {
            try {
                token = await executeRecaptcha('forgot_password');
            } catch (err) {
                console.error('Error executing reCAPTCHA v3:', err);
            }
        }


        try {
            const cleanEmail = sanitizeEmailClient(email);
            await authService.forgotPassword(cleanEmail, token || 'dev_bypass');
            setMessage({
                type: 'success',
                text: t.forgotPassword.success,
            });
            setEmail('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
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
                        <span className="text-xs font-bold text-slate-400 hidden sm:block">{t.nav.brandSub}</span>
                    </Link>
                    <Link href="/login" className="text-xs font-semibold text-slate-500 hover:text-brand-blue transition-colors">
                        ← {t.forgotPassword.backToLogin}
                    </Link>
                </div>
            </header>

            {/* content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-sm"
                >
                    {/* icon */}
                    <div className="w-14 h-14 rounded-full bg-brand-blue flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <ShieldCheck className="w-7 h-7 text-brand-gold" />
                    </div>

                    {/* heading */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl sm:text-3xl font-black text-brand-blue tracking-tight mb-2">
                            {t.forgotPassword.title}
                        </h1>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            {t.forgotPassword.subtitle}
                        </p>
                    </div>

                    {/* success state */}
                    {message?.type === 'success' ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 mb-2">{t.common.approved}</p>
                                <p className="text-sm text-slate-500 leading-relaxed">{message.text}</p>
                            </div>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 w-full btn-pill-primary py-4 text-sm font-bold cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {t.forgotPassword.backToLogin}
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {message?.type === 'error' && (
                                <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
                                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-600 font-medium">{message.text}</p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 block">
                                    {t.forgotPassword.email}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder={t.login.emailPlaceholder}
                                        className="w-full bg-white border border-slate-200 rounded-full py-3.5 pl-12 pr-5 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-pill-primary py-4 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        {t.forgotPassword.submitting}
                                    </span>
                                ) : t.forgotPassword.submit}
                            </button>

                            <div className="text-center space-y-2 pt-2">
                                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-gold hover:text-brand-blue transition-colors">
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    {t.forgotPassword.backToLogin}
                                </Link>
                                <div>
                                    <Link href="/privacidad" className="text-xs text-slate-400 hover:text-brand-blue hover:underline underline-offset-2 transition-colors">
                                        {t.login.privacyLink}
                                    </Link>
                                </div>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
