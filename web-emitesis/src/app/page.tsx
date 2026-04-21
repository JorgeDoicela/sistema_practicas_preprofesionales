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

/* ── helpers ── */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold text-brand-gold uppercase tracking-[0.3em] mb-4">
        <span className="w-5 h-px bg-brand-gold" />
        {children}
    </span>
);

export default function Home() {
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
                            Plataforma Institucional ISTPET · EmiTesis
                        </motion.div>

                        {/* headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.7 }}
                            className="text-5xl sm:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight mb-7"
                        >
                            Gobernanza digital<br />
                            de las{" "}
                            <span className="text-brand-gold italic">Prácticas</span>{" "}
                            Preprofesionales.
                        </motion.h1>

                        {/* sub */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.7 }}
                            className="text-white/75 text-lg leading-relaxed mb-10 max-w-2xl"
                        >
                            Sistema <span className="text-white font-semibold">Enterprise-grade</span> con{" "}
                            <span className="text-brand-gold font-semibold">Nexo AI</span>, geofencing
                            multi-sede, passkeys biométricas y firma electrónica SHA-256. Desde
                            la asignación hasta el certificado QR verificable.
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
                                Acceder al Sistema
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link
                                href="#modulos"
                                className="inline-flex items-center gap-2 border border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all"
                            >
                                Explorar módulos
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
                                { value: "28+", label: "Módulos" },
                                { value: "6",   label: "Roles RBAC" },
                                { value: "2",   label: "Cron Jobs" },
                                { value: "100%", label: "Trazabilidad" },
                            ].map(k => (
                                <div key={k.label} className="bg-white/8 backdrop-blur border border-white/15 rounded-2xl p-4">
                                    <p className="text-3xl font-black text-brand-gold leading-none">{k.value}</p>
                                    <p className="text-white/55 text-[11px] font-medium uppercase tracking-wider mt-1.5">{k.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* tech pills — botton right, only xl */}
                <div className="absolute bottom-8 right-8 hidden xl:flex gap-2 z-10">
                    {[
                        { icon: <Radio className="w-3.5 h-3.5" />, label: "Haversine GPS" },
                        { icon: <Brain className="w-3.5 h-3.5" />, label: "GPT-4o Vision" },
                        { icon: <Fingerprint className="w-3.5 h-3.5" />, label: "WebAuthn FIDO2" },
                        { icon: <Stamp className="w-3.5 h-3.5" />, label: "SHA-256 Sign" },
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
                        <SectionLabel>Pilares del sistema</SectionLabel>
                        <h2 className="text-4xl font-black text-brand-blue leading-tight tracking-tight">
                            Tres columnas que sostienen la integridad institucional
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                num: "01",
                                icon: <MapPin className="w-6 h-6" />,
                                title: "Verificación Estricta",
                                tag: "Geofencing · Biometría",
                                desc: "Fórmula Haversine contra múltiples sedes (allowedLocations JSON), radio por sede, foto de entrada/salida y passkeys FIDO2 con userVerification obligatorio.",
                                points: ["Haversine multi-sede", "Passkeys WebAuthn FIDO2", "Foto entrada / salida"],
                                accent: "border-blue-500",
                                iconBg: "bg-blue-500",
                            },
                            {
                                num: "02",
                                icon: <Workflow className="w-6 h-6" />,
                                title: "Validación en Cascada",
                                tag: "Nested Approvals · Versionado",
                                desc: "7 estados documentales, versionado automático, hilos de feedback, anotaciones JSON y firma electrónica SHA-256 con sello ISTPET-SIG.",
                                points: ["7 estados documentales", "Versionado + comentarios", "Sello SHA-256 ISTPET"],
                                accent: "border-amber-500",
                                iconBg: "bg-amber-500",
                            },
                            {
                                num: "03",
                                icon: <Brain className="w-6 h-6" />,
                                title: "Observabilidad 360°",
                                tag: "Nexo AI · GPT-4o",
                                desc: "Copilot contextual, descripción de fotos por visión, pre-verificación OCR con cruce de nombre y horas, y risk assessment Bajo / Medio / Alto.",
                                points: ["GPT-4o Vision + OCR", "Risk scoring predictivo", "Zero-Hallucination policy"],
                                accent: "border-purple-500",
                                iconBg: "bg-purple-500",
                            },
                        ].map((p, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 28 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className={`bg-white rounded-2xl border-t-4 ${p.accent} p-8 shadow-sm hover:shadow-lg transition-shadow`}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-12 h-12 rounded-xl ${p.iconBg} text-white flex items-center justify-center`}>
                                        {p.icon}
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
                            <SectionLabel>Inteligencia Artificial</SectionLabel>
                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-5">
                                Conoce a{" "}
                                <span className="text-brand-gold italic">Nexo</span>,
                                <br />el copiloto del ISTPET
                            </h2>
                            <p className="text-white/65 leading-relaxed mb-8 max-w-lg">
                                Asistente <span className="text-white font-semibold">GPT-4o</span> con capacidad de visión y{" "}
                                <span className="text-brand-gold font-semibold">Zero-Hallucination Policy</span>. Entiende
                                el contexto del estudiante, lee documentos y predice el riesgo académico.
                            </p>

                            <div className="space-y-3">
                                {[
                                    { icon: <Eye className="w-4 h-4" />, title: "GPT-4o Vision", desc: "Describe actividades desde fotos y extrae texto de la primera página del PDF." },
                                    { icon: <FileCheck2 className="w-4 h-4" />, title: "Pre-verificación OCR", desc: "Cruza horas del documento contra las registradas en el sistema antes del envío." },
                                    { icon: <Gauge className="w-4 h-4" />, title: "Risk Assessment", desc: "Health Score + progreso de horas → nivel Bajo / Medio / Alto para el coordinador." },
                                    { icon: <MessageSquare className="w-4 h-4" />, title: "Copilot contextual", desc: "Resuelve dudas en español, sin salirse del alcance institucional del ISTPET." },
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -16 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.07 }}
                                        viewport={{ once: true }}
                                        className="flex gap-3 p-4 rounded-xl bg-white/6 border border-white/10 hover:bg-white/10 transition-colors group"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-brand-gold/20 text-brand-gold flex items-center justify-center flex-shrink-0 group-hover:bg-brand-gold group-hover:text-white transition-colors">
                                            {item.icon}
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
                                        <p className="text-[10px] text-brand-gold font-semibold">gpt-4o · en línea</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] text-white/40">activo</span>
                                    </div>
                                </div>

                                {/* messages */}
                                <div className="p-5 space-y-4">
                                    {/* user */}
                                    <div className="flex justify-end">
                                        <div className="max-w-[80%] bg-brand-blue px-4 py-3 rounded-2xl rounded-br-sm">
                                            <p className="text-sm text-white/90">¿Por qué fue rechazado mi informe de actividades?</p>
                                        </div>
                                    </div>
                                    {/* ai */}
                                    <div className="flex gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Bot className="w-3.5 h-3.5 text-brand-gold" />
                                        </div>
                                        <div className="max-w-[85%] bg-white/8 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm">
                                            <p className="text-sm text-white/85 leading-relaxed">
                                                Las horas reportadas en tu documento{" "}
                                                <span className="font-bold text-amber-400">(142 h)</span> no coinciden
                                                con las registradas en el sistema{" "}
                                                <span className="font-bold text-emerald-400">(156 h)</span>. Corrige el
                                                campo y vuelve a subirlo.
                                            </p>
                                        </div>
                                    </div>
                                    {/* risk card */}
                                    <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Risk Assessment · Nivel Medio</p>
                                            <p className="text-xs text-white/70 leading-relaxed">
                                                Health Score 62/100 · 3 documentos pendientes. Se recomienda
                                                seguimiento del coordinador esta semana.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* input bar */}
                                <div className="px-5 py-4 border-t border-white/8 flex items-center gap-3">
                                    <div className="flex-1 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white/35">
                                        Escribe tu pregunta…
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
                        <SectionLabel>Gobernanza RBAC</SectionLabel>
                        <h2 className="text-4xl font-black text-brand-blue tracking-tight">Seis portales, una plataforma</h2>
                        <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                            Separación absoluta de responsabilidades. Cada rol accede solo a lo que le corresponde.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[
                            {
                                role: "Administrador",
                                icon: <UserCog className="w-5 h-5" />,
                                gradient: "from-purple-500 to-indigo-600",
                                border: "border-t-purple-500",
                                features: ["Analytics 24h", "ARCO Requests", "System Logs", "Hot Maintenance"],
                                desc: "Orquestador total: usuarios, carreras, anuncios, salud del sistema y limpieza en caliente de archivos huérfanos.",
                            },
                            {
                                role: "Coordinador de Prácticas",
                                icon: <ShieldCheck className="w-5 h-5" />,
                                gradient: "from-sky-600 to-blue-700",
                                border: "border-t-sky-600",
                                features: ["Asignación masiva", "Firma SHA-256", "Plantillas .docx", "Export Excel"],
                                desc: "Aprobación definitiva con firma electrónica, convenios corporativos y emisión del certificado QR final.",
                            },
                            {
                                role: "Tutor Académico",
                                icon: <GraduationCap className="w-5 h-5" />,
                                gradient: "from-teal-500 to-emerald-600",
                                border: "border-t-teal-500",
                                features: ["Anotaciones JSON", "Visitas monitoreo", "Feedback iterativo", "Evaluación académica"],
                                desc: "Primera revisión con anotaciones PDF, visitas presenciales/virtuales y hilos de comentarios.",
                            },
                            {
                                role: "Empresa (RRHH)",
                                icon: <Building2 className="w-5 h-5" />,
                                gradient: "from-orange-500 to-red-500",
                                border: "border-t-orange-500",
                                features: ["Perfil RUC", "Tutores empresariales", "Convenios activos", "Talento asignado"],
                                desc: "Entidad legal del convenio. Gestiona tutores, perfil corporativo y acuerdos con fecha y estado.",
                            },
                            {
                                role: "Tutor Empresarial",
                                icon: <Briefcase className="w-5 h-5" />,
                                gradient: "from-amber-500 to-yellow-500",
                                border: "border-t-amber-500",
                                features: ["Evaluación dual", "5 rúbricas", "Validación de horas", "Observaciones"],
                                desc: "Evaluación empresarial sobre puntualidad, equipo, técnica, proactividad y actitud.",
                            },
                            {
                                role: "Estudiante",
                                icon: <Users className="w-5 h-5" />,
                                gradient: "from-blue-500 to-cyan-600",
                                border: "border-t-blue-500",
                                features: ["Check-in GPS", "Photo activities", "Nexo AI", "Certificado QR"],
                                desc: "Check-in Haversine multi-sede, fotos con descripción AI, passkeys biométricas y copiloto Nexo.",
                            },
                        ].map((a, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -4 }}
                                className={`bg-white border border-slate-100 border-t-4 ${a.border} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all`}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.gradient} text-white flex items-center justify-center`}>
                                        {a.icon}
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
                        <SectionLabel>Ecosistema funcional</SectionLabel>
                        <h2 className="text-4xl font-black text-brand-blue tracking-tight">
                            Todo el ciclo de vida, en un solo lugar
                        </h2>
                        <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                            28 módulos NestJS interconectados — desde la autenticación hasta la integración SIGAFI.
                        </p>
                    </div>

                    <div className="space-y-12">
                        {[
                            {
                                cat: "Gestión Académica", color: "bg-blue-500", text: "text-blue-600", border: "border-blue-200", light: "bg-blue-50",
                                modules: [
                                    { icon: <Users />, title: "Usuarios y RBAC", desc: "6 roles, bloqueo por intentos, 2FA TOTP y reset con token." },
                                    { icon: <FileSignature />, title: "Convenios", desc: "Registro por RUC, vigencia, archivo digital y cascada a Empresa." },
                                    { icon: <Layers />, title: "Asignación de Prácticas", desc: "Cruce estudiante-tutor-empresa con historial de cambios." },
                                    { icon: <BookOpen />, title: "Carreras", desc: "Config JSON dinámica con horas requeridas y plantillas por carrera." },
                                ]
                            },
                            {
                                cat: "Documentación Legal", color: "bg-amber-500", text: "text-amber-600", border: "border-amber-200", light: "bg-amber-50",
                                modules: [
                                    { icon: <FileCheck2 />, title: "Documentos (7 estados)", desc: "PENDIENTE → INCUMPLIDO, con flujo completo de aprobación." },
                                    { icon: <GitBranch />, title: "Document Versions", desc: "Versionado automático en cada re-subida con trazabilidad." },
                                    { icon: <MessageSquare />, title: "Document Comments", desc: "Hilos de feedback entre estudiante y tutor por documento." },
                                    { icon: <Stamp />, title: "Firma SHA-256", desc: "Sello ISTPET-SIG-XXXX en base a hash y bitácora institucional." },
                                ]
                            },
                            {
                                cat: "Operación en Campo", color: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-200", light: "bg-emerald-50",
                                modules: [
                                    { icon: <MapPin />, title: "Geofencing Haversine", desc: "allowedLocations JSON, radio por sede y fallback legacy." },
                                    { icon: <Camera />, title: "Activity Photos", desc: "Fotos de actividades con caption, describibles por GPT-4o." },
                                    { icon: <Fingerprint />, title: "WebAuthn FIDO2", desc: "@simplewebauthn con platform authenticator y userVerification." },
                                    { icon: <Eye />, title: "Monitoring Visits", desc: "Visitas presenciales/virtuales con evidencia fotográfica." },
                                ]
                            },
                            {
                                cat: "Inteligencia Artificial", color: "bg-purple-500", text: "text-purple-600", border: "border-purple-200", light: "bg-purple-50",
                                modules: [
                                    { icon: <Bot />, title: "Nexo Copilot", desc: "GPT-4o con contexto del estudiante y zero-hallucination policy." },
                                    { icon: <Eye />, title: "Suggest Description", desc: "Vision analiza imagen y genera descripción breve de actividad." },
                                    { icon: <FileText />, title: "Pre-Verify OCR", desc: "Extrae horas del PDF y cruza con nombre del estudiante." },
                                    { icon: <Gauge />, title: "Risk Assessment", desc: "HealthScore + días activos → riesgo Bajo / Medio / Alto." },
                                ]
                            },
                            {
                                cat: "Automatización y Eventos", color: "bg-rose-500", text: "text-rose-600", border: "border-rose-200", light: "bg-rose-50",
                                modules: [
                                    { icon: <Clock />, title: "Motor CRON", desc: "DeadlineChecker + AutomationEngine @midnight, marcan INCUMPLIDO." },
                                    { icon: <Bell />, title: "Socket.IO Gateway", desc: "Namespace /notifications con rooms por userId en tiempo real." },
                                    { icon: <Mail />, title: "Email + EmailLog", desc: "SMTP institucional con bitácora éxito/fallo y metadata." },
                                    { icon: <History />, title: "Status History", desc: "Historial inmutable de transiciones con razón y actor." },
                                ]
                            },
                            {
                                cat: "Evaluaciones y Certificación", color: "bg-cyan-500", text: "text-cyan-600", border: "border-cyan-200", light: "bg-cyan-50",
                                modules: [
                                    { icon: <ClipboardList />, title: "Evaluación Dual", desc: "5 rúbricas: puntualidad, equipo, técnica, proactividad, actitud." },
                                    { icon: <QrCode />, title: "Certificación QR", desc: "Puppeteer + Handlebars A4 landscape, subida al Blob Storage." },
                                    { icon: <ScrollText />, title: "Plantillas .docx", desc: "8 formatos institucionales preconfigurados y editables." },
                                    { icon: <TrendingUp />, title: "Eligibility Check", desc: "Valida horas ≥ requeridas y docs obligatorios APROBADO_DEFINITIVO." },
                                ]
                            },
                            {
                                cat: "Observabilidad y Analytics", color: "bg-indigo-500", text: "text-indigo-600", border: "border-indigo-200", light: "bg-indigo-50",
                                modules: [
                                    { icon: <BarChart3 />, title: "Analytics Admin", desc: "Contadores, distribución de roles y avg response time." },
                                    { icon: <LineChart />, title: "Health Time-Series", desc: "Serie 24h por hora: total, errores y avg latency." },
                                    { icon: <Database />, title: "System Logs", desc: "Categorías HTTP/AUTH/SYSTEM, durationMs, IP e índices." },
                                    { icon: <HardDriveDownload />, title: "Export Excel", desc: "ExcelJS branded, 12 columnas con % progreso por pasantía." },
                                ]
                            },
                            {
                                cat: "Gobernanza y DevOps", color: "bg-slate-600", text: "text-slate-600", border: "border-slate-200", light: "bg-slate-50",
                                modules: [
                                    { icon: <Lock />, title: "LOPDP + ARCO", desc: "Consentimiento versionado y solicitudes A/R/C/O de datos." },
                                    { icon: <ShieldAlert />, title: "Helmet + Throttler", desc: "Cabeceras seguras y rate-limit global 100 req/min." },
                                    { icon: <BookOpen />, title: "Swagger OpenAPI", desc: "Docs en /api/docs con Bearer persistido y tags por módulo." },
                                    { icon: <Network />, title: "Bridge SIGAFI", desc: "Sincronización con sistema académico externo (matrícula, GPA)." },
                                ]
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
                        <SectionLabel>Infraestructura técnica</SectionLabel>
                        <h2 className="text-4xl font-black text-white tracking-tight">Stack de grado empresarial</h2>
                        <p className="text-white/50 mt-3 text-sm">
                            Arquitectura <span className="text-brand-gold font-semibold">Hybrid Universal Bridge</span> con librerías especializadas de primer nivel.
                        </p>
                    </div>

                    {[
                        {
                            layer: "Frontend", items: [
                                { icon: <Cpu />, name: "Next.js 16", sub: "App Router · React 19" },
                                { icon: <Sparkles />, name: "Tailwind + shadcn/ui", sub: "Framer Motion" },
                            ]
                        },
                        {
                            layer: "Backend", items: [
                                { icon: <Server />, name: "NestJS 11", sub: "TypeScript · Modular" },
                                { icon: <Database />, name: "PostgreSQL", sub: "Prisma ORM 5+" },
                                { icon: <KeyRound />, name: "JWT + Passport", sub: "Guards + Roles" },
                                { icon: <ShieldAlert />, name: "Helmet + Throttler", sub: "100 req/min" },
                            ]
                        },
                        {
                            layer: "IA & Automatización", items: [
                                { icon: <Brain />, name: "OpenAI GPT-4o", sub: "Chat + Vision + JSON" },
                                { icon: <Clock />, name: "@nestjs/schedule", sub: "Cron @midnight" },
                                { icon: <Bell />, name: "Socket.IO", sub: "Realtime Gateway" },
                                { icon: <Mail />, name: "Nodemailer", sub: "SMTP + EmailLog" },
                            ]
                        },
                        {
                            layer: "Seguridad & Storage", items: [
                                { icon: <Fingerprint />, name: "@simplewebauthn", sub: "FIDO2 Passkeys" },
                                { icon: <HardDriveDownload />, name: "Vercel Blob", sub: "Object Storage" },
                                { icon: <FileText />, name: "Puppeteer + Handlebars", sub: "PDF Certificates" },
                                { icon: <BarChart3 />, name: "ExcelJS", sub: "Master Reports" },
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
                            <SectionLabel>El flujo legal</SectionLabel>
                            <h2 className="text-4xl font-black text-brand-blue tracking-tight leading-tight mb-5">
                                Cómo funciona<br />en Ecuador
                            </h2>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                Proceso bajo normativa CES / SENESCYT, 100% digital, con firma
                                electrónica institucional y trazabilidad ARCO LOPDP.
                            </p>
                            <Link href="/servicios" className="inline-flex items-center gap-2 text-brand-gold font-bold text-sm group">
                                Ver servicios académicos
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>

                        {/* timeline */}
                        <div className="lg:col-span-2 relative">
                            {/* vertical line */}
                            <div className="absolute left-[17px] top-5 bottom-5 w-px bg-slate-200 hidden sm:block" />

                            <div className="space-y-4">
                                {[
                                    { title: "Convenio de Cooperación", desc: "Vinculación formal con la empresa (RUC único) y archivo digital versionado." },
                                    { title: "Plan de Prácticas", desc: "Creación automática de 7-8 documentos obligatorios según config JSON de la carrera." },
                                    { title: "Asignación y Geofencing", desc: "Tutor académico, tutor empresarial y allowedLocations multi-sede con radio propio." },
                                    { title: "Ejecución con Evidencia", desc: "Check-in Haversine, fotos descritas por GPT-4o Vision y passkeys FIDO2." },
                                    { title: "Validación en Cascada", desc: "Tutor revisa con anotaciones JSON; Coordinador firma con sello SHA-256 institucional." },
                                    { title: "Evaluación Dual", desc: "5 rúbricas académica + empresarial consolidadas en calificación final." },
                                    { title: "Certificación QR", desc: "Puppeteer + Handlebars genera PDF A4 landscape, subido al Blob y notificado por email." },
                                ].map((step, i) => (
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
                            <SectionLabel>Seguridad y cumplimiento</SectionLabel>
                            <h2 className="text-4xl font-black text-brand-blue tracking-tight mb-5">
                                Privacidad por diseño,<br />auditoría por defecto
                            </h2>
                            <p className="text-slate-500 leading-relaxed mb-8 text-sm">
                                EmiTesis cumple con la{" "}
                                <span className="font-semibold text-brand-blue">LOPDP del Ecuador</span> a nivel
                                estructural. Los derechos{" "}
                                <span className="font-semibold">ARCO</span> están implementados como modelo
                                Prisma <code className="text-xs bg-slate-200 px-1.5 py-0.5 rounded font-mono">DataRequest</code>{" "}
                                y la portabilidad exporta el perfil completo en JSON.
                            </p>

                            <div className="space-y-3">
                                {[
                                    { icon: <Lock />, title: "Consentimiento versionado", desc: "lopdpAccepted + lopdpVersion con timestamp; plataforma bloqueada sin aceptación expresa." },
                                    { icon: <FileText />, title: "Derechos ARCO", desc: "Solicitudes de Acceso, Rectificación, Cancelación y Oposición con estado de seguimiento." },
                                    { icon: <Database />, title: "Bitácora inmutable", desc: "SystemLog con índice desc, durationMs y metadata JSON; onDelete: SetNull preserva historia." },
                                    { icon: <ShieldAlert />, title: "Defense in Depth", desc: "Helmet + Throttler 100/min + JWT + RolesGuard + WebAuthn + bloqueo por lockoutUntil." },
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -16 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        viewport={{ once: true }}
                                        className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-brand-blue/20 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-brand-blue/8 text-brand-blue flex items-center justify-center flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4">
                                            {item.icon}
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
                                <h3 className="text-2xl font-black mb-3">Zero-Trust Architecture</h3>
                                <p className="text-white/60 text-sm leading-relaxed mb-8">
                                    Cada request se autentica con JWT, cada rol se valida con RolesGuard,
                                    cada acción queda en SystemLog y las acciones críticas requieren biometría.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { v: "6",       l: "Roles aislados" },
                                        { v: "7",       l: "Estados doc." },
                                        { v: "2",       l: "Cron jobs" },
                                        { v: "100/min", l: "Rate limit" },
                                    ].map(s => (
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
                            Listo para usar
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-5">
                            Únete al ecosistema EmiTesis
                        </h2>
                        <p className="text-white/60 mb-10 text-lg leading-relaxed">
                            Accede con tu rol institucional y descubre cómo la IA, el geofencing
                            y la firma electrónica redefinen las prácticas preprofesionales.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/login" className="inline-flex items-center justify-center gap-2.5 bg-white text-brand-blue px-8 py-4 rounded-xl font-bold text-sm hover:bg-brand-gold hover:text-white transition-all shadow-xl group">
                                Iniciar sesión
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link href="/empresas" className="inline-flex items-center justify-center gap-2 border border-brand-gold text-brand-gold px-8 py-4 rounded-xl font-bold text-sm hover:bg-brand-gold hover:text-white transition-all">
                                Portal corporativo
                            </Link>
                            <Link href="/nosotros" className="inline-flex items-center justify-center gap-2 border border-white/25 text-white/80 px-8 py-4 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all">
                                Conoce el ISTPET
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

        </div>
    );
}
