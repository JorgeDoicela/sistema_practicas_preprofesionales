import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, Search, Info, ArrowLeft } from "lucide-react";
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
        <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-6">
            {/* bg ornaments */}
            <div className="fixed top-0 right-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-80 h-80 bg-brand-gold/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="max-w-3xl mx-auto">

                {/* back */}
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-blue transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Volver al inicio
                </Link>

                {/* header card */}
                <div className="bg-brand-blue rounded-2xl p-8 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-brand-gold/15 rounded-full blur-3xl" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-7 h-7 text-brand-gold" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.3em] mb-1">ISTPET · Emitesis</p>
                            <h1 className="text-2xl font-black text-white tracking-tight">Política de Privacidad Institucional</h1>
                            <p className="text-white/50 text-xs mt-1">Cumplimiento LOPDP Ecuador · Versión 1.0 · Abril 2026</p>
                        </div>
                    </div>
                </div>

                {/* intro */}
                <div className="bg-white rounded-2xl border border-slate-100 p-8 mb-6 shadow-sm">
                    <p className="text-slate-600 leading-relaxed text-sm">
                        El presente documento constituye el{" "}
                        <strong className="text-brand-blue">Aviso de Privacidad</strong> para el tratamiento de datos
                        personales del sistema Emitesis, en cumplimiento estricto con la{" "}
                        <strong className="text-brand-blue">
                            Ley Orgánica de Protección de Datos Personales (LOPDP)
                        </strong>{" "}
                        de la República del Ecuador. El{" "}
                        <span className="text-brand-blue font-semibold">{INSTITUTE_LEGAL_NAME}</span> garantiza el
                        ejercicio soberano de sus derechos informativos.
                    </p>
                </div>

                {/* highlight grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <div className="w-9 h-9 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-4">
                            <Lock className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-brand-blue text-sm mb-2">Seguridad Técnica</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Cifrado extremo a extremo, almacenamiento blindado y auditoría permanente de accesos por parte
                            del Oficial de Protección de Datos (DPO).
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <div className="w-9 h-9 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-4">
                            <Search className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-brand-blue text-sm mb-2">Transparencia Total</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Siempre sabrá por qué tratamos su ubicación, biometría o registros académicos, basándonos en
                            consentimiento e interés legítimo.
                        </p>
                    </div>
                </div>

                {/* sections */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">

                    {/* section 01 */}
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-black text-brand-blue">01</span>
                            </div>
                            <h2 className="font-black text-brand-blue">Responsable del Tratamiento</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-11">
                            {INSTITUTE_LEGAL_NAME}, domiciliado en Quito, Ecuador, es la entidad responsable que determina los
                            fines y medios del tratamiento de la información personal gestionada en la plataforma Emitesis.
                        </p>
                    </div>

                    {/* section 02 */}
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-black text-brand-blue">02</span>
                            </div>
                            <h2 className="font-black text-brand-blue">Finalidades Específicas</h2>
                        </div>
                        <div className="pl-11 space-y-3">
                            {[
                                { title: "Gestión Académica", desc: "Administración de prácticas preprofesionales, pasantías y vinculación institucional." },
                                { title: "Control de Asistencia", desc: "Verificación de cumplimiento horario mediante geolocalización Haversine (radio configurable) y registro fotográfico." },
                                { title: "Seguridad Institucional", desc: "Prevención de suplantación de identidad mediante autenticación biométrica WebAuthn FIDO2." },
                            ].map(f => (
                                <div key={f.title} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Info className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-slate-600">
                                        <span className="font-semibold text-brand-blue">{f.title}:</span>{" "}{f.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* section 03 */}
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-black text-brand-blue">03</span>
                            </div>
                            <h2 className="font-black text-brand-blue">Ejercicio de Derechos ARCO</h2>
                        </div>
                        <div className="pl-11">
                            <p className="text-sm text-slate-600 leading-relaxed mb-5">
                                De acuerdo con los Artículos 13 al 18 de la LOPDP, puede ejercer sus derechos de{" "}
                                <strong className="text-brand-blue">Acceso, Rectificación, Cancelación y Oposición</strong>{" "}
                                directamente a través del{" "}
                                <Link href="/dashboard/perfil/privacidad" className="text-brand-gold font-semibold hover:underline underline-offset-4">
                                    Centro de Privacidad
                                </Link>{" "}
                                en su panel de control o contactando al DPO:
                            </p>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                        Delegado de Protección de Datos
                                    </p>
                                    <p className="font-semibold text-brand-blue text-sm">{contactEmail}</p>
                                </div>
                                <a
                                    href={`mailto:${contactEmail}`}
                                    className="inline-flex items-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-gold transition-colors flex-shrink-0"
                                >
                                    Contactar DPO
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* section 04 */}
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-black text-brand-blue">04</span>
                            </div>
                            <h2 className="font-black text-brand-blue">Base Legal y Conservación</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-11">
                            La base legal principal es el consentimiento del titular y la ejecución del contrato educativo.
                            Los datos se conservarán durante la vigencia de la relación académica y, posteriormente, durante
                            los plazos de prescripción legal exigidos por la LOES{" "}
                            <span className="text-brand-blue font-semibold">(hasta 10 años para diplomas y certificados)</span>.
                        </p>
                    </div>
                </div>

                {/* footer */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="hover:text-brand-blue transition-colors font-medium">Inicio</Link>
                        <Link href="/login" className="hover:text-brand-blue transition-colors font-medium">Panel de Control</Link>
                    </div>
                    <p className="font-medium">Última actualización: Abril 2026</p>
                </div>
            </div>
        </div>
    );
}
