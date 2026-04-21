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
    Star,
    MapPin,
    Brain,
    Fingerprint,
    Workflow,
    LineChart,
    FileSignature,
    Bell,
    QrCode,
    Database,
    Lock,
    Clock,
    FileCheck2,
    ClipboardList,
    Megaphone,
    Activity,
    Server,
    Cpu,
    Sparkles,
    BarChart3,
    HardDriveDownload,
    Bot,
    UserCog,
    Briefcase,
    ScrollText,
    ShieldAlert,
    Layers,
    Network
} from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-brand-gold/30">
            {/* ============================= HERO ============================= */}
            <section className="relative min-h-screen flex items-center pt-20 px-6 overflow-hidden">
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
                            EmiTesis · Plataforma Institucional ISTPET
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tighter">
                            Gobernanza digital de las <br />
                            <span className="text-brand-gold italic">Prácticas</span> Preprofesionales.
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-10 max-w-xl font-medium">
                            Sistema integral <span className="text-brand-gold font-bold">Enterprise-grade</span> para administrar, auditar y trazar el ciclo de vida completo de las prácticas: convenios, asistencia con geofencing, documentación legal, evaluaciones duales y certificación con QR.
                        </p>
                        <div className="flex flex-wrap gap-5">
                            <Link href="/login" className="bg-white text-brand-blue px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-brand-gold hover:text-white transition-all flex items-center gap-3 group">
                                Acceder al Sistema
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="#modulos" className="glass text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/30">
                                Explorar Módulos
                            </Link>
                        </div>

                        {/* KPI strip */}
                        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
                            {[
                                { value: "25+", label: "Módulos Integrados" },
                                { value: "6", label: "Roles RBAC" },
                                { value: "100%", label: "Trazabilidad" },
                                { value: "24/7", label: "Automatización CRON" }
                            ].map((kpi, i) => (
                                <div key={i} className="glass-dark rounded-2xl p-4 border border-white/10">
                                    <p className="text-2xl md:text-3xl font-black text-brand-gold">{kpi.value}</p>
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mt-1">{kpi.label}</p>
                                </div>
                            ))}
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
                                <div className="space-y-5">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 border border-white/10">
                                        <div className="w-12 h-12 rounded-xl bg-brand-gold flex items-center justify-center">
                                            <Sparkles className="text-white w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-brand-gold uppercase tracking-tighter">Hybrid Universal Bridge</p>
                                            <p className="text-sm font-bold text-white uppercase italic">Next.js 16 · NestJS 11</p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/10 w-full" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 rounded-2xl bg-brand-blue/30 border border-white/5 flex flex-col items-center">
                                            <MapPin className="text-brand-gold w-6 h-6 mb-2" />
                                            <p className="text-sm font-black text-white">Geofencing</p>
                                            <p className="text-[9px] font-bold text-white/50 uppercase mt-1">Asistencia GPS</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-brand-blue/30 border border-white/5 flex flex-col items-center">
                                            <Brain className="text-brand-gold w-6 h-6 mb-2" />
                                            <p className="text-sm font-black text-white">GPT-4o</p>
                                            <p className="text-[9px] font-bold text-white/50 uppercase mt-1">AI Copilot</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-brand-blue/30 border border-white/5 flex flex-col items-center">
                                            <Fingerprint className="text-brand-gold w-6 h-6 mb-2" />
                                            <p className="text-sm font-black text-white">WebAuthn</p>
                                            <p className="text-[9px] font-bold text-white/50 uppercase mt-1">Passkeys</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-brand-blue/30 border border-white/5 flex flex-col items-center">
                                            <QrCode className="text-brand-gold w-6 h-6 mb-2" />
                                            <p className="text-sm font-black text-white">QR Verify</p>
                                            <p className="text-[9px] font-bold text-white/50 uppercase mt-1">Certificación</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

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

            {/* ===================== PILARES ESTRATÉGICOS ===================== */}
            <section className="py-28 px-6 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <span className="text-[11px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4 block">
                            Pilares del Sistema
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-brand-blue mb-6 tracking-tight">
                            Tres columnas que sostienen la integridad institucional
                        </h2>
                        <p className="text-slate-500 font-medium">
                            EmiTesis sustituye el manejo físico y disperso por una infraestructura verificable, legalmente trazable y asistida por inteligencia artificial.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <MapPin className="w-8 h-8" />,
                                title: "Verificación Estricta",
                                subtitle: "Geofencing + Biometría",
                                desc: "Cada hora registrada es legítima: validación por radio GPS contra la ubicación del convenio, captura biométrica con WebAuthn y evidencia fotográfica anclada a la sesión.",
                                points: ["Geocerca por empresa", "Check-in / Check-out", "Passkeys FIDO2"]
                            },
                            {
                                icon: <Workflow className="w-8 h-8" />,
                                title: "Validación en Cascada",
                                subtitle: "Nested Approvals",
                                desc: "Flujos multinivel para documentos legales y académicos. Cada evidencia recorre Tutor Académico → Coordinador → Certificación, con bitácora inmutable de decisiones.",
                                points: ["Aprobaciones anidadas", "Iteración con feedback", "Auditoría inmutable"]
                            },
                            {
                                icon: <Brain className="w-8 h-8" />,
                                title: "Observabilidad 360°",
                                subtitle: "AI Copilot · GPT-4o",
                                desc: "Seguimiento empresarial integrado con análisis predictivo: pre-verificación de documentos, evaluación de riesgo por estudiante y asistencia contextual sin alucinaciones.",
                                points: ["Risk scoring", "Pre-verify PDF", "Zero-Hallucination Policy"]
                            }
                        ].map((pillar, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.12 }}
                                viewport={{ once: true }}
                                className="relative p-8 rounded-3xl bg-gradient-to-br from-brand-blue to-brand-blue/90 text-white overflow-hidden group"
                            >
                                <div className="absolute -top-20 -right-20 w-56 h-56 bg-brand-gold/10 rounded-full blur-3xl group-hover:bg-brand-gold/20 transition-all" />
                                <div className="relative z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center mb-6 text-brand-gold">
                                        {pillar.icon}
                                    </div>
                                    <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em] mb-2">{pillar.subtitle}</p>
                                    <h3 className="text-2xl font-black mb-4 tracking-tight">{pillar.title}</h3>
                                    <p className="text-white/70 text-sm leading-relaxed mb-6 font-medium">{pillar.desc}</p>
                                    <ul className="space-y-2 border-t border-white/10 pt-5">
                                        {pillar.points.map(p => (
                                            <li key={p} className="flex items-center gap-2 text-[11px] font-bold text-white/80 uppercase">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold" /> {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== ACTORES Y PORTALES ===================== */}
            <section id="roles" className="py-28 px-6 bg-slate-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <span className="text-[11px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4 block">
                            Gobernanza RBAC
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-brand-blue mb-6 tracking-tight">
                            Seis portales, una plataforma
                        </h2>
                        <p className="text-slate-500 font-medium">
                            Separación absoluta de responsabilidades: cada rol accede únicamente a lo que le corresponde, con experiencia y permisos dedicados.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                role: "Administrador",
                                icon: <UserCog className="w-6 h-6" />,
                                color: "from-purple-500 to-indigo-600",
                                desc: "Orquestador de la plataforma. Gestiona usuarios, carreras, anuncios, privacidad LOPDP, logs de sistema, salud de infraestructura y mantenimiento en caliente.",
                                features: ["Gestión de Usuarios", "Anuncios Institucionales", "System Logs", "Health / Hot Maintenance"]
                            },
                            {
                                role: "Coordinador de Prácticas",
                                icon: <ShieldCheck className="w-6 h-6" />,
                                color: "from-brand-blue to-blue-700",
                                desc: "Regulador del ecosistema. Aprueba documentos en última instancia, gestiona convenios, asigna estudiantes y emite la certificación final con QR.",
                                features: ["Asignación Masiva", "Convenios Corporativos", "Plantillas Legales", "Reportes y Métricas"]
                            },
                            {
                                role: "Tutor Académico",
                                icon: <GraduationCap className="w-6 h-6" />,
                                color: "from-teal-500 to-emerald-600",
                                desc: "Monitor educativo. Da primera revisión a documentos, supervisa asistencia de sus tutorados y valida el progreso de objetivos de aprendizaje.",
                                features: ["Validación de Bitácoras", "Supervisión de Asistencia", "Feedback Iterativo", "Alertas de Desempeño"]
                            },
                            {
                                role: "Empresa (RRHH)",
                                icon: <Building2 className="w-6 h-6" />,
                                color: "from-orange-500 to-red-600",
                                desc: "Entidad legal del convenio. Administra sus tutores empresariales, publica información corporativa y firma acuerdos de cooperación institucional.",
                                features: ["Perfil Corporativo", "Tutores Empresariales", "Convenios Vigentes", "Talento Asignado"]
                            },
                            {
                                role: "Tutor Empresarial",
                                icon: <Briefcase className="w-6 h-6" />,
                                color: "from-amber-500 to-yellow-600",
                                desc: "Supervisor en campo. Responsable de realizar las evaluaciones duales técnicas y dar fe del desempeño real de los pasantes a su cargo.",
                                features: ["Evaluación 360", "Seguimiento en Campo", "Validación de Horas", "Reporte Dual"]
                            },
                            {
                                role: "Estudiante",
                                icon: <Users className="w-6 h-6" />,
                                color: "from-sky-500 to-blue-600",
                                desc: "Protagonista en campo. Registra asistencia geo-localizada, sube documentos iterables, usa el AI Copilot y recibe retroalimentación continua.",
                                features: ["Check-in GPS", "Bitácora Digital", "AI Copilot", "Certificado QR"]
                            }
                        ].map((actor, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -8 }}
                                className="group p-7 rounded-3xl bg-white border border-slate-100 hover:shadow-2xl hover:shadow-slate-200 transition-all"
                            >
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${actor.color} text-white flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                                    {actor.icon}
                                </div>
                                <h3 className="text-lg font-black text-brand-blue mb-2">{actor.role}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mb-5 font-medium">
                                    {actor.desc}
                                </p>
                                <ul className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                                    {actor.features.map(h => (
                                        <li key={h} className="flex items-center gap-1.5 text-[10px] font-bold text-brand-blue/70 uppercase">
                                            <CheckCircle2 className="w-3 h-3 text-brand-gold flex-shrink-0" />
                                            <span className="truncate">{h}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== MÓDULOS DEL SISTEMA ===================== */}
            <section id="modulos" className="py-28 px-6 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <span className="text-[11px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4 block">
                            Ecosistema Funcional
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-brand-blue mb-6 tracking-tight">
                            Todo el ciclo de vida, en un solo lugar
                        </h2>
                        <p className="text-slate-500 font-medium">
                            Más de 25 módulos interconectados que cubren desde la autenticación hasta la certificación final. Cada pieza diseñada para ser auditable y componible.
                        </p>
                    </div>

                    {[
                        {
                            category: "Gestión Académica",
                            color: "bg-blue-500",
                            modules: [
                                { icon: <Users />, title: "Usuarios y RBAC", desc: "Alta, baja, cambio de rol y gestión de perfiles con control granular." },
                                { icon: <FileSignature />, title: "Convenios", desc: "Registro, vigencia, versionado y archivo digital de acuerdos corporativos." },
                                { icon: <Layers />, title: "Asignación de Prácticas", desc: "Asignación masiva estudiante-empresa-tutor con validación cruzada." },
                                { icon: <ClipboardList />, title: "Internships", desc: "Núcleo del sistema: horas, progreso, estado y ciclo completo de la práctica." },
                            ]
                        },
                        {
                            category: "Documentación Legal",
                            color: "bg-amber-500",
                            modules: [
                                { icon: <FileCheck2 />, title: "Documentos", desc: "Subida, versionado, feedback y validación en cascada de evidencias." },
                                { icon: <ScrollText />, title: "Plantillas de Documentos", desc: "Biblioteca editable de formatos oficiales ISTPET reutilizables." },
                                { icon: <QrCode />, title: "Certificación con QR", desc: "Emisión de certificados verificables públicamente vía código QR único." },
                                { icon: <FileSignature />, title: "Evaluaciones Duales", desc: "Calificación académica y empresarial consolidada por rúbricas." },
                            ]
                        },
                        {
                            category: "Operación en Campo",
                            color: "bg-emerald-500",
                            modules: [
                                { icon: <MapPin />, title: "Asistencia con Geofencing", desc: "Check-in/out por GPS contra radio del convenio, sin fraude de ubicación." },
                                { icon: <Fingerprint />, title: "WebAuthn / Passkeys", desc: "Autenticación biométrica FIDO2 para acciones críticas y login sin contraseña." },
                                { icon: <Clock />, title: "Horas Verificadas", desc: "Conteo de horas legítimas con trazabilidad de evidencia fotográfica." },
                                { icon: <Bell />, title: "Notificaciones en Tiempo Real", desc: "WebSockets para alertas inmediatas de cambios de estado y revisiones." },
                            ]
                        },
                        {
                            category: "Inteligencia y Automatización",
                            color: "bg-purple-500",
                            modules: [
                                { icon: <Bot />, title: "AI Copilot (GPT-4o)", desc: "Preguntas contextuales, pre-verificación de PDFs y sugerencias de descripciones." },
                                { icon: <BarChart3 />, title: "Risk Assessment", desc: "Evaluación predictiva del riesgo académico por estudiante basada en IA." },
                                { icon: <Workflow />, title: "Automation Engine", desc: "Motor CRON de cumplimiento autónomo: marca documentos vencidos y notifica." },
                                { icon: <LineChart />, title: "Analytics Institucional", desc: "Dashboards de KPIs, tasas de aprobación y cobertura por carrera." },
                            ]
                        },
                        {
                            category: "Observabilidad y Salud",
                            color: "bg-rose-500",
                            modules: [
                                { icon: <Activity />, title: "Health Checks", desc: "Estado de base de datos, almacenamiento y servicios externos en vivo." },
                                { icon: <Server />, title: "Monitoring", desc: "Métricas de uso, picos de carga y rendimiento del backend." },
                                { icon: <Database />, title: "System Logs", desc: "Bitácora inmutable de eventos críticos con niveles y categorías." },
                                { icon: <HardDriveDownload />, title: "Export & Reports", desc: "Generación de reportes PDF/Excel oficiales exportables por coordinación." },
                            ]
                        },
                        {
                            category: "Gobernanza y Seguridad",
                            color: "bg-slate-700",
                            modules: [
                                { icon: <Lock />, title: "Privacidad LOPDP", desc: "Consentimiento informado, derecho al olvido y gestión de datos sensibles." },
                                { icon: <Megaphone />, title: "Anuncios Institucionales", desc: "Comunicados oficiales segmentados por rol, carrera o cohorte." },
                                { icon: <ShieldAlert />, title: "Throttling y Auth", desc: "JWT + OAuth + rate limiting global contra abuso de la API." },
                                { icon: <Network />, title: "Mantenimiento en Caliente", desc: "Modo mantenimiento, limpieza selectiva y reseteo controlado sin downtime." },
                            ]
                        }
                    ].map((cat, idx) => (
                        <motion.div
                            key={cat.category}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-16"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`w-10 h-1 ${cat.color} rounded-full`} />
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-blue">
                                    {String(idx + 1).padStart(2, '0')} · {cat.category}
                                </h3>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {cat.modules.map((m, i) => (
                                    <motion.div
                                        key={m.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        viewport={{ once: true }}
                                        whileHover={{ y: -5 }}
                                        className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all group"
                                    >
                                        <div className={`w-10 h-10 rounded-xl ${cat.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform [&>svg]:w-5 [&>svg]:h-5`}>
                                            {m.icon}
                                        </div>
                                        <h4 className="text-sm font-black text-brand-blue mb-2 uppercase tracking-tight">
                                            {m.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                            {m.desc}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ===================== STACK TECNOLÓGICO ===================== */}
            <section className="py-28 px-6 bg-gradient-to-br from-slate-900 via-brand-blue to-slate-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-gold/5 blur-3xl rounded-full" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <span className="text-[11px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4 block">
                            Infraestructura Técnica
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                            Stack de grado empresarial
                        </h2>
                        <p className="text-white/60 font-medium">
                            Arquitectura <span className="text-brand-gold font-bold">Hybrid Universal Bridge</span>: una API resiliente separada de un cliente interactivo y predictivo.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5">
                        {[
                            { icon: <Cpu />, name: "Next.js 16", role: "App Router · React 19" },
                            { icon: <Server />, name: "NestJS 11", role: "TypeScript · Modular" },
                            { icon: <Database />, name: "PostgreSQL", role: "Prisma ORM 5+" },
                            { icon: <Brain />, name: "OpenAI GPT-4o", role: "AI Copilot" },
                            { icon: <Fingerprint />, name: "WebAuthn", role: "Passkeys FIDO2" },
                            { icon: <HardDriveDownload />, name: "Vercel Blob", role: "Object Storage" },
                            { icon: <Sparkles />, name: "Tailwind CSS", role: "shadcn/ui · Framer" },
                            { icon: <Bell />, name: "Socket.IO", role: "Realtime Events" },
                            { icon: <ShieldCheck />, name: "JWT + OAuth", role: "Auth + Throttler" },
                            { icon: <Clock />, name: "Nest Schedule", role: "CRON Jobs" },
                        ].map((tech, i) => (
                            <motion.div
                                key={tech.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                viewport={{ once: true }}
                                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-gold/30 transition-all group backdrop-blur-sm"
                            >
                                <div className="w-10 h-10 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center mb-3 group-hover:scale-110 transition-transform [&>svg]:w-5 [&>svg]:h-5">
                                    {tech.icon}
                                </div>
                                <p className="text-sm font-black text-white">{tech.name}</p>
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">{tech.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== FLUJO LEGAL ===================== */}
            <section id="flujo" className="py-28 px-6 bg-brand-blue relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-gold/5 blur-3xl rounded-full" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row gap-16 items-start">
                        <div className="md:w-1/3 md:sticky md:top-24">
                            <h3 className="text-[11px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4">El Flujo Legal</h3>
                            <h2 className="text-4xl font-black text-white mb-8 tracking-tighter italic">
                                Cómo funciona<br />en Ecuador
                            </h2>
                            <p className="text-white/60 font-medium leading-relaxed mb-8">
                                El proceso de prácticas preprofesionales bajo la normativa del CES y SENESCYT, integrado en un flujo 100% digital, auditado y firmado electrónicamente.
                            </p>
                            <Link href="/servicios" className="inline-flex items-center gap-2 text-brand-gold font-bold uppercase tracking-widest text-[10px] group">
                                Ver Servicios Académicos
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="md:w-2/3 grid gap-5">
                            {[
                                { title: "Convenio de Cooperación", desc: "Vinculación formal entre el ISTPET y la Entidad Receptora con archivo digital versionado.", tag: "Fase 01" },
                                { title: "Plan de Prácticas", desc: "Definición de actividades guiadas, objetivos de aprendizaje y rúbrica de evaluación dual.", tag: "Fase 02" },
                                { title: "Asignación y Onboarding", desc: "Asignación de tutor académico, tutor empresarial y geocerca del lugar de prácticas.", tag: "Fase 03" },
                                { title: "Ejecución y Monitoreo", desc: "Registro de asistencia GPS, bitácoras semanales validadas y notificaciones en tiempo real.", tag: "Fase 04" },
                                { title: "Evaluación Dual", desc: "Calificación académica y empresarial consolidada con retroalimentación iterativa.", tag: "Fase 05" },
                                { title: "Certificación y Cierre", desc: "Evaluación final y emisión del certificado oficial con QR verificable públicamente.", tag: "Fase 06" }
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    viewport={{ once: true }}
                                    className="glass-dark p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-6">
                                        <span className="text-4xl font-black text-brand-gold group-hover:scale-110 transition-transform">{String(i + 1).padStart(2, '0')}</span>
                                        <div>
                                            <p className="text-[10px] font-black text-brand-gold/60 uppercase mb-1">{step.tag}</p>
                                            <h4 className="text-lg font-bold text-white uppercase tracking-tight italic">{step.title}</h4>
                                            <p className="text-sm text-white/50 font-medium">{step.desc}</p>
                                        </div>
                                    </div>
                                    <CheckCircle2 className="w-7 h-7 text-white/10 group-hover:text-brand-gold transition-colors flex-shrink-0" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== SEGURIDAD Y CUMPLIMIENTO ===================== */}
            <section className="py-28 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-[11px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4 block">
                                Seguridad y Cumplimiento
                            </span>
                            <h2 className="text-4xl md:text-5xl font-black text-brand-blue mb-6 tracking-tight">
                                Privacidad por diseño, auditoría por defecto
                            </h2>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                EmiTesis cumple con la <span className="font-bold text-brand-blue">Ley Orgánica de Protección de Datos Personales (LOPDP)</span> del Ecuador. Consentimiento informado, derecho al olvido y trazabilidad total de accesos vienen integrados desde el núcleo.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { icon: <Lock />, title: "Consentimiento LOPDP", desc: "Flujo explícito antes de usar la plataforma, revocable en cualquier momento." },
                                    { icon: <Database />, title: "Bitácora Inmutable", desc: "Cada acción crítica queda registrada con usuario, timestamp y metadatos." },
                                    { icon: <ShieldAlert />, title: "Rate Limiting Global", desc: "Throttler Nest integrado a nivel de guardia para proteger toda la API." },
                                    { icon: <Fingerprint />, title: "Autenticación Fuerte", desc: "JWT + Passkeys WebAuthn para acciones sensibles como firmar documentos." }
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        viewport={{ once: true }}
                                        className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center flex-shrink-0 [&>svg]:w-5 [&>svg]:h-5">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-brand-blue mb-1 uppercase tracking-tight">{item.title}</h4>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="absolute -inset-4 bg-brand-gold/10 rounded-3xl blur-3xl" />
                            <div className="relative rounded-3xl bg-gradient-to-br from-brand-blue to-slate-900 p-10 text-white shadow-2xl overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-gold/20 blur-3xl rounded-full" />
                                <div className="relative z-10">
                                    <ShieldCheck className="w-14 h-14 text-brand-gold mb-6" />
                                    <h3 className="text-3xl font-black mb-4 tracking-tight">Zero-Trust Architecture</h3>
                                    <p className="text-white/70 text-sm font-medium mb-8">
                                        Cada request se autentica, cada rol se valida, cada acción queda registrada. Los datos sensibles nunca viajan en claro.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: "Roles Aislados", value: "6" },
                                            { label: "Headers Seguros", value: "Helmet" },
                                            { label: "Encriptación", value: "TLS 1.3" },
                                            { label: "Backups", value: "Diarios" }
                                        ].map(s => (
                                            <div key={s.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                <p className="text-2xl font-black text-brand-gold">{s.value}</p>
                                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mt-1">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ============================= CTA FINAL ============================= */}
            <section className="py-24 px-6 bg-slate-50">
                <div className="max-w-4xl mx-auto text-center glass rounded-[3rem] p-16 shadow-2xl border border-slate-100 relative overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue/5 border border-brand-blue/10 text-brand-blue text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                            <Sparkles className="w-3 h-3" />
                            Listo para desplegar
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-brand-blue mb-6 tracking-tighter">
                            Únete al ecosistema EmiTesis
                        </h2>
                        <p className="text-slate-500 mb-12 font-medium max-w-xl mx-auto">
                            Accede con tu rol institucional y descubre una forma completamente nueva de gestionar tus prácticas preprofesionales.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/login" className="bg-brand-blue text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                                Iniciar Sesión
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/empresas" className="bg-brand-gold text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                                Portal Corporativo
                            </Link>
                            <Link href="/nosotros" className="bg-white text-brand-blue border border-slate-200 px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                Conoce el ISTPET
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
