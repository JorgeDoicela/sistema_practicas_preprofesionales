"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
    Building2, 
    Handshake, 
    ShieldCheck, 
    Briefcase, 
    ArrowRight, 
    FileCheck2,
    CheckCircle2
} from "lucide-react";

export default function EmpresasPage() {
    return (
        <div className="pt-32 pb-20">
            {/* Hero Section */}
            <section className="px-6 mb-24">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                    <div className="flex-1">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.5em] mb-4 block">Alianzas Estratégicas</span>
                            <h1 className="text-5xl md:text-7xl font-black text-brand-blue mb-8 tracking-tighter">
                                Potencie su Talento <br /> con el ISTPET.
                            </h1>
                            <p className="text-slate-500 max-w-xl font-medium text-lg leading-relaxed mb-10">
                                Únase a nuestra red de Entidades Receptoras y contribuya a la formación de los futuros profesionales del país mientras fortalece su equipo de trabajo.
                            </p>
                            <Link href="/login" className="bg-brand-blue text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-brand-gold transition-all inline-flex items-center gap-4 group">
                                Acceder al Portal
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <p className="mt-6 text-xs text-slate-500 font-medium">
                                Tratamiento de datos personales:{" "}
                                <Link href="/privacidad" className="text-brand-blue font-bold hover:underline underline-offset-2">
                                    aviso de privacidad
                                </Link>
                            </p>
                        </motion.div>
                    </div>
                    <div className="flex-1 hidden lg:block">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-brand-gold/10 rounded-full blur-3xl shadow-2xl" />
                            <div className="glass p-12 rounded-[4rem] border border-white relative overflow-hidden flex flex-col items-center">
                                <Handshake className="w-32 h-32 text-brand-gold mb-8 opacity-20" />
                                <div className="space-y-4 w-full">
                                    <div className="h-4 bg-brand-blue/10 rounded-full w-full" />
                                    <div className="h-4 bg-brand-blue/5 rounded-full w-3/4 mx-auto" />
                                    <div className="h-4 bg-brand-blue/5 rounded-full w-1/2 mx-auto" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Beneficios Corporativos */}
            <section className="px-6 py-24 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-brand-blue mb-6 tracking-tight italic">Beneficios para su Empresa</h2>
                        <div className="w-20 h-1.5 bg-brand-gold mx-auto rounded-full" />
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {[
                            {
                                icon: <ShieldCheck />,
                                title: "Respaldo Legal",
                                desc: "Procesos alineados a la normativa del Consejo de Educación Superior (CES) y SENESCYT en Ecuador."
                            },
                            {
                                icon: <Briefcase />,
                                title: "Captación de Talento",
                                desc: "Acceso preferencial a una cantera de técnicos altamente capacitados y con ética profesional."
                            },
                            {
                                icon: <FileCheck2 />,
                                title: "Gestión Simplificada",
                                desc: "Administración digital de convenios, eliminando la carga burocrática del seguimiento manual."
                            }
                        ].map((benefit, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex flex-col items-center text-center group"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center text-brand-blue mb-8 border border-slate-100 group-hover:bg-brand-blue group-hover:text-white transition-all shadow-xl shadow-slate-200/50">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-xl font-black text-brand-blue mb-4 uppercase tracking-tight">{benefit.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{benefit.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Proceso de Registro */}
            <section className="px-6 py-32 bg-slate-50">
                <div className="max-w-5xl mx-auto">
                    <div className="glass p-16 rounded-[4rem] border border-white shadow-[0_50px_100px_-20px_rgba(0,0,30,0.1)]">
                        <h3 className="text-3xl font-black text-brand-blue text-center mb-16 italic tracking-tight italic">Cómo Empezar</h3>
                        <div className="space-y-12">
                            {[
                                { t: "Asignación de Credenciales", d: "Solicite sus accesos institucionales al departamento de Vinculación ISTPET." },
                                { t: "Convenio Marco", d: "Suscripción del convenio de cooperación interinstitucional." },
                                { t: "Publicación", d: "Defina las áreas y perfiles requeridos para los pasantes." },
                                { t: "Inicio de Prácticas", d: "Acompañamiento técnico y validación digital." }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-8 items-start">
                                    <div className="w-12 h-12 rounded-full bg-brand-blue text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-blue-900/10">
                                        0{i+1}
                                    </div>
                                    <div className="pt-2">
                                        <h4 className="text-lg font-bold text-brand-blue mb-1 uppercase tracking-tighter italic">{step.t}</h4>
                                        <p className="text-slate-500 text-sm font-medium">{step.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
