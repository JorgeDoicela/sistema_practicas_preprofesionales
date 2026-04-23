"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    GraduationCap, Building2, Users, ShieldCheck,
    MapPin, QrCode, CheckCircle2, ArrowRight,
    Zap, Brain, Fingerprint, Clock, FileCheck2, Bell
} from "lucide-react";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold text-brand-gold uppercase tracking-[0.3em] mb-4">
        <span className="w-4 h-px bg-brand-gold" />{children}
    </span>
);

export default function ServiciosPage() {
    return (
        <div className="min-h-screen bg-white">

            {/* ── Hero ── */}
            <section className="relative bg-brand-blue overflow-hidden pt-32 pb-24 px-6 lg:px-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-brand-gold/15 via-transparent to-transparent" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-8">
                            <Zap className="w-3 h-3 text-brand-gold" />
                            Ecosistema EmiTesis
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
                            Servicios de<br />
                            <span className="text-brand-gold italic">Vinculación Digital</span>
                        </h1>
                        <p className="text-white/65 text-lg leading-relaxed max-w-xl">
                            Herramientas específicas para cada actor del proceso. Desde la búsqueda de plazas hasta la
                            certificación verificable con QR, todo en una plataforma centralizada.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── Servicios por rol ── */}
            <section className="py-24 px-6 lg:px-10 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <SectionLabel>Por rol</SectionLabel>
                        <h2 className="text-2xl md:text-4xl font-black text-brand-blue tracking-tight">
                            Una experiencia dedicada para cada actor
                        </h2>
                        <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                            Cada portal tiene las herramientas exactas que necesita, sin ruido ni accesos innecesarios.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <GraduationCap className="w-6 h-6" />,
                                role: "Estudiantes",
                                title: "Gestión Académica",
                                color: "border-t-sky-500",
                                iconBg: "bg-sky-500",
                                features: [
                                    "Registro de asistencia con GPS Haversine",
                                    "Bitácora digital de actividades",
                                    "Fotos de actividades con descripción AI",
                                    "Seguimiento de horas acumuladas",
                                    "Copiloto Nexo (GPT-4o)",
                                    "Descarga de certificado QR",
                                ]
                            },
                            {
                                icon: <Building2 className="w-6 h-6" />,
                                role: "Empresas",
                                title: "Control Institucional",
                                color: "border-t-orange-500",
                                iconBg: "bg-orange-500",
                                features: [
                                    "Gestión de convenios corporativos",
                                    "Administración de tutores empresariales",
                                    "Evaluación dual en 5 rúbricas",
                                    "Visualización de pasantes activos",
                                    "Perfil corporativo con RUC",
                                    "Validación de departamentos",
                                ]
                            },
                            {
                                icon: <Users className="w-6 h-6" />,
                                role: "Tutores y Coordinadores",
                                title: "Supervisión Técnica",
                                color: "border-t-teal-500",
                                iconBg: "bg-teal-500",
                                features: [
                                    "Revisión de documentos con anotaciones",
                                    "Feedback iterativo por hilos",
                                    "Aprobación definitiva y firma SHA-256",
                                    "Visitas de monitoreo presencial / virtual",
                                    "Reportes y métricas institucionales",
                                    "Export Excel del reporte maestro",
                                ]
                            }
                        ].map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className={`bg-white rounded-2xl border border-slate-100 border-t-4 ${s.color} p-5 sm:p-8 shadow-sm hover:shadow-md transition-shadow`}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`w-11 h-11 rounded-xl ${s.iconBg} text-white flex items-center justify-center`}>
                                        {s.icon}
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
                        <SectionLabel>Tecnología aplicada</SectionLabel>
                        <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                            Innovación que genera confianza
                        </h2>
                        <p className="text-white/55 mt-3 text-sm">
                            Cada funcionalidad está diseñada para eliminar el fraude y la burocracia.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[
                            {
                                icon: <MapPin className="w-5 h-5" />,
                                title: "Geofencing Haversine",
                                desc: "Validación GPS contra múltiples sedes permitidas con radio configurable por sede. Cero tolerancia a marcaciones fuera del lugar autorizado.",
                            },
                            {
                                icon: <QrCode className="w-5 h-5" />,
                                title: "Certificación QR",
                                desc: "Certificados generados con Puppeteer + Handlebars, subidos al Blob Storage y verificables públicamente mediante código QR único.",
                            },
                            {
                                icon: <Brain className="w-5 h-5" />,
                                title: "Nexo AI",
                                desc: "Copiloto GPT-4o con contexto institucional, pre-verificación OCR de documentos y análisis predictivo de riesgo académico.",
                            },
                            {
                                icon: <Fingerprint className="w-5 h-5" />,
                                title: "WebAuthn FIDO2",
                                desc: "Autenticación biométrica con passkeys de plataforma (huella / Face ID). Sin contraseña para acciones críticas.",
                            },
                            {
                                icon: <FileCheck2 className="w-5 h-5" />,
                                title: "Firma SHA-256",
                                desc: "Sello institucional ISTPET-SIG con hash criptográfico SHA-256, registrado en bitácora inmutable.",
                            },
                            {
                                icon: <Bell className="w-5 h-5" />,
                                title: "Tiempo Real",
                                desc: "Notificaciones Socket.IO y motor CRON automático que gestiona vencimientos y alertas sin intervención manual.",
                            },
                        ].map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                viewport={{ once: true }}
                                className="bg-white/6 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-brand-gold/20 text-brand-gold flex items-center justify-center mb-4 group-hover:bg-brand-gold group-hover:text-white transition-colors">
                                    {t.icon}
                                </div>
                                <h4 className="font-bold text-white mb-2">{t.title}</h4>
                                <p className="text-white/55 text-sm leading-relaxed">{t.desc}</p>
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
                            ¿Listo para digitalizar tus prácticas?
                        </h2>
                        <p className="text-slate-500 text-sm mb-8">
                            Accede con tus credenciales institucionales o comunícate con el departamento de Vinculación.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-brand-blue text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-brand-gold transition-all shadow-lg group">
                                Acceder al sistema
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link href="/nosotros" className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 px-8 py-4 rounded-xl font-semibold text-sm hover:border-brand-blue hover:text-brand-blue transition-all">
                                Conocer el ISTPET
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

        </div>
    );
}
