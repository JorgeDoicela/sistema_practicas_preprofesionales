"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    GraduationCap, Building2, Users, ShieldCheck,
    MapPin, QrCode, CheckCircle2, ArrowRight,
    Zap, Brain, Fingerprint, Clock, FileCheck2, Bell
} from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold text-brand-gold uppercase tracking-[0.3em] mb-4">
        <span className="w-4 h-px bg-brand-gold" />{children}
    </span>
);

export default function ServiciosPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-white">

            {/* ── Hero ── */}
            <section className="relative bg-brand-blue overflow-hidden pt-32 pb-24 px-6 lg:px-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-brand-gold/15 via-transparent to-transparent" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-8">
                            <Zap className="w-3 h-3 text-brand-gold" />
                            {t.home.hero.badge}
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
                            {t.services.hero.title.split('of')[0]}
                            {t.services.hero.title.includes('of') ? 'of' : ''}
                            <br />
                            <span className="text-brand-gold italic">
                                {t.services.hero.title.includes('of') ? t.services.hero.title.split('of')[1] : t.services.hero.title}
                            </span>
                        </h1>
                        <p className="text-white/65 text-lg leading-relaxed max-w-xl">
                            {t.services.hero.subtitle}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── Servicios por rol ── */}
            <section className="py-24 px-6 lg:px-10 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <SectionLabel>{t.services.roles.label}</SectionLabel>
                        <h2 className="text-2xl md:text-4xl font-black text-brand-blue tracking-tight">
                            {t.services.roles.title}
                        </h2>
                        <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                            {t.services.roles.subtitle}
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {t.services.roles.items.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className={`bg-white rounded-2xl border border-slate-100 border-t-4 ${
                                    i === 0 ? "border-t-sky-500" : i === 1 ? "border-t-orange-500" : "border-t-teal-500"
                                } p-5 sm:p-8 shadow-sm hover:shadow-md transition-shadow`}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`w-11 h-11 rounded-xl ${
                                        i === 0 ? "bg-sky-500" : i === 1 ? "bg-orange-500" : "bg-teal-500"
                                    } text-white flex items-center justify-center`}>
                                        {i === 0 ? <GraduationCap /> : i === 1 ? <Building2 /> : <Users />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.role}</p>
                                        <h3 className="font-black text-brand-blue text-lg leading-tight">{s.title}</h3>
                                    </div>
                                </div>
                                <ul className="space-y-3">
                                    {s.features.map(f => (
                                        <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                                            <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Tecnología ── */}
            <section className="py-24 px-6 lg:px-10 bg-brand-blue relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-brand-gold/10 via-transparent to-transparent" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <SectionLabel>{t.services.tech.label}</SectionLabel>
                        <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                            {t.services.tech.title}
                        </h2>
                        <p className="text-white/55 mt-3 text-sm">
                            {t.services.tech.subtitle}
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {t.services.tech.items.map((t_item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                viewport={{ once: true }}
                                className="bg-white/6 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-brand-gold/20 text-brand-gold flex items-center justify-center mb-4 group-hover:bg-brand-gold group-hover:text-white transition-colors">
                                    {i === 0 ? <MapPin /> : i === 1 ? <QrCode /> : i === 2 ? <Brain /> : i === 3 ? <Fingerprint /> : i === 4 ? <FileCheck2 /> : <Bell />}
                                </div>
                                <h4 className="font-bold text-white mb-2">{t_item.title}</h4>
                                <p className="text-white/55 text-sm leading-relaxed">{t_item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-20 px-6 lg:px-10 bg-slate-50">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-2xl md:text-3xl font-black text-brand-blue tracking-tight mb-4">
                            {t.services.cta.title}
                        </h2>
                        <p className="text-slate-500 text-sm mb-8">
                            {t.services.cta.subtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-brand-blue text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-brand-gold transition-all shadow-lg group">
                                {t.services.cta.btnSystem}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link href="/nosotros" className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 px-8 py-4 rounded-xl font-semibold text-sm hover:border-brand-blue hover:text-brand-blue transition-all">
                                {t.services.cta.btnAbout}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

        </div>
    );
}
