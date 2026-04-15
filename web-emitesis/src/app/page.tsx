"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import {
    ShieldCheck,
    FileText,
    MapPin,
    Users,
    GraduationCap,
    Building2,
    BarChart3,
    Lock,
    Globe2,
    Award
} from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-white text-slate-800 font-body">
            {/* Header: Fondo azul institucional, logo izquierda, menú blanco */}
            <header className="bg-[#003366] h-20 flex items-center sticky top-0 z-50 shadow-md">
                <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-4">
                        <div className="p-1">
                            <Image
                                src={BRAND_LOGO_SRC}
                                alt="Logo ISTPET"
                                width={140}
                                height={35}
                                className="h-8 w-auto object-contain drop-shadow-sm"
                            />
                        </div>
                        <div className="hidden md:block border-l border-white/20 pl-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Ecosistema Académico</p>
                            <p className="text-sm font-bold text-[#C5A059]">Emitesis</p>
                        </div>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-10">
                        <Link href="/" className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Inicio</Link>
                        <Link href="#servicios" className="text-xs font-bold uppercase tracking-widest text-white hover:text-[#C5A059] transition-colors">Servicios</Link>
                        <Link href="#empresas" className="text-xs font-bold uppercase tracking-widest text-white hover:text-[#C5A059] transition-colors">Empresas</Link>
                        <Link href="#contacto" className="text-xs font-bold uppercase tracking-widest text-white hover:text-[#C5A059] transition-colors">Contacto</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="bg-[#C5A059] text-white px-8 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-lg hover:bg-white hover:text-[#003366] transition-all border-2 border-[#C5A059]"
                        >
                            Acceder
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-24 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-[#F4F4F4]/50 pointer-events-none" />
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#003366]/5 text-[#003366] text-[10px] font-bold uppercase tracking-widest mb-8 border border-[#003366]/10">
                            Instituto Superior Tecnológico ISTPET
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-extrabold text-[#003366] leading-tight mb-6">
                            Gestión Integral de <br />
                            Prácticas <span className="text-[#C5A059]">Preprofesionales</span>
                        </h2>
                        <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-10 max-w-xl">
                            Digitalización y control del proceso de formación académica vinculada al sector productivo. Un entorno seguro para estudiantes, tutores e instituciones.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/login" className="bg-[#003366] text-white px-10 py-4 rounded text-[11px] font-bold uppercase tracking-widest shadow-lg hover:bg-[#C5A059] transition-all border border-[#003366]">
                                Ingresar al Portal
                            </Link>
                            <Link href="/registrarse" className="bg-white border-2 border-[#003366] text-[#003366] px-10 py-3.5 rounded text-[11px] font-bold uppercase tracking-widest hover:bg-[#F4F4F4] transition-all">
                                Registrar Empresa
                            </Link>
                        </div>
                    </motion.div>

                    <div className="hidden lg:block">
                        <div className="bg-white p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center">
                            <div className="w-full h-80 bg-slate-50 rounded-xl flex flex-col items-center justify-center mb-6 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#003366]" />
                                <Image
                                    src={BRAND_LOGO_SRC}
                                    alt="Preview Logo"
                                    width={300}
                                    height={100}
                                    className="w-56 h-auto opacity-40 group-hover:opacity-100 transition-opacity object-contain"
                                />
                                <div className="mt-8 flex flex-col items-center">
                                    <div className="h-1.5 w-32 bg-slate-200 rounded-full mb-3" />
                                    <div className="h-1.5 w-24 bg-slate-100 rounded-full" />
                                </div>
                            </div>
                            <div className="flex gap-4 w-full">
                                <div className="flex-1 h-32 bg-[#003366] rounded-xl p-5 flex flex-col justify-between shadow-lg shadow-blue-900/20">
                                    <Users className="text-[#C5A059] w-6 h-6" />
                                    <p className="text-white font-bold text-[10px] uppercase tracking-widest">Módulo de <br />Estudiantes</p>
                                </div>
                                <div className="flex-1 h-32 bg-[#C5A059] rounded-xl p-5 flex flex-col justify-between shadow-lg shadow-orange-900/10">
                                    <Building2 className="text-white w-6 h-6" />
                                    <p className="text-white font-bold text-[10px] uppercase tracking-widest">Módulo de <br />Empresas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features: Iconos lineales en azul */}
            <section id="servicios" className="py-24 bg-[#F4F4F4] border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h3 className="text-[11px] font-bold text-[#C5A059] uppercase tracking-[0.4em] mb-4">Funcionalidades</h3>
                    <h4 className="text-3xl font-display font-extrabold text-[#003366] mb-16">Tecnología al servicio de la Vinculación</h4>

                    <div className="grid md:grid-cols-3 gap-8 text-left">
                        {[
                            {
                                icon: <MapPin className="w-8 h-8" />,
                                title: "Geolocalización",
                                desc: "Control de asistencia georeferenciado para validar la permanencia física en las sedes de prácticas."
                            },
                            {
                                icon: <FileText className="w-8 h-8" />,
                                title: "Informes Digitales",
                                desc: "Registro semanal de bitácoras y portafolios integrados bajo normativas académicas vigentes."
                            },
                            {
                                icon: <Lock className="w-8 h-8" />,
                                title: "Control Seguro",
                                desc: "Acceso protegido y trazabilidad de todos los cambios realizados por cada actor del sistema."
                            },
                            {
                                icon: <ShieldCheck className="w-8 h-8" />,
                                title: "Validación Institucional",
                                desc: "Flujo de aprobación jerárquico que asegura la calidad técnica de cada informe presentado."
                            },
                            {
                                icon: <BarChart3 className="w-8 h-8" />,
                                title: "Métricas Reales",
                                desc: "Seguimiento en tiempo real de horas acumuladas y cumplimiento del plan de vinculación."
                            },
                            {
                                icon: <Award className="w-8 h-8" />,
                                title: "Certificación QR",
                                desc: "Emisión de certificados finales con codificación QR para validación pública e institucional."
                            }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-8 rounded-lg border border-slate-200 hover:shadow-xl transition-all group">
                                <div className="text-[#003366] mb-6 transition-transform group-hover:scale-110">
                                    {item.icon}
                                </div>
                                <h5 className="text-lg font-bold text-[#003366] mb-3">{item.title}</h5>
                                <p className="text-sm text-slate-500 leading-relaxed leading-6">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Roles Info */}
            <section id="empresas" className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                    <div className="flex-1">
                        <h3 className="text-[11px] font-bold text-[#C5A059] uppercase tracking-[0.4em] mb-4 text-center md:text-left">Estructura Académica</h3>
                        <h4 className="text-3xl font-display font-extrabold text-[#003366] mb-8 text-center md:text-left">Actores del Sistema Emitesis</h4>
                        <div className="space-y-6">
                            {[
                                { title: "Estudiante", info: "Registra su asistencia y carga evidencias semanales." },
                                { title: "Tutor Académico", info: "Supervisa el progreso y aprueba informes técnicos." },
                                { title: "Coordinador", info: "Gestiona convenios y emite resoluciones finales." },
                                { title: "Entidad Receptora", info: "Valida la calidad del desempeño del pasante." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-5 items-start p-4 hover:bg-[#F4F4F4] rounded-lg transition-colors">
                                    <div className="w-8 h-8 bg-[#003366] text-white rounded flex items-center justify-center font-bold text-xs shrink-0">
                                        0{i + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#003366] mb-1 uppercase tracking-wider text-sm">{item.title}</p>
                                        <p className="text-slate-500 text-sm">{item.info}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="bg-[#003366] rounded-xl p-8 text-white h-64 flex flex-col justify-end">
                            <GraduationCap className="w-8 h-8 mb-4 text-[#C5A059]" />
                            <p className="font-bold uppercase tracking-widest text-xs">Acompañamiento</p>
                            <p className="text-lg font-black">Excelencia</p>
                        </div>
                        <div className="bg-[#F4F4F4] rounded-xl p-8 border border-slate-200 h-64 flex flex-col justify-end">
                            <Building2 className="w-8 h-8 mb-4 text-[#003366]" />
                            <p className="font-bold text-[#003366] uppercase tracking-widest text-xs">Alianzas</p>
                            <p className="text-lg font-black text-[#003366]">Estratégicas</p>
                        </div>
                        <div className="col-span-2 bg-[#C5A059] rounded-xl p-8 text-white h-48 flex items-center justify-between">
                            <div>
                                <p className="font-bold uppercase tracking-widest text-xs mb-2">Certificación</p>
                                <p className="text-2xl font-black">Oficial ISTPET</p>
                            </div>
                            <Award className="w-12 h-12 opacity-50" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer: Fondo azul institucional */}
            <footer id="contacto" className="bg-[#003366] pt-20 pb-10 text-white px-6 border-t-4 border-[#C5A059]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-2">
                            <div className="flex items-center gap-4 mb-8">
                                <Image
                                    src={BRAND_LOGO_SRC}
                                    alt="Logo ISTPET"
                                    width={120}
                                    height={30}
                                    className="h-8 w-auto object-contain drop-shadow-sm"
                                />
                                <div className="w-px h-6 bg-white/20" />
                                <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#C5A059]">Emitesis</span>
                            </div>
                            <p className="text-white/60 text-sm max-w-sm leading-relaxed mb-8">
                                Sistema de Gestión de Prácticas Preprofesionales del Instituto Superior Tecnológico &quot;Mayor Pedro Traversari&quot;. Compromiso con la formación de calidad.
                            </p>
                            <div className="flex gap-3">
                                {[Globe2, MapPin].map((Icon, i) => (
                                    <div key={i} className="w-10 h-10 rounded border border-white/10 flex items-center justify-center hover:bg-[#C5A059] hover:border-[#C5A059] transition-all cursor-pointer">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] mb-8">Información</h5>
                            <ul className="space-y-4">
                                {['Sobre el Instituto', 'Marco Legal', 'Servicios', 'Ayuda'].map(l => (
                                    <li key={l}><Link href="#" className="text-xs font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest">{l}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] mb-8">Contacto</h5>
                            <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                                <p className="text-xs text-white/60 mb-2">Mesa de Ayuda</p>
                                <p className="text-sm font-bold truncate">vinculacion@istpet.edu.ec</p>
                            </div>
                        </div>
                    </div>
                    <div className="pt-10 border-t border-white/10 text-center flex flex-col items-center gap-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
                            © 2026 ISTPET - Emitesis - Cristhofer Steve Parreño Poma
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
