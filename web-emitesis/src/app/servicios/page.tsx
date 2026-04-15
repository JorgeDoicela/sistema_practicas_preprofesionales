"use client";

import { motion } from "framer-motion";
import { 
    GraduationCap, 
    Building2, 
    Users, 
    ShieldCheck, 
    Zap, 
    MapPin, 
    QrCode, 
    CheckCircle2 
} from "lucide-react";

export default function ServiciosPage() {
    return (
        <div className="pt-32 pb-20">
            {/* Hero Section */}
            <section className="px-6 mb-24 text-center">
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.5em] mb-4 block">Ecosistema Emitesis</span>
                        <h1 className="text-5xl md:text-7xl font-black text-brand-blue mb-8 tracking-tighter">
                            Servicios de <br /> Vinculación Digital
                        </h1>
                    </motion.div>
                </div>
            </section>

            {/* Módulos Principales */}
            <section className="px-6 py-20 bg-white">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
                    {[
                        {
                            role: "Estudiantes",
                            icon: <GraduationCap />,
                            title: "Gestión Académica",
                            features: ["Búsqueda de plazas", "Registro de asistencia GPS", "Generación de informes semanales", "Seguimiento de horas acumuladas"]
                        },
                        {
                            role: "Empresas",
                            icon: <Building2 />,
                            title: "Control Institucional",
                            features: ["Publicación de vacantes", "Evaluación de pasantes", "Gestión de convenios", "Validación de departamentos"]
                        },
                        {
                            role: "Tutores",
                            icon: <Users />,
                            title: "Supervisión Técnica",
                            features: ["Revisión de bitácoras", "Feedback en tiempo real", "Aprobación de evidencias", "Monitoreo de desempeño"]
                        }
                    ].map((service, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100 hover:shadow-2xl hover:shadow-slate-200 transition-all"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-brand-blue text-white flex items-center justify-center mb-8 shadow-xl">
                                {service.icon}
                            </div>
                            <p className="text-[9px] font-black text-brand-gold uppercase tracking-widest mb-2">{service.role}</p>
                            <h3 className="text-2xl font-black text-brand-blue mb-6 tracking-tight italic">{service.title}</h3>
                            <ul className="space-y-4">
                                {service.features.map(f => (
                                    <li key={f} className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                        <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Tecnología Aplicada */}
            <section className="px-6 py-32 bg-brand-blue text-white overflow-hidden relative">
                <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row gap-20 items-center">
                    <div className="lg:w-1/2">
                        <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.5em] mb-6 block">Innovación ISTPET</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tighter leading-none italic">
                            Tecnología que <br /> Genera Confianza.
                        </h2>
                        <div className="space-y-12">
                            <div className="flex gap-6 items-start">
                                <MapPin className="text-brand-gold w-8 h-8 shrink-0" />
                                <div>
                                    <h4 className="text-xl font-bold mb-2 uppercase tracking-tight italic">Geolocalización GPS</h4>
                                    <p className="text-white/60 text-sm leading-relaxed">Validamos que las prácticas se realicen en la ubicación autorizada, asegurando la integridad del proceso de asistencia.</p>
                                </div>
                            </div>
                            <div className="flex gap-6 items-start">
                                <QrCode className="text-brand-gold w-8 h-8 shrink-0" />
                                <div>
                                    <h4 className="text-xl font-bold mb-2 uppercase tracking-tight italic">Certificación QR</h4>
                                    <p className="text-white/60 text-sm leading-relaxed">Los certificados de vinculación cuentan con codificación única para validación inmediata por parte de terceros.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="lg:w-1/2">
                        <div className="glass-dark p-12 rounded-[3.5rem] border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-3xl" />
                            <Zap className="w-20 h-20 text-brand-gold mb-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                            <h3 className="text-3xl font-black text-white mb-6">Procesamiento en Tiempo Real</h3>
                            <p className="text-white/40 font-medium mb-8 leading-relaxed">
                                Emitesis centraliza la data académica y laboral de manera instantánea, permitiendo que tanto coordinadores como tutores tomen decisiones informadas sobre el progreso del estudiante.
                            </p>
                            <div className="h-1.5 w-32 bg-brand-gold rounded-full" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
