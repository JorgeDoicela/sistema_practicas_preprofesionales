"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Lock,
    Mail,
    ArrowRight,
    AlertCircle,
    Loader2,
    ShieldCheck,
    ChevronLeft
} from "lucide-react";
import { authService } from "@/services/auth.service";
import ReCAPTCHA from "react-google-recaptcha";
import { useRef } from "react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (!recaptchaToken) {
                setError("Por favor, completa el reCAPTCHA.");
                setIsLoading(false);
                return;
            }

            const data = await authService.login(email, password, recaptchaToken);
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            const role = data.user.role;
            switch (role) {
                case "ADMIN": router.push("/admin/dashboard"); break;
                case "COORDINADOR": router.push("/coordinador/dashboard"); break;
                case "TUTOR": router.push("/tutor/dashboard"); break;
                case "ESTUDIANTE": router.push("/estudiante/dashboard"); break;
                case "EMPRESA": router.push("/empresa/dashboard"); break;
                default: router.push("/dashboard");
            }
        } catch (err: any) {
            setError(err.message || "Credenciales incorrectas.");
            // Reset reCAPTCHA on error
            setRecaptchaToken(null);
            recaptchaRef.current?.reset();
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
                      <Image src="/images/ISTPET_sin_fondo.png" alt="Logo" width={100} height={25} className="brightness-0 invert h-6 w-auto" />
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
                                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 text-sm focus:ring-2 focus:ring-blue-900/5 outline-none" placeholder="••••••••" />
                                    </div>
                                </div>

                                <div className="flex justify-center py-2">
                                    <ReCAPTCHA
                                        ref={recaptchaRef}
                                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                                        onChange={(token: string | null) => setRecaptchaToken(token)}
                                    />
                                </div>

                                {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold text-center border border-red-100">{error}</div>}

                                <button type="submit" disabled={isLoading} className="w-full bg-[#003366] text-white rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] transition-all">
                                    {isLoading ? "Validando..." : "Entrar al Sistema"}
                                </button>
                            </form>
                         </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
