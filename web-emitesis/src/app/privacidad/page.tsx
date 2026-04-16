import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, Download, Search, Info, Scale } from "lucide-react";
import {
  getDataProtectionContactEmail,
  INSTITUTE_LEGAL_NAME,
} from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Aviso Legal y de Privacidad (LOPDP) — ISTPET Emitesis",
  description:
    "Marco legal y política institucional para el tratamiento de datos personales en cumplimiento con la LOPDP Ecuador.",
};

export default function PrivacidadPage() {
  const contactEmail = getDataProtectionContactEmail();

  return (
    <div className="bg-[#F8FAFC] min-h-screen pt-32 pb-24 px-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-3xl -mr-80 -mt-80 -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#C5A059]/5 rounded-full blur-3xl -ml-40 -mb-40 -z-10" />

      <article className="max-w-4xl mx-auto bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-blue-900/5 p-10 md:p-20 text-slate-700 relative">
        <div className="flex items-center gap-4 mb-10">
           <div className="w-16 h-16 bg-[#003366] rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="text-[#C5A059] w-8 h-8" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] mb-1">ISTPET · Emitesis</p>
              <h1 className="text-3xl font-black text-[#003366] tracking-tight">Política de Privacidad Institucional</h1>
           </div>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-base text-slate-600 leading-relaxed mb-12 font-medium">
            El presente documento constituye el <strong className="text-[#003366]">Aviso de Privacidad</strong> para el tratamiento de datos personales del sistema Emitesis, en cumplimiento estricto con la <strong className="text-[#003366]">Ley Orgánica de Protección de Datos Personales (LOPDP)</strong> de la República del Ecuador. El <span className="text-[#003366] font-bold">{INSTITUTE_LEGAL_NAME}</span> garantiza el ejercicio soberano de sus derechos informativos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
             <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                <Lock className="w-6 h-6 text-[#C5A059] mb-4" />
                <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-3">Seguridad Técnica</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Cifrado de extremo a extremo, almacenamiento blindado y auditoría permanente de accesos por parte del Oficial de Protección de Datos (DPO).</p>
             </div>
             <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                <Search className="w-6 h-6 text-[#C5A059] mb-4" />
                <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-3">Transparencia Total</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Usted siempre sabrá por qué tratamos su ubicación, su biometría o sus registros académicos, basándonos en el interés legítimo y el consentimiento.</p>
             </div>
          </div>

          <div className="space-y-12">
            <section>
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <span className="text-xs font-black text-[#003366]">01</span>
                 </div>
                 <h2 className="text-lg font-black text-[#003366] tracking-tight">Responsable del Tratamiento</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pl-11">
                {INSTITUTE_LEGAL_NAME}, domiciliado en Quito, Ecuador, es la entidad responsable que determina los fines y medios del tratamiento de la información personal gestionada en la plataforma Emitesis.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <span className="text-xs font-black text-[#003366]">02</span>
                 </div>
                 <h2 className="text-lg font-black text-[#003366] tracking-tight">Finalidades Específicas</h2>
              </div>
              <div className="pl-11 space-y-4">
                 <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0"><Info className="w-4 h-4 text-[#C5A059]" /></div>
                    <p className="text-sm text-slate-600 font-medium"><span className="text-[#003366] font-bold">Gestión Académica:</span> Administración de prácticas preprofesionales, pasantías y vinculación.</p>
                 </div>
                 <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0"><Info className="w-4 h-4 text-[#C5A059]" /></div>
                    <p className="text-sm text-slate-600 font-medium"><span className="text-[#003366] font-bold">Control de Asistencia:</span> Verificación de cumplimiento horario mediante geolocalización (radio de 200m) y registro fotográfico.</p>
                 </div>
                 <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0"><Info className="w-4 h-4 text-[#C5A059]" /></div>
                    <p className="text-sm text-slate-600 font-medium"><span className="text-[#003366] font-bold">Seguridad Institucional:</span> Prevención de suplantación de identidad mediante autenticación biometría (WebAuthn).</p>
                 </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <span className="text-xs font-black text-[#003366]">03</span>
                 </div>
                 <h2 className="text-lg font-black text-[#003366] tracking-tight">Ejercicio de Derechos ARCO</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pl-11 mb-6">
                En concordancia con los Artículos 13 al 18 de la LOPDP, usted puede ejercer sus derechos de <strong className="text-[#003366]">Acceso, Rectificación, Cancelación y Oposición</strong> de forma directa a través del <Link href="/dashboard/perfil/privacidad" className="text-[#C5A059] font-bold underline underline-offset-4">Centro de Privacidad</Link> en su panel de control o contactando al DPO:
              </p>
              <div className="ml-11 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Delegado de Protección de Datos</p>
                    <p className="text-sm font-bold text-[#003366]">{contactEmail}</p>
                 </div>
                 <a href={`mailto:${contactEmail}`} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#003366] hover:bg-slate-50 transition-colors">Contactar</a>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <span className="text-xs font-black text-[#003366]">04</span>
                 </div>
                 <h2 className="text-lg font-black text-[#003366] tracking-tight">Base Legal y Conservación</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pl-11">
                La base legal principal es el consentimiento del titular y la ejecución del contrato educativo. Los datos se conservarán durante la vigencia de la relación académica y, posteriormente, durante los plazos de prescripción legal exigidos por la LOES (hasta 10 años para diplomas y certificados).
              </p>
            </section>
          </div>
        </div>

        <footer className="mt-24 pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-6">
              <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#003366] transition-colors">Inicio</Link>
              <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#003366] transition-colors">Panel de Control</Link>
           </div>
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Última Actualización Administrativa: Abril 2026</p>
        </footer>
      </article>
    </div>
  );
}
