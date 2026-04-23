"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, Target, Users, MapPin, Globe2, ArrowRight, CheckCircle2 } from "lucide-react";

const SectionLabel = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
    <span className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] mb-4 text-brand-gold`}>
        <span className="w-4 h-px bg-brand-gold" />{children}
    </span>
);

export default function NosotrosPage() {
    return (
        <div className="min-h-screen bg-white">

            {/* ── Hero ── */}
            <section className="relative bg-brand-blue overflow-hidden pt-32 pb-24 px-6 lg:px-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/15 via-transparent to-transparent" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-8">
                            Nuestra identidad
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
                            Excelencia en<br />
                            <span className="text-brand-gold italic">Formación Técnica</span>
                        </h1>
                        <p className="text-white/65 text-lg leading-relaxed max-w-xl">
                            El Instituto Superior Tecnológico &ldquo;Mayor Pedro Traversari&rdquo; (ISTPET) es una institución
                            comprometida con el desarrollo profesional y productivo del Ecuador.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── Misión y Visión ── */}
            <section className="py-24 px-6 lg:px-10 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <SectionLabel>Identidad institucional</SectionLabel>
                        <h2 className="text-2xl md:text-4xl font-black text-brand-blue tracking-tight">Misión y Visión</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-2xl border-t-4 border-t-brand-gold border border-slate-100 p-6 md:p-10 shadow-sm"
                        >
                            <div className="w-12 h-12 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-6">
                                <Target className="w-6 h-6" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">01 · Misión</p>
                            <h3 className="text-2xl font-black text-brand-blue mb-5 tracking-tight">Nuestra Misión</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Formar profesionales competitivos, creativos, íntegros y con valores, con un elevado nivel
                                académico, científico, investigativo y tecnológico, sobre la base de un modelo de calidad, que
                                contribuyan de manera activa al desarrollo del sector productivo y social.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-brand-blue rounded-2xl border-t-4 border-t-brand-gold p-10 shadow-xl"
                        >
                            <div className="w-12 h-12 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center mb-6">
                                <Globe2 className="w-6 h-6" />
                            </div>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">02 · Visión</p>
                            <h3 className="text-2xl font-black text-white mb-5 tracking-tight">Nuestra Visión</h3>
                            <p className="text-white/70 leading-relaxed text-sm">
                                Ser un Instituto Superior Tecnológico acreditado con reconocimiento de la sociedad,
                                fundamentado en una gestión académica y administrativa de calidad, con infraestructura
                                tecnológica adecuada y proyectos de vinculación que aporten a la solución de problemas locales.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Info + Logo ── */}
            <section className="py-24 px-6 lg:px-10 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-14 items-center">
                        {/* left */}
                        <div className="space-y-6">
                            <div>
                                <SectionLabel>Información institucional</SectionLabel>
                                <h2 className="text-2xl md:text-4xl font-black text-brand-blue tracking-tight">
                                    Conózcanos
                                </h2>
                            </div>

                            {/* location */}
                            <div className="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-brand-blue/8 text-brand-blue flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-brand-blue text-sm mb-1">Sede Principal</p>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        Av. Matilde Álvarez y Hugo Díaz Romero, Sector Chillogallo.<br />
                                        Quito, Ecuador.
                                    </p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {[
                                    { icon: <Users className="w-5 h-5" />, title: "Comunidad", desc: "Más de 5,000 profesionales formados con ética y rigor técnico." },
                                    { icon: <GraduationCap className="w-5 h-5" />, title: "Oferta Académica", desc: "Tecnologías superiores alineadas a la demanda laboral real." },
                                ].map((c, i) => (
                                    <div key={i} className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-9 h-9 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-3">
                                            {c.icon}
                                        </div>
                                        <p className="font-bold text-brand-blue text-sm mb-1">{c.title}</p>
                                        <p className="text-slate-500 text-xs leading-relaxed">{c.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2">
                                <p className="text-sm font-semibold text-brand-blue mb-3">Valores institucionales</p>
                                <div className="flex flex-wrap gap-2">
                                    {["Ética", "Innovación", "Excelencia", "Responsabilidad social", "Rigor técnico", "Inclusión"].map(v => (
                                        <span key={v} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                                            <CheckCircle2 className="w-3 h-3 text-brand-gold" />
                                            {v}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* right — logo panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="absolute -inset-4 bg-brand-gold/8 rounded-3xl blur-2xl" />
                            <div className="relative bg-gradient-to-br from-brand-blue to-slate-900 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[380px] shadow-xl overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-gold/15 rounded-full blur-3xl" />
                                <Image
                                    src="/images/Logo.png"
                                    alt="ISTPET"
                                    width={200}
                                    height={80}
                                    className="opacity-90 object-contain relative z-10"
                                />
                                <div className="mt-8 text-center relative z-10">
                                    <p className="text-2xl font-black text-white tracking-tight italic">Traversari</p>
                                    <p className="text-xs font-bold text-brand-gold uppercase tracking-[0.3em] mt-1">
                                        Instituto Superior Tecnológico
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-20 px-6 lg:px-10 bg-slate-50">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-black text-brand-blue tracking-tight mb-4">
                        Parte del ISTPET
                    </h2>
                    <p className="text-slate-500 text-sm mb-8">
                        Si eres estudiante, empresa o tutor, el ecosistema EmiTesis está listo para ti.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-brand-blue text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-brand-gold transition-all shadow-lg group">
                            Acceder al sistema
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <Link href="/servicios" className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 px-8 py-4 rounded-xl font-semibold text-sm hover:border-brand-blue hover:text-brand-blue transition-all">
                            Ver servicios
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
}
