"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    ShieldCheck,
    TrendingUp,
    Users,
    GraduationCap,
    Building2,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    Star
} from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-brand-gold/30">
            {/* Hero Section Inmersiva */}
            <section className="relative min-h-screen flex items-center pt-20 px-6 overflow-hidden">
                {/* Background Image with Blur Overlay */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/hero-bg.png"
                        alt="Background"
                        fill
                        className="object-cover scale-110"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/90 via-brand-blue/40 to-white/10" />
                    <div className="absolute inset-0 backdrop-blur-[2px]" />
                </div>

                <div className="max-w-7xl mx-auto w-full relative z-10 grid lg:grid-cols-12 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="lg:col-span-7"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/20 border border-brand-gold/30 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                            <Star className="w-3 h-3 fill-brand-gold" />
                            Formación Tecnológica Superior - ISTPET
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tighter">
                            Transformando las <br />
                            <span className="text-brand-gold italic">Prácticas</span> del <br /> Futuro.
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-10 max-w-xl font-medium">
                            La plataforma de vinculación que forma profesionales competitivos e íntegros. Conectando al ISTPET con el sector productivo para una gestión de prácticas eficiente y certificada.
                        </p>
                        <div className="flex flex-wrap gap-5">
                            <Link href="/login" className="bg-white text-brand-blue px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-brand-gold hover:text-white transition-all flex items-center gap-3 group">
                                Acceder al Sistema
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/nosotros" className="glass text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/30">
                                Conoce el ISTPET
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="lg:col-span-5 hidden lg:block"
                    >
                        <div className="relative">
                            <div className="absolute -inset-4 bg-brand-gold/20 rounded-3xl blur-3xl animate-pulse" />
                            <div className="glass p-8 rounded-[2rem] border border-white/20 shadow-inner relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-3xl rounded-full" />
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 border border-white/10">
                                        <div className="w-12 h-12 rounded-xl bg-brand-gold flex items-center justify-center">
                                            <TrendingUp className="text-white w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-brand-gold uppercase tracking-tighter">Excelencia ISTPET</p>
                                            <p className="text-sm font-bold text-white uppercase italic">Formación Integral</p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/10 w-full" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-brand-blue/30 border border-white/5 flex flex-col items-center">
                                            <TrendingUp className="text-brand-gold w-6 h-6 mb-2" />
                                            <p className="text-2xl font-black text-white">2 Años</p>
                                            <p className="text-[10px] font-bold text-white/50 uppercase">De Estudio</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-brand-blue/30 border border-white/5 flex flex-col items-center">
                                            <GraduationCap className="text-brand-gold w-6 h-6 mb-2" />
                                            <p className="text-2xl font-black text-white">+10</p>
                                            <p className="text-[10px] font-bold text-white/50 uppercase">Carreras</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:block"
                >
                    <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center p-1.5">
                        <div className="w-1 h-2 bg-brand-gold rounded-full" />
                    </div>
                </motion.div>
            </section>

            {/* Actor Ecosystem Section */}
            <section id="servicios" className="py-32 px-6 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="text-[11px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4 block"
                        >
                            Sistema de Gestión de Prácticas Preprofesionales
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-black text-brand-blue mb-6 tracking-tight"
                        >
                            Una Plataforma, Todos los Actores.
                        </motion.h2>
                        <p className="text-slate-500 max-w-2xl mx-auto font-medium">
                            Diseñamos una experiencia específica para cada rol en el proceso de formación, asegurando transparencia y eficiencia.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                role: "Estudiantes",
                                icon: <GraduationCap />,
                                color: "bg-blue-500",
                                desc: "Encuentra plazas, registra asistencia con geolocalización y genera reportes automáticos.",
                                highlights: ["Asistencia GPS", "Bitácoras Digitales", "Horas en Tiempo Real"]
                            },
                            {
                                role: "Empresas",
                                icon: <Building2 />,
                                color: "bg-orange-500",
                                desc: "Atrae talento joven, evalúa pasantes y gestiona convenios de forma simplificada.",
                                highlights: ["Gestión Vacantes", "Evaluaciones 360", "Archivo de Convenios"]
                            },
                            {
                                role: "Tutores",
                                icon: <Users />,
                                color: "bg-teal-500",
                                desc: "Supervisa el progreso académico, valida informes técnicos y guía el aprendizaje práctico.",
                                highlights: ["Validación Masiva", "Feedback Directo", "Alertas de Desempeño"]
                            },
                            {
                                role: "Coordinadores",
                                icon: <ShieldCheck />,
                                color: "bg-purple-500",
                                desc: "Control administrativo total, métricas institucionales y emisión de certificados QR.",
                                highlights: ["Métricas Macro", "Resoluciones Legales", "Seguridad de Datos"]
                            }
                        ].map((actor, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all cursor-default"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${actor.color} text-white flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform`}>
                                    {actor.icon}
                                </div>
                                <h3 className="text-xl font-black text-brand-blue mb-3">{actor.role}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mb-6 font-medium">
                                    {actor.desc}
                                </p>
                                <ul className="space-y-3 border-t border-slate-200 pt-6">
                                    {actor.highlights.map(h => (
                                        <li key={h} className="flex items-center gap-2 text-[11px] font-bold text-brand-blue/70 uppercase">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold" />
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The Process: Timeline Estilizada */}
            <section id="empresas" className="py-32 px-6 bg-brand-blue relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-gold/5 blur-3xl rounded-full" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row gap-16 items-start">
                        <div className="md:w-1/3">
                            <h3 className="text-[11px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4">El Flujo Legal</h3>
                            <h2 className="text-4xl font-black text-white mb-8 tracking-tighter italic">
                                Cómo funciona en Ecuador
                            </h2>
                            <p className="text-white/60 font-medium leading-relaxed mb-8">
                                El proceso de prácticas preprofesionales bajo la normativa del CES y SENESCYT, integrado en un flujo 100% digital.
                            </p>
                            <Link href="/servicios" className="inline-flex items-center gap-2 text-brand-gold font-bold uppercase tracking-widest text-[10px] group">
                                Ver Servicios Académicos
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="md:w-2/3 grid gap-6">
                            {[
                                { title: "Convenio de Cooperación", desc: "Vinculación formal entre el ISTPET y la Entidad Receptora.", tag: "Fase 01" },
                                { title: "Plan de Prácticas", desc: "Definición de actividades guiadas y objetivos de aprendizaje.", tag: "Fase 02" },
                                { title: "Ejecución y Monitoreo", desc: "Registro de asistencia y validación semanal de bitácoras.", tag: "Fase 03" },
                                { title: "Certificación y Cierre", desc: "Evaluación final y emisión del certificado oficial con QR.", tag: "Fase 04" }
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass-dark p-8 rounded-[1.5rem] border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-8">
                                        <span className="text-5xl font-black text-brand-gold group-hover:scale-110 transition-transform">{i + 1}</span>
                                        <div>
                                            <p className="text-xs font-black text-brand-gold/60 uppercase mb-1">{step.tag}</p>
                                            <h4 className="text-xl font-bold text-white uppercase tracking-tight italic">{step.title}</h4>
                                            <p className="text-sm text-white/40 font-medium">{step.desc}</p>
                                        </div>
                                    </div>
                                    <CheckCircle2 className="w-8 h-8 text-white/10 group-hover:text-brand-gold transition-colors" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-4xl mx-auto text-center glass rounded-[3rem] p-16 shadow-2xl border border-slate-100">
                    <h2 className="text-4xl font-black text-brand-blue mb-8 tracking-tighter">
                        ¿Listo para seguir adelante?
                    </h2>
                    <p className="text-slate-500 mb-12 font-medium max-w-xl mx-auto">
                        Únete a los cientos de estudiantes y empresas que ya están transformando la educación técnica en Ecuador.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/login" className="bg-brand-blue text-white px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                            Acceso como Estudiante
                        </Link>
                        <Link href="/empresas" className="bg-brand-gold text-white px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                            Acceso Corporativo
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
