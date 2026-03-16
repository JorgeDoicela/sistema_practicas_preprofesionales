"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    ShieldCheck,
    FileText,
    MapPin,
    Award,
    Users,
    GraduationCap,
    Building2,
    CheckCircle2,
    ArrowRight,
    Target,
    Clock,
    Zap,
    BarChart3,
    Globe2,
    Lock,
    ChevronRight,
    ArrowRightCircle
} from "lucide-react";

export default function Home() {
    const { scrollYProgress } = useScroll();
    const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

    return (
        <div className="min-h-screen bg-[#FDFDFD] selection:bg-[#C5A059] selection:text-white overflow-x-hidden">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
              <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="bg-[#003366] p-2 rounded-xl group-hover:scale-105 transition-transform">
                    <Image 
                      src="/images/ISTPET_sin_fondo.png" 
                      alt="Logo ISTPET" 
                      width={120} 
                      height={30} 
                      className="h-7 w-auto brightness-0 invert"
                      priority
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#003366] leading-none mb-1">Ecosistema</p>
                    <p className="text-sm font-black uppercase tracking-tight text-slate-400 leading-none">Emitesis</p>
                  </div>
                </Link>
                <nav className="flex items-center gap-4">
                  <Link href="/login" className="relative group overflow-hidden bg-[#003366] text-white px-8 py-3 rounded-2xl shadow-xl hover:translate-y-[-2px] transition-all">
                    <div className="relative z-10 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em]">
                      Acceso Portal
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                </nav>
              </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-24 lg:py-40 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-[#003366]/5 text-[#003366] text-[11px] font-black uppercase tracking-widest mb-10">
                                ISTPET Ecosistema de Innovación
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[#003366] leading-none mb-8">
                                Prácticas <br />
                                <span className="text-[#C5A059]">Elite</span>
                            </h1>
                            <p className="text-xl text-slate-600 leading-relaxed max-w-xl mb-12">
                                Digitalización integral del proceso de formación profesional. Control, seguridad y trazabilidad absoluta.
                            </p>
                            <div className="flex gap-6">
                                <Link href="/login" className="bg-[#003366] text-white px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:translate-y-[-4px] transition-all">
                                    Empezar Ahora
                                </Link>
                                <Link href="/registrarse" className="bg-white border border-slate-200 text-[#003366] px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                    Registrar Empresa
                                </Link>
                            </div>
                        </motion.div>
                         <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="hidden lg:block relative">
                            <div className="bg-white p-20 rounded-[4rem] shadow-3xl border border-slate-100">
                                <Image src="/images/ISTPET_sin_fondo.png" alt="Preview" width={800} height={800} className="w-full h-auto opacity-10" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
