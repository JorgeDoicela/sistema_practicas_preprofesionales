"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2,
    Mail,
    Lock,
    User as UserIcon,
    FileText,
    MapPin,
    Briefcase
} from "lucide-react";
import { authService } from "@/services/auth.service";
import ReCAPTCHA from "react-google-recaptcha";
import { useRef } from "react";
import { sanitizeInput } from "@/utils/security";
import { validateRUC } from "@/utils/ecuador-validators";
import { cn } from "@/lib/utils";
import { User } from "@/types/user";

interface RegisterCompanyResponse {
    access_token: string;
    user: User;
}

export default function RegisterCompanyPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        fullName: "",
        ruc: "",
        companyName: "",
        address: "",
        representative: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!acceptedTerms) {
            setError("Debe aceptar los términos.");
            return;
        }

        if (!recaptchaToken) {
            setError("Por favor, completa el reCAPTCHA.");
            setIsLoading(false);
            return;
        }

        if (!validateRUC(formData.ruc)) {
            setError("El RUC ingresado no es válido.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Sanitización masiva de todos los campos contra SQL Injection
            const cleanData: Record<string, string> = Object.keys(formData).reduce((acc: Record<string, string>, key) => {
                acc[key] = sanitizeInput((formData as any)[key]);
                return acc;
            }, {});

            const data: RegisterCompanyResponse = await authService.registerCompany(cleanData, recaptchaToken);
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));
            router.push("/empresa/dashboard");
        } catch (err: unknown) {
            setError((err as Error).message || "Error en el registro.");
            // Reset reCAPTCHA on error
            setRecaptchaToken(null);
            recaptchaRef.current?.reset();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-body">
             <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 p-5">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                   <div className="bg-[#003366] p-1.5 rounded-lg">
                      <Image src="/images/ISTPET_sin_fondo.png" alt="Logo" width={100} height={25} className="brightness-0 invert h-6 w-auto" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cooperación Institucional</span>
                </Link>
                <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-[#003366] hover:text-[#C5A059] transition-colors">Ya tengo cuenta</Link>
              </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full">
                    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#003366] to-[#C5A059]" />
                        <div className="p-10 md:p-16">
                            <h1 className="text-3xl font-black text-[#003366] tracking-tight mb-8">Registro de Empresa</h1>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {step === 1 ? (
                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <InputField label="Nombre Completo" name="fullName" icon={<UserIcon className="w-5 h-5" />} placeholder="Responsable" value={formData.fullName} onChange={handleChange} />
                                            <InputField label="Correo Corporativo" name="email" icon={<Mail className="w-5 h-5" />} placeholder="empresa@ejemplo.com" value={formData.email} onChange={handleChange} />
                                        </div>
                                        <InputField label="Contraseña" name="password" type="password" icon={<Lock className="w-5 h-5" />} placeholder="Mínimo 8 caracteres" value={formData.password} onChange={handleChange} />
                                        <button type="button" onClick={() => setStep(2)} className="w-full bg-[#003366] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Siguiente Paso</button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <InputField 
                                                label="RUC" 
                                                name="ruc" 
                                                icon={<FileText className="w-5 h-5" />} 
                                                placeholder="1790000000001" 
                                                value={formData.ruc} 
                                                onChange={handleChange}
                                                maxLength={13}
                                                error={formData.ruc && !validateRUC(formData.ruc) ? "RUC inválido (SRI)" : null}
                                            />
                                            <InputField label="Razón Social" name="companyName" icon={<Building2 className="w-5 h-5" />} placeholder="Tech Corp" value={formData.companyName} onChange={handleChange} />
                                        </div>
                                        <InputField label="Dirección" name="address" icon={<MapPin className="w-5 h-5" />} placeholder="Av. Amazonas" value={formData.address} onChange={handleChange} />
                                        <InputField label="Representante Legal" name="representative" icon={<Briefcase className="w-5 h-5" />} placeholder="Ing. Juan Pérez" value={formData.representative} onChange={handleChange} />
                                        
                                        <div className="py-2">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="w-4 h-4" />
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Acepto los términos y condiciones.</span>
                                            </label>
                                        </div>

                                        <div className="flex justify-center py-2">
                                            <ReCAPTCHA
                                                ref={recaptchaRef}
                                                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                                                onChange={(token: string | null) => setRecaptchaToken(token)}
                                            />
                                        </div>

                                        {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100">{error}</p>}

                                        <div className="grid grid-cols-2 gap-4">
                                            <button type="button" onClick={() => setStep(1)} className="bg-slate-50 text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Atrás</button>
                                            <button type="submit" disabled={isLoading} className="bg-[#003366] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                                                {isLoading ? "Creando..." : "Registrar"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon: React.ReactNode;
    error?: string | null;
}

function InputField({ label, icon, error, ...props }: InputFieldProps) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
            <div className="relative">
                <div className={cn(
                    "absolute left-5 top-1/2 -translate-y-1/2 transition-colors",
                    error ? "text-red-400" : "text-slate-400"
                )}>{icon}</div>
                <input 
                    {...props} 
                    className={cn(
                        "w-full bg-slate-50 border rounded-2xl py-4 pl-12 text-sm outline-none transition-all",
                        error 
                            ? "border-red-200 focus:ring-red-500/10 focus:border-red-400" 
                            : "border-slate-200 focus:ring-blue-900/5 focus:border-[#003366]"
                    )} 
                />
            </div>
            {error && (
                <p className="text-[9px] text-red-500 font-bold ml-1 uppercase tracking-tighter">
                    {error}
                </p>
            )}
        </div>
    );
}
