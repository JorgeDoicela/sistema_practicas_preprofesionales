"use client";

import Link from "next/link";
import { ShieldCheck, Lock, Search, Info, ArrowLeft } from "lucide-react";
import {
    getDataProtectionContactEmail,
    INSTITUTE_LEGAL_NAME,
} from "@/lib/privacy";
import { useLanguage } from "@/providers/LanguageProvider";

export default function PrivacidadPage() {
    const contactEmail = getDataProtectionContactEmail();
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16 sm:pb-20 px-4 sm:px-6">
            {/* bg ornaments */}
            <div className="fixed top-0 right-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-80 h-80 bg-brand-gold/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="max-w-3xl mx-auto">

                {/* back */}
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-blue transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    {t.privacy.back}
                </Link>

                {/* header card */}
                <div className="bg-brand-blue rounded-2xl p-5 sm:p-8 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-brand-gold/15 rounded-full blur-3xl" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-7 h-7 text-brand-gold" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.3em] mb-1">{t.privacy.header.label}</p>
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{t.privacy.header.title}</h1>
                            <p className="text-white/50 text-xs mt-1">{t.privacy.header.version}</p>
                        </div>
                    </div>
                </div>

                {/* intro */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-8 mb-6 shadow-sm">
                    <p className="text-slate-600 leading-relaxed text-sm">
                        {t.privacy.introFull}
                    </p>
                </div>

                {/* highlight grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    {t.privacy.tech.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <div className="w-9 h-9 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-4">
                                {idx === 0 ? <Lock className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                            </div>
                            <h3 className="font-bold text-brand-blue text-sm mb-2">{item.title}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* sections */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">

                    {t.privacy.sections.map((section, idx) => (
                        <div key={idx} className="p-5 sm:p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-black text-brand-blue">{section.num}</span>
                                </div>
                                <h2 className="font-black text-brand-blue">{section.title}</h2>
                            </div>
                            {section.desc && (
                                <div className="pl-11">
                                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                        {section.desc}
                                    </p>
                                    {section.num === "03" && (
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                    {section.dpoLabel}
                                                </p>
                                                <p className="font-semibold text-brand-blue text-sm">{contactEmail}</p>
                                            </div>
                                            <a
                                                href={`mailto:${contactEmail}`}
                                                className="inline-flex items-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-gold transition-colors flex-shrink-0"
                                            >
                                                {section.dpoBtn}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                            {section.items && (
                                <div className="pl-11 space-y-3">
                                    {section.items.map(item => (
                                        <div key={item.title} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                            <Info className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-slate-600">
                                                <span className="font-semibold text-brand-blue">{item.title}:</span>{" "}{item.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* footer */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="hover:text-brand-blue transition-colors font-medium">{t.privacy.footer.home}</Link>
                        <Link href="/login" className="hover:text-brand-blue transition-colors font-medium">{t.privacy.footer.dashboard}</Link>
                    </div>
                    <p className="font-medium">{t.privacy.footer.update}</p>
                </div>
            </div>
        </div>
    );
}
