"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
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
  Zap
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F4F4F4] selection:bg-[#C5A059] selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#003366]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[5%] left-[-5%] w-[300px] h-[300px] bg-[#C5A059]/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 py-12">
        
        {/* --- HERO SECTION --- */}
        <section className="relative pt-4 pb-16 md:pt-12 md:pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-10"
            >
              <div className="mb-12">
                <Image 
                  src="/images/ISTPET_sin_fondo.png" 
                  alt="Logo ISTPET" 
                  width={220} 
                  height={80} 
                  className="h-auto w-auto max-w-[280px]"
                  priority
                />
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-[#003366] text-xs font-bold uppercase tracking-[0.15em] mb-8 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C5A059]"></span>
                </span>
                Excelencia Tecnológica ISTPET
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-[#003366] leading-[0.95] mb-6 font-display">
                Gestión de <br />
                <span className="text-[#C5A059]">Prácticas</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl font-body">
                Plataforma oficial del <span className="font-bold text-[#003366]">Instituto Superior Tecnológico "Mayor Pedro Traversari"</span> para la automatización, seguimiento y certificación de prácticas preprofesionales.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-5">
                <Link
                  href="/login"
                  className="group relative inline-flex items-center justify-center rounded-xl bg-[#003366] px-10 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-blue-900/10 transition-all hover:bg-blue-950 hover:shadow-blue-950/20 active:scale-95"
                >
                  Acceder al Portal
                  <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#modulos"
                  className="inline-flex items-center justify-center rounded-xl bg-white border-2 border-[#003366]/10 px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#003366] transition-all hover:bg-slate-50 hover:border-[#003366]/30 active:scale-95 shadow-sm"
                >
                  Conocer Módulos
                </a>
              </div>

              <div className="mt-12 flex items-center gap-6 border-t border-slate-200 pt-8">
                <div className="text-sm">
                  <p className="font-black text-[#003366] uppercase tracking-tighter text-lg">Innovación & Calidad</p>
                  <p className="text-slate-500 font-medium">Cumplimiento estricto de estándares académicos</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-x-0 -bottom-10 h-2/3 bg-gradient-to-t from-[#003366]/5 to-transparent blur-3xl pointer-events-none" />
              <div className="relative rounded-[3rem] overflow-hidden border-[12px] border-white shadow-[0_32px_64px_-16px_rgba(0,51,102,0.15)] bg-white">
                <Image 
                  src="/images/ISTPET_sin_fondo.png" 
                  alt="ISTPET Portal Illustration" 
                  width={800} 
                  height={600}
                  className="w-full h-auto object-contain p-12 opacity-80"
                  priority
                />
                
                {/* Floating Institutional Badge */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-10 right-10 bg-[#003366] text-white p-6 rounded-[2rem] shadow-2xl border-4 border-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#C5A059] rounded-xl flex items-center justify-center text-[#003366]">
                      <Award className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#C5A059]">Certificación</p>
                      <p className="text-lg font-black leading-none">Automática</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- PROBLEM VS SOLUTION (Bento Style) --- */}
        <section className="relative">
          <div className="grid gap-6 md:grid-cols-12 md:grid-rows-2">
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-12 lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
            >
              <span className="inline-flex p-3 rounded-xl bg-red-50 text-red-600 mb-6">
                <Clock className="w-6 h-6" />
              </span>
              <h2 className="text-2xl font-black text-[#003366] tracking-tight">El Desafío Actual</h2>
              <p className="mt-4 text-slate-600 text-sm leading-relaxed">
                La gestión manual fragmenta la trazabilidad y consume el valioso tiempo de coordinadores y estudiantes.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Lentitud", "Pérdida de Datos", "Opacidad", "Error Humano"].map(t => (
                  <span key={t} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-100">{t}</span>
                ))}
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-12 lg:col-span-8 bg-[#003366] p-8 md:p-12 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="relative">
                <span className="inline-flex p-3 rounded-xl bg-[#C5A059]/20 text-[#C5A059] mb-6">
                  <Zap className="w-6 h-6 text-[#C5A059]" />
                </span>
                <h2 className="text-3xl font-black tracking-tight mb-4">La Transformación ISTPET</h2>
                <p className="text-slate-300 max-w-lg mb-8">
                  Un núcleo digital blindado que unifica a la industria y la academia bajo un estándar de eficiencia total.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    "Validación por Geovallado",
                    "Pipeline Documental ISO",
                    "Certificación Instantánea",
                    "Reportes Gerenciales"
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                      <CheckCircle2 className="w-5 h-5 text-[#C5A059]" />
                      <span className="text-sm font-bold text-slate-200 tracking-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- ACTORES --- */}
        <section id="actores" className="scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <h2 className="text-4xl font-black text-[#003366] tracking-tighter uppercase mb-3">Ecosistema de Usuarios</h2>
              <div className="h-1.5 w-24 bg-[#C5A059] rounded-full" />
            </div>
            <p className="text-slate-500 font-medium max-w-sm">
              Control de acceso granular (RBAC) alineado con los niveles de gobernanza institucional.
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <ActorCard 
              title="Administrador" 
              desc="Control central del sistema y auditoría." 
              icon={<ShieldCheck />} 
              color="blue" 
            />
            <ActorCard 
              title="Coordinador" 
              desc="Aprobación final y emisión de méritos." 
              icon={<Award />} 
              color="gold" 
            />
            <ActorCard 
              title="Tutor" 
              desc="Mentoría y validación académica directa." 
              icon={<GraduationCap />} 
              color="blue" 
            />
            <ActorCard 
              title="Estudiante" 
              desc="Ejecución y registro de crecimiento PROF." 
              icon={<Users />} 
              color="gold" 
            />
            <ActorCard 
              title="Empresa" 
              desc="Recepción de talento y validación externa." 
              icon={<Building2 />} 
              color="blue" 
            />
          </div>
        </section>

        {/* --- MÓDULOS --- */}
        <section id="modulos" className="scroll-mt-24">
          <div className="bg-[#003366] rounded-[3.5rem] p-10 md:p-16 overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            
            <div className="relative grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-black text-white md:text-5xl leading-[0.9] uppercase font-display">
                  Capacidades <br />
                  <span className="text-[#C5A059]">Core del Sistema</span>
                </h2>
                <div className="mt-12 space-y-6">
                  <ModuleBox num="01" title="Contratos & Convenios" desc="Blindaje legal y gestión de RUC institucional." />
                  <ModuleBox num="02" title="Validación Documental" desc="Bloqueo permanente de archivos aprobados." />
                  <ModuleBox num="03" title="Geo-Asistencia" desc="Cálculo Haversine con margen de 200m." />
                  <ModuleBox num="04" title="Emisión de Títulos" desc="PDFs con trazabilidad y alta seguridad." />
                </div>
              </div>
              
              <div className="relative">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="rounded-[3rem] overflow-hidden border-8 border-white/10 shadow-3xl shadow-blue-950"
                >
                  <Image 
                    src="/images/ISTPET_sin_fondo.png" 
                    alt="ISTPET Features Integration" 
                    width={600} 
                    height={800}
                    className="w-full h-auto object-contain p-12 bg-white/5"
                  />
                </motion.div>
                {/* Stats */}
                <div className="absolute -top-6 -right-6 bg-[#C5A059] p-6 rounded-2xl shadow-xl text-[#003366]">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Seguridad</p>
                  <p className="text-2xl font-black">BCRYPT 12</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- HAVERSINE SECTION --- */}
        <section className="bg-white rounded-[3rem] p-8 md:p-16 border border-slate-200 shadow-sm relative overflow-hidden group text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#C5A059]" />
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#003366]/5 inline-flex p-5 rounded-3xl text-[#003366] mb-8 border border-[#003366]/10">
              <MapPin className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-[#003366] uppercase tracking-tighter mb-4">Integridad de Ubicación</h2>
            <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">
              Precisión de grado militar mediante el algoritmo de <span className="text-[#003366] font-bold">Haversine</span>, asegurando que el cumplimiento sea físico y verificable mediante geovallado.
            </p>
            <div className="inline-block p-6 rounded-2xl bg-slate-50 font-mono text-sm text-[#003366] border border-slate-100 shadow-inner">
              d = 2r · arcsin(√(sin²(Δlat/2) + cos(lat₁)cos(lat₂)sin²(Δlon/2)))
            </div>
          </div>
        </section>

        {/* --- FOOTER CTA --- */}
        <section className="pb-12 text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white shadow-2xl shadow-slate-950/20"
            >
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">Portal de Prácticas ISTPET</h2>
              <p className="text-slate-400 max-w-xl mx-auto mb-10 text-lg">
                Impulsando la excelencia académica a través de la digitalización inteligente.
              </p>
              <Link
                href="/login"
                className="bg-[#C5A059] text-[#003366] px-12 py-5 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-[#C5A059]/10 hover:shadow-[#C5A059]/20 transition-all hover:-translate-y-1 block sm:inline-block"
              >
                Ingresar al Sistema
              </Link>
              <div className="mt-16 pt-8 border-t border-white/5 text-slate-500 text-xs font-bold uppercase tracking-widest flex flex-col md:flex-row items-center justify-between gap-4">
                <span>© 2026 IST Mayor Pedro Traversari</span>
                <span>Desarrollado con Estándar ISTPET Elite</span>
              </div>
            </motion.div>
        </section>
      </div>
    </div>
  );
}

function ActorCard({ title, desc, icon, color }: { title: string, desc: string, icon: React.ReactNode, color: string }) {
  const isGold = color === 'gold';
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className={`p-8 rounded-[2rem] border transition-all ${isGold ? 'bg-white border-[#C5A059]/20 shadow-md hover:shadow-xl hover:shadow-[#C5A059]/10' : 'bg-slate-50 border-slate-100 shadow-sm hover:shadow-lg'}`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${isGold ? 'bg-[#C5A059] text-[#003366]' : 'bg-[#003366] text-white'}`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-[#003366] tracking-tight">{title}</h3>
      <p className="mt-3 text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function ModuleBox({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="flex items-center gap-6 group">
      <div className="text-3xl font-black text-white/10 group-hover:text-[#C5A059] transition-colors font-display">
        {num}
      </div>
      <div>
        <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
        <p className="text-slate-400 text-xs font-medium">{desc}</p>
      </div>
    </div>
  );
}
