"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    Building2, Handshake, ShieldCheck, Briefcase,
    ArrowRight, FileCheck2, CheckCircle2, Users,
    ChevronRight, Star
} from "lucide-react";

const SectionLabel = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
    <span className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] mb-4 ${dark ? "text-brand-gold" : "text-brand-gold"}`}>
        <span className="w-4 h-px bg-brand-gold" />{children}
    </span>
);

export default function EmpresasPage() {
    return (
        <div className="min-h-screen bg-white">

            {/* ── Hero split ── */}
            <section className="relative bg-brand-blue overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/15 via-transparent to-transparent" />
                <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-32 pb-24 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-14 items-center">
                        {/* left */}
                        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-8">
                                <Star className="w-3 h-3 text-brand-gold" />
                                Alianzas estratégicas
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
                                Potencie su talento<br />
                                <span className="text-brand-gold italic">con el ISTPET.</span>
                            </h1>
                            <p className="text-white/65 text-lg leading-relaxed mb-10 max-w-lg">
                                Únase a nuestra red de Entidades Receptoras y contribuya a la formación de los futuros
                                profesionales del país mientras fortalece su equipo de trabajo.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/login" className="inline-flex items-center gap-2.5 bg-white text-brand-blue px-8 py-4 rounded-xl font-bold text-sm hover:bg-brand-gold hover:text-white transition-all shadow-xl group">
                                    Acceder al Portal
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                                <Link href="/privacidad" className="inline-flex items-center gap-2 border border-white/25 text-white/80 px-6 py-4 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all">
                                    Aviso de privacidad
                                </Link>
                            </div>
                        </motion.div>

                        {/* right — stats */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="hidden lg:block"
                        >
                            <div className="bg-white/8 border border-white/15 rounded-2xl p-8 backdrop-blur">
                                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
                                    <div className="w-12 h-12 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center">
                                        <Handshake className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">Portal Corporativo</p>
                                        <p className="text-[10px] text-white/45 uppercase tracking-wider">Entidades Receptoras</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {[
                                        { v: "100%", l: "Digital" },
                                        { v: "CES", l: "Normativa" },
                                        { v: "RUC", l: "Registro único" },
                                        { v: "0", l: "Papeleo físico" },
                                    ].map(s => (
                                        <div key={s.l} className="bg-white/6 border border-white/10 rounded-xl p-4">
                                            <p className="text-2xl font-black text-brand-gold">{s.v}</p>
                                            <p className="text-[10px] text-white/45 uppercase tracking-wider mt-1">{s.l}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    {["Convenio digital versionado", "Evaluación dual con 5 rúbricas", "Firma electrónica SHA-256"].map(f => (
                                        <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                                            <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0" />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Beneficios ── */}
            <section className="py-24 px-6 lg:px-10 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <SectionLabel>Beneficios</SectionLabel>
                        <h2 className="text-4xl font-black text-brand-blue tracking-tight">¿Por qué unirse?</h2>
                        <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                            Más que pasantías: una alianza estratégica con respaldo legal, gestión digital y talento verificado.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <ShieldCheck className="w-6 h-6" />,
                                title: "Respaldo Legal",
                                desc: "Procesos alineados a la normativa del Consejo de Educación Superior (CES) y SENESCYT en Ecuador.",
                                color: "bg-blue-500",
                                border: "border-t-blue-500",
                            },
                            {
                                icon: <Briefcase className="w-6 h-6" />,
                                title: "Captación de Talento",
                                desc: "Acceso preferencial a una cantera de técnicos capacitados y evaluados con ética profesional.",
                                color: "bg-amber-500",
                                border: "border-t-amber-500",
                            },
                            {
                                icon: <FileCheck2 className="w-6 h-6" />,
                                title: "Gestión Simplificada",
                                desc: "Convenios digitales, seguimiento en tiempo real y evaluaciones duales sin carga burocrática manual.",
                                color: "bg-teal-500",
                                border: "border-t-teal-500",
                            },
                        ].map((b, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className={`bg-white rounded-2xl border border-slate-100 border-t-4 ${b.border} p-8 shadow-sm hover:shadow-md transition-shadow`}
                            >
                                <div className={`w-11 h-11 rounded-xl ${b.color} text-white flex items-center justify-center mb-5`}>
                                    {b.icon}
                                </div>
                                <h3 className="font-black text-brand-blue text-lg mb-3">{b.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{b.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Cómo empezar ── */}
            <section className="py-24 px-6 lg:px-10 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <SectionLabel>Proceso de incorporación</SectionLabel>
                        <h2 className="text-4xl font-black text-brand-blue tracking-tight">Cómo empezar</h2>
                        <p className="text-slate-500 mt-3 text-sm">En cuatro pasos su empresa estará lista para recibir pasantes.</p>
                    </div>

                    <div className="relative">
                        {/* connector line */}
                        <div className="absolute left-[19px] top-5 bottom-5 w-px bg-slate-200 hidden sm:block" />

                        <div className="space-y-5">
                            {[
                                { t: "Solicitud de Credenciales", d: "Contacte al departamento de Vinculación ISTPET para obtener sus accesos al portal corporativo." },
                                { t: "Convenio Marco Digital", d: "Suscripción del convenio de cooperación interinstitucional con firma electrónica SHA-256." },
                                { t: "Configuración de Plazas", d: "Defina las áreas, perfiles y allowedLocations (sedes GPS) para los pasantes." },
                                { t: "Acompañamiento Activo", d: "Gestione evaluaciones duales, valide horas y comuníquese en tiempo real con tutores académicos." },
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    viewport={{ once: true }}
                                    className="flex gap-5 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 group-hover:border-brand-gold group-hover:bg-brand-gold transition-all flex items-center justify-center z-10 flex-shrink-0">
                                        <span className="text-[11px] font-black text-slate-400 group-hover:text-white transition-colors">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                    </div>
                                    <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-brand-gold/30 hover:bg-white hover:shadow-sm transition-all mb-1">
                                        <p className="font-bold text-brand-blue text-sm mb-1">{step.t}</p>
                                        <p className="text-xs text-slate-500 leading-relaxed">{step.d}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <Link href="/login" className="inline-flex items-center gap-2 bg-brand-blue text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-brand-gold transition-all shadow-lg group">
                            Comenzar ahora
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
}
