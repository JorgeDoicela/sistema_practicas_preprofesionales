"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    ShieldCheck, TrendingUp, Users, GraduationCap, Building2,
    ArrowRight, CheckCircle2, ChevronRight, Star, MapPin, Brain,
    Fingerprint, Workflow, LineChart, FileSignature, Bell, QrCode,
    Database, Lock, Clock, FileCheck2, ClipboardList, Megaphone,
    Server, Cpu, Sparkles, BarChart3, HardDriveDownload, Bot,
    UserCog, Briefcase, ScrollText, ShieldAlert, Layers, Network,
    Camera, Eye, MessageSquare, History, Mail, Radio, Stamp, FileText,
    AlertTriangle, KeyRound, BookOpen, Gauge, GitBranch, Activity
} from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

/* ── helpers ── */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold text-brand-gold uppercase tracking-[0.3em] mb-4">
        <span className="w-5 h-px bg-brand-gold" />
        {children}
    </span>
);

export default function Home() {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">

            {/* ════════════════════════════════ HERO ════════════════════════════════ */}
            <section className="relative min-h-screen flex items-center overflow-hidden">
                {/* bg */}
                <div className="absolute inset-0 z-0">
                    <Image src="/hero-bg.png" alt="" fill className="object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/95 via-brand-blue/80 to-brand-blue/30" />
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-20">
                    <div className="max-w-3xl">
                        {/* badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-[10px] font-semibold uppercase tracking-widest mb-10"
                        >
                            <Star className="w-3 h-3 fill-brand-gold text-brand-gold" />
                            {t.home.hero.badge}
                        </motion.div>

                        {/* headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.7 }}
                            className="text-5xl sm:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight mb-7"
                        >
                            {t.home.hero.title1}<br />
                            {t.home.hero.title2}{" "}
                            <span className="text-brand-gold italic">{t.home.hero.titleHighlight}</span>{" "}
                            {t.home.hero.title3}
                        </motion.h1>

                        {/* sub */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.7 }}
                            className="text-white/75 text-lg leading-relaxed mb-10 max-w-2xl"
                        >
                            {t.home.hero.subtitle
                                .replace('{highlight1}', t.home.hero.subtitleHighlight1)
                                .replace('{highlight2}', t.home.hero.subtitleHighlight2)}
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-4 mb-16"
                        >
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2.5 bg-white text-brand-blue px-8 py-4 rounded-xl font-bold text-sm hover:bg-brand-gold hover:text-white transition-all shadow-xl group"
                            >
                                {t.home.hero.cta}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link
                                href="#modulos"
                                className="inline-flex items-center gap-2 border border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all"
                            >
                                {t.home.hero.ctaExplore}
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </motion.div>

                        {/* KPI strip */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                        >
                            {[
                                { value: "28+", label: t.home.hero.kpis.modules },
                                { value: "6",   label: t.home.hero.kpis.roles },
                                { value: "2",   label: t.home.hero.kpis.cron },
                                { value: "100%", label: t.home.hero.kpis.traceability },
                            ].map(k => (
                                <div key={k.label} className="bg-white/8 backdrop-blur border border-white/15 rounded-2xl p-4">
                                    <p className="text-2xl sm:text-3xl font-black text-brand-gold leading-none break-words">{k.value}</p>
                                    <p className="text-white/55 text-[11px] font-medium uppercase tracking-wider mt-1.5">{k.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* tech pills — botton right, only xl */}
                <div className="absolute bottom-8 right-8 hidden xl:flex gap-2 z-10">
                    {[
                        { icon: <Radio className="w-3.5 h-3.5" />, label: "Ubicación Satelital" },
                        { icon: <Brain className="w-3.5 h-3.5" />, label: "Visión Artificial" },
                        { icon: <Fingerprint className="w-3.5 h-3.5" />, label: "Acceso Seguro" },
                        { icon: <Stamp className="w-3.5 h-3.5" />, label: "Firma Digital" },
                    ].map(p => (
                        <div key={p.label} className="flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/20 text-white/80 text-[10px] font-semibold px-3 py-1.5 rounded-full">
                            {p.icon}{p.label}
                        </div>
                    ))}
                </div>

                {/* scroll cue */}
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block z-10"
                >
                    <div className="w-5 h-9 rounded-full border-2 border-white/25 flex justify-center pt-1.5">
                        <div className="w-1 h-2 bg-brand-gold rounded-full" />
                    </div>
                </motion.div>
            </section>

            {/* ══════════════════════════ PILARES ══════════════════════════════ */}
            <section className="py-24 px-6 lg:px-10 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-2xl mb-16">
                        <SectionLabel>{t.home.pillars.label}</SectionLabel>
                        <h2 className="text-2xl md:text-4xl font-black text-brand-blue leading-tight tracking-tight">
                            {t.home.pillars.title}
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {t.home.pillars.items.map((p, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 28 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className={`bg-white rounded-2xl border-t-4 ${
                                    i === 0 ? "border-blue-500" : i === 1 ? "border-amber-500" : "border-purple-500"
                                } p-5 sm:p-8 shadow-sm hover:shadow-lg transition-shadow`}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-12 h-12 rounded-xl ${
                                        i === 0 ? "bg-blue-500" : i === 1 ? "bg-amber-500" : "bg-purple-500"
                                    } text-white flex items-center justify-center`}>
                                        {i === 0 ? <MapPin /> : i === 1 ? <Workflow /> : <Brain />}
                                    </div>
                                    <span className="text-5xl font-black text-slate-100 leading-none select-none">{p.num}</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{p.tag}</p>
                                <h3 className="text-xl font-black text-brand-blue mb-3 leading-tight">{p.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mb-6">{p.desc}</p>
                                <ul className="space-y-2">
                                    {p.points.map(pt => (
                                        <li key={pt} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                                            {pt}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════ ANTIGRAVITY AI ══════════════════════ */}
            <section className="py-24 px-6 lg:px-10 bg-brand-blue relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/15 via-transparent to-transparent" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-14 items-center">
                        {/* left */}
                        <div>
                            <SectionLabel>{t.home.ai.label}</SectionLabel>
                            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-5">
                                {t.home.ai.title1}{" "}
                                <span className="text-brand-gold italic">{t.home.ai.titleHighlight}</span>,
                                <br />{t.home.ai.title2}
                            </h2>
                            <p className="text-white/65 leading-relaxed mb-8 max-w-lg">
                                {t.home.ai.subtitle
                                    .replace('{gpt4o}', t.home.ai.gpt4o)
                                    .replace('{zeroHallucination}', t.home.ai.zeroHallucination)}
                            </p>

                            <div className="space-y-3">
                                {t.home.ai.features.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -16 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.07 }}
                                        viewport={{ once: true }}
                                        className="flex gap-3 p-4 rounded-xl bg-white/6 border border-white/10 hover:bg-white/10 transition-colors group"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-brand-gold/20 text-brand-gold flex items-center justify-center flex-shrink-0 group-hover:bg-brand-gold group-hover:text-white transition-colors">
                                            {i === 0 ? <Eye /> : i === 1 ? <FileCheck2 /> : i === 2 ? <Gauge /> : <MessageSquare />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white mb-0.5">{item.title}</p>
                                            <p className="text-xs text-white/55 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* right — chat mockup */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                                {/* header */}
                                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 bg-slate-800/60">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Nexo AI</p>
                                        <p className="text-[10px] text-brand-gold font-semibold">{t.home.ai.chatOnline}</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] text-white/40">{t.home.ai.chatActive}</span>
                                    </div>
                                </div>

                                {/* messages */}
                                <div className="p-5 space-y-4">
                                    {/* user */}
                                    <div className="flex justify-end">
                                        <div className="max-w-[80%] bg-brand-blue px-4 py-3 rounded-2xl rounded-br-sm">
                                            <p className="text-sm text-white/90">{t.home.ai.chatQuestion}</p>
                                        </div>
                                    </div>
                                    {/* ai */}
                                    <div className="flex gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Bot className="w-3.5 h-3.5 text-brand-gold" />
                                        </div>
                                        <div className="max-w-[85%] bg-white/8 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm">
                                            <p className="text-sm text-white/85 leading-relaxed">
                                                {t.home.ai.chatAnswer
                                                    .replace('{reported}', '(142 h)')
                                                    .replace('{system}', '(156 h)')}
                                            </p>
                                        </div>
                                    </div>
                                    {/* risk card */}
                                    <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">{t.home.ai.riskTitle}</p>
                                            <p className="text-xs text-white/70 leading-relaxed">
                                                {t.home.ai.riskDesc}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* input bar */}
                                <div className="px-5 py-4 border-t border-white/8 flex items-center gap-3">
                                    <div className="flex-1 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white/35">
                                        {t.home.ai.chatPlaceholder}
                                    </div>
                                    <button className="w-9 h-9 rounded-xl bg-brand-gold flex items-center justify-center">
                                        <ArrowRight className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════ ROLES ══════════════════════════════ */}
            <section id="roles" className="py-24 px-6 lg:px-10 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <SectionLabel>{t.home.roles.label}</SectionLabel>
                        <h2 className="text-2xl md:text-4xl font-black text-brand-blue tracking-tight">{t.home.roles.title}</h2>
                        <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                            {t.home.roles.subtitle}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {t.home.roles.items.map((a, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -4 }}
                                className={`bg-white border border-slate-100 border-t-4 ${
                                    i === 0 ? "border-t-purple-500" :
                                    i === 1 ? "border-t-sky-600" :
                                    i === 2 ? "border-t-teal-500" :
                                    i === 3 ? "border-t-orange-500" :
                                    i === 4 ? "border-t-amber-500" :
                                    "border-t-blue-500"
                                } rounded-2xl p-6 shadow-sm hover:shadow-md transition-all`}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                                        i === 0 ? "from-purple-500 to-indigo-600" :
                                        i === 1 ? "from-sky-600 to-blue-700" :
                                        i === 2 ? "from-teal-500 to-emerald-600" :
                                        i === 3 ? "from-orange-500 to-red-500" :
                                        i === 4 ? "from-amber-500 to-yellow-500" :
                                        "from-blue-500 to-cyan-600"
                                    } text-white flex items-center justify-center`}>
                                        {i === 0 ? <UserCog /> : i === 1 ? <ShieldCheck /> : i === 2 ? <GraduationCap /> : i === 3 ? <Building2 /> : i === 4 ? <Briefcase /> : <Users />}
                                    </div>
                                    <h3 className="font-black text-brand-blue text-base leading-tight">{a.role}</h3>
                                </div>
                                <p className="text-slate-500 text-sm leading-relaxed mb-5">{a.desc}</p>
                                <div className="grid grid-cols-2 gap-1.5 pt-4 border-t border-slate-100">
                                    {a.features.map(f => (
                                        <div key={f} className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                                            <CheckCircle2 className="w-3 h-3 text-brand-gold flex-shrink-0" />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════ MÓDULOS ══════════════════════════════ */}
            <section id="modulos" className="py-24 px-6 lg:px-10 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <SectionLabel>{t.home.modules.label}</SectionLabel>
                        <h2 className="text-2xl md:text-4xl font-black text-brand-blue tracking-tight">
                            {t.home.modules.title}
                        </h2>
                        <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                            {t.home.modules.subtitle}
                        </p>
                    </div>

                    <div className="space-y-12">
                        {[
                            {
                                cat: t.modules_landing.academic.title, color: "bg-blue-500", text: "text-blue-600", border: "border-blue-200", light: "bg-blue-50",
                                modules: t.modules_landing.academic.items.map((m: any, i: number) => ({
                                    icon: i === 0 ? <Users /> : i === 1 ? <FileSignature /> : i === 2 ? <Layers /> : <BookOpen />,
                                    ...m
                                }))
                            },
                            {
                                cat: t.modules_landing.legal.title, color: "bg-amber-500", text: "text-amber-600", border: "border-amber-200", light: "bg-amber-50",
                                modules: t.modules_landing.legal.items.map((m: any, i: number) => ({
                                    icon: i === 0 ? <FileCheck2 /> : i === 1 ? <GitBranch /> : i === 2 ? <MessageSquare /> : <Stamp />,
                                    ...m
                                }))
                            },
                            {
                                cat: t.modules_landing.operation.title, color: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-200", light: "bg-emerald-50",
                                modules: t.modules_landing.operation.items.map((m: any, i: number) => ({
                                    icon: i === 0 ? <MapPin /> : i === 1 ? <Camera /> : i === 2 ? <Fingerprint /> : <Eye />,
                                    ...m
                                }))
                            },
                            {
                                cat: t.modules_landing.ai.title, color: "bg-purple-500", text: "text-purple-600", border: "border-purple-200", light: "bg-purple-50",
                                modules: t.modules_landing.ai.items.map((m: any, i: number) => ({
                                    icon: i === 0 ? <Bot /> : i === 1 ? <Eye /> : i === 2 ? <FileText /> : <Gauge />,
                                    ...m
                                }))
                            },
                            {
                                cat: t.modules_landing.automation.title, color: "bg-rose-500", text: "text-rose-600", border: "border-rose-200", light: "bg-rose-50",
                                modules: t.modules_landing.automation.items.map((m: any, i: number) => ({
                                    icon: i === 0 ? <Clock /> : i === 1 ? <Bell /> : i === 2 ? <Mail /> : <History />,
                                    ...m
                                }))
                            },
                            {
                                cat: t.modules_landing.certification.title, color: "bg-cyan-500", text: "text-cyan-600", border: "border-cyan-200", light: "bg-cyan-50",
                                modules: t.modules_landing.certification.items.map((m: any, i: number) => ({
                                    icon: i === 0 ? <ClipboardList /> : i === 1 ? <QrCode /> : i === 2 ? <ScrollText /> : <TrendingUp />,
                                    ...m
                                }))
                            },
                            {
                                cat: t.modules_landing.analytics.title, color: "bg-indigo-500", text: "text-indigo-600", border: "border-indigo-200", light: "bg-indigo-50",
                                modules: t.modules_landing.analytics.items.map((m: any, i: number) => ({
                                    icon: i === 0 ? <BarChart3 /> : i === 1 ? <LineChart /> : i === 2 ? <Database /> : <HardDriveDownload />,
                                    ...m
                                }))
                            },
                            {
                                cat: t.modules_landing.governance.title, color: "bg-slate-600", text: "text-slate-600", border: "border-slate-200", light: "bg-slate-50",
                                modules: t.modules_landing.governance.items.map((m: any, i: number) => ({
                                    icon: i === 0 ? <Lock /> : i === 1 ? <ShieldAlert /> : i === 2 ? <BookOpen /> : <Network />,
                                    ...m
                                }))
                            },
                        ].map((cat, ci) => (
                            <motion.div
                                key={cat.cat}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                {/* category header */}
                                <div className="flex items-center gap-3 mb-5">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${cat.light} border ${cat.border} ${cat.text} text-xs font-bold`}>
                                        <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                                        {String(ci + 1).padStart(2, "0")} — {cat.cat}
                                    </span>
                                    <div className="flex-1 h-px bg-slate-200" />
                                </div>

                                {/* module cards */}
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {cat.modules.map((m, mi) => (
                                        <motion.div
                                            key={m.title}
                                            initial={{ opacity: 0, y: 14 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ delay: mi * 0.04 }}
                                            viewport={{ once: true }}
                                            className={`bg-white border-l-4 ${cat.border.replace("border", "border-l")} rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow`}
                                        >
                                            <div className={`w-9 h-9 rounded-lg ${cat.color} text-white flex items-center justify-center mb-3 [&>svg]:w-4 [&>svg]:h-4`}>
                                                {m.icon}
                                            </div>
                                            <p className="font-bold text-slate-800 text-sm mb-1">{m.title}</p>
                                            <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════ STACK ═══════════════════════════════ */}
            <section className="py-24 px-6 lg:px-10 bg-slate-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <SectionLabel>{t.home.stack.label}</SectionLabel>
                        <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">{t.home.stack.title}</h2>
                        <p className="text-white/50 mt-3 text-sm">
                            {t.home.stack.subtitle.replace('{highlight}', t.home.stack.highlight)}
                        </p>
                    </div>

                    {[
                        {
                            layer: "Interfaz y Experiencia", items: [
                                { icon: <Cpu />, name: "Tecnología Moderna", sub: "Rápida y Fluida" },
                                { icon: <Sparkles />, name: "Diseño Adaptable", sub: "Escritorio y Móvil" },
                            ]
                        },
                        {
                            layer: "Motor del Sistema", items: [
                                { icon: <Server />, name: "Núcleo Seguro", sub: "Procesamiento de datos" },
                                { icon: <Database />, name: "Base de Datos", sub: "Almacenamiento estructurado" },
                                { icon: <KeyRound />, name: "Acceso Protegido", sub: "Validación de identidad" },
                                { icon: <ShieldAlert />, name: "Escudo de Seguridad", sub: "Protección de tráfico" },
                            ]
                        },
                        {
                            layer: "IA y Automatización", items: [
                                { icon: <Brain />, name: "Cerebro Nexo", sub: "Chat + Visión + Datos" },
                                { icon: <Clock />, name: "Tareas Automáticas", sub: "Ejecución cada medianoche" },
                                { icon: <Bell />, name: "Avisos en Vivo", sub: "Notificaciones instantáneas" },
                                { icon: <Mail />, name: "Envío Seguro", sub: "Notificaciones por email" },
                            ]
                        },
                        {
                            layer: "Seguridad y Archivo", items: [
                                { icon: <Fingerprint />, name: "Biometría", sub: "Huella y Rostro" },
                                { icon: <HardDriveDownload />, name: "Nube Segura", sub: "Archivos y documentos" },
                                { icon: <FileText />, name: "Generador Oficial", sub: "Certificados en PDF" },
                                { icon: <BarChart3 />, name: "Reportes Excel", sub: "Informes maestros" },
                            ]
                        },
                    ].map(row => (
                        <div key={row.layer} className="mb-8">
                            <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-3">{row.layer}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {row.items.map(t => (
                                    <div key={t.name} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3 hover:bg-white/9 hover:border-brand-gold/30 transition-colors group">
                                        <div className="w-8 h-8 rounded-lg bg-brand-gold/15 text-brand-gold flex items-center justify-center flex-shrink-0 group-hover:bg-brand-gold group-hover:text-white transition-colors [&>svg]:w-4 [&>svg]:h-4">
                                            {t.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white leading-tight">{t.name}</p>
                                            <p className="text-[10px] text-white/40 mt-0.5">{t.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════ FLUJO LEGAL ════════════════════════ */}
            <section id="flujo" className="py-24 px-6 lg:px-10 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-3 gap-14">
                        {/* sticky left */}
                        <div className="lg:sticky lg:top-24 lg:self-start">
                            <SectionLabel>{t.home.flow.label}</SectionLabel>
                            <h2 className="text-2xl md:text-4xl font-black text-brand-blue tracking-tight leading-tight mb-5">
                                {t.home.flow.title.split('en')[0]}<br />{t.home.flow.title.split('en')[1] ? 'en ' + t.home.flow.title.split('en')[1] : ''}
                            </h2>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                {t.home.flow.subtitle}
                            </p>
                            <Link href="/servicios" className="inline-flex items-center gap-2 text-brand-gold font-bold text-sm group">
                                {t.home.flow.cta}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>

                        {/* timeline */}
                        <div className="lg:col-span-2 relative">
                            {/* vertical line */}
                            <div className="absolute left-[17px] top-5 bottom-5 w-px bg-slate-200 hidden sm:block" />

                            <div className="space-y-4">
                                {t.home.flow.steps.map((step, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        viewport={{ once: true }}
                                        className="flex gap-5 group"
                                    >
                                        {/* circle */}
                                        <div className="relative flex-shrink-0 w-9 h-9 rounded-full bg-white border-2 border-slate-200 group-hover:border-brand-gold group-hover:bg-brand-gold transition-all flex items-center justify-center z-10">
                                            <span className="text-[11px] font-black text-slate-400 group-hover:text-white transition-colors">
                                                {String(i + 1).padStart(2, "0")}
                                            </span>
                                        </div>
                                        {/* card */}
                                        <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-brand-gold/30 hover:bg-white hover:shadow-sm transition-all mb-1">
                                            <p className="font-bold text-brand-blue text-sm mb-1">{step.title}</p>
                                            <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════ SEGURIDAD ══════════════════════════ */}
            <section className="py-24 px-6 lg:px-10 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-14 items-center">
                        <div>
                            <SectionLabel>{t.home.security.label}</SectionLabel>
                            <h2 className="text-2xl md:text-4xl font-black text-brand-blue tracking-tight mb-5">
                                {t.home.security.title.split(',')[0]},<br />{t.home.security.title.split(',')[1] || ''}
                            </h2>
                            <p className="text-slate-500 leading-relaxed mb-8 text-sm">
                                {t.home.security.subtitle
                                    .replace('{law}', t.home.security.law)
                                    .replace('{arco}', t.home.security.arco)
                                    .replace('{model}', t.home.security.model)}
                            </p>

                            <div className="space-y-3">
                                {t.home.security.features.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -16 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        viewport={{ once: true }}
                                        className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-brand-blue/20 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-brand-blue/8 text-brand-blue flex items-center justify-center flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4">
                                            {i === 0 ? <Lock /> : i === 1 ? <FileText /> : i === 2 ? <Database /> : <ShieldAlert />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm mb-0.5">{item.title}</p>
                                            <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-brand-blue to-slate-900 rounded-2xl p-10 text-white shadow-xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-gold/10 blur-3xl rounded-full" />
                            <div className="relative z-10">
                                <ShieldCheck className="w-12 h-12 text-brand-gold mb-6" />
                                <h3 className="text-2xl font-black mb-3">{t.home.security.zeroTrust}</h3>
                                <p className="text-white/60 text-sm leading-relaxed mb-8">
                                    {t.home.security.zeroTrustDesc}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {t.home.security.kpis.map(s => (
                                        <div key={s.l} className="bg-white/6 border border-white/10 rounded-xl p-4">
                                            <p className="text-2xl font-black text-brand-gold">{s.v}</p>
                                            <p className="text-[10px] text-white/50 uppercase tracking-wider mt-1">{s.l}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════ CTA FINAL ══════════════════════════ */}
            <section className="py-24 px-6 lg:px-10 bg-brand-blue relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-gold/15 via-transparent to-transparent" />
                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-8">
                            <Sparkles className="w-3 h-3 text-brand-gold" />
                            {t.home.cta.badge}
                        </div>
                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-5">
                            {t.home.cta.title}
                        </h2>
                        <p className="text-white/60 mb-10 text-lg leading-relaxed">
                            {t.home.cta.subtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/login" className="inline-flex items-center justify-center gap-2.5 bg-white text-brand-blue px-8 py-4 rounded-xl font-bold text-sm hover:bg-brand-gold hover:text-white transition-all shadow-xl group">
                                {t.home.cta.login}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link href="/empresas" className="inline-flex items-center justify-center gap-2 border border-brand-gold text-brand-gold px-8 py-4 rounded-xl font-bold text-sm hover:bg-brand-gold hover:text-white transition-all">
                                {t.home.cta.corporate}
                            </Link>
                            <Link href="/nosotros" className="inline-flex items-center justify-center gap-2 border border-white/25 text-white/80 px-8 py-4 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all">
                                {t.home.cta.about}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

        </div>
    );
}
