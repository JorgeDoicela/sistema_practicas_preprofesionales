"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { GraduationCap, Target, Users, MapPin, Globe2 } from "lucide-react";

export default function NosotrosPage() {
    return (
        <div className="pt-32 pb-20">
            {/* Hero Section */}
            <section className="px-6 mb-24">
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.5em] mb-4 block">Nuestra Identidad</span>
                        <h1 className="text-5xl md:text-7xl font-black text-brand-blue mb-8 tracking-tighter">
                            Excelencia en <br /> Formación Técnica
                        </h1>
                        <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg">
                            {
                              "El Instituto Superior Tecnológico \"Mayor Pedro Traversari\" (ISTPET) es una institución comprometida con el desarrollo profesional y productivo del Ecuador."
                            }
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Misión y Visión */}
            <section className="px-6 py-20 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="p-12 rounded-[3rem] bg-slate-50 border border-slate-100"
                    >
                        <Target className="w-12 h-12 text-brand-gold mb-6" />
                        <h2 className="text-3xl font-black text-brand-blue mb-6 tracking-tight italic">Misión</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            Formar profesionales competitivos, creativos, íntegros y con valores, con un elevado nivel académico, científico, investigativo y tecnológico, sobre la base de un modelo de calidad, que contribuyan de manera activa al desarrollo del sector productivo y social.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="p-12 rounded-[3rem] bg-brand-blue text-white shadow-2xl shadow-blue-900/20"
                    >
                        <Globe2 className="w-12 h-12 text-brand-gold mb-6" />
                        <h2 className="text-3xl font-black text-white mb-6 tracking-tight italic">Visión</h2>
                        <p className="text-white/80 leading-relaxed font-medium">
                            Ser un Instituto Superior Tecnológico acreditado con reconocimiento de la sociedad, fundamentado en una gestión académica y administrativa de calidad, con infraestructura tecnológica adecuada y proyectos de vinculación que aporten a la solución de problemas locales.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Información Institucional */}
            <section className="px-6 py-32">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-12">
                            <div>
                                <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4">Ubicación y Contacto</h3>
                                <div className="flex gap-6 items-start p-6 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center shrink-0">
                                        <MapPin className="text-brand-blue w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-black text-brand-blue uppercase text-sm mb-1 tracking-tight">Sede Principal</p>
                                        <p className="text-slate-500 text-sm font-medium">Av. Matilde Álvarez y Hugo Díaz Romero, Sector Chillogallo. Quito, Ecuador.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-8 rounded-3xl bg-white border border-slate-100">
                                    <Users className="text-brand-gold w-8 h-8 mb-4" />
                                    <p className="font-black text-brand-blue uppercase text-xs mb-2">Comunidad</p>
                                    <p className="text-slate-500 text-sm font-medium">Más de 5,000 profesionales formados con ética y rigor técnico.</p>
                                </div>
                                <div className="p-8 rounded-3xl bg-white border border-slate-100">
                                    <GraduationCap className="text-brand-gold w-8 h-8 mb-4" />
                                    <p className="font-black text-brand-blue uppercase text-xs mb-2">Oferta Académica</p>
                                    <p className="text-slate-500 text-sm font-medium">Tecnologías superiores alineadas a la demanda laboral real.</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 bg-brand-gold/10 rounded-3xl blur-2xl" />
                            <div className="relative glass p-10 rounded-[3rem] border border-white items-center justify-center flex flex-col h-[400px]">
                                <Image
                                    src="/images/Logo.png"
                                    alt="ISTPET Logo large"
                                    width={250}
                                    height={100}
                                    className="opacity-20 grayscale brightness-0 invert shadow-2xl"
                                />
                                <div className="mt-12 text-center">
                                    <p className="text-3xl font-black text-brand-blue italic tracking-tighter">Traversari</p>
                                    <p className="text-sm font-bold text-brand-gold uppercase tracking-[0.3em]">Educación Superior</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
