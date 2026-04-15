import Link from "next/link";
import Image from "next/image";
import { Globe2, Building2, ShieldCheck } from "lucide-react";
import { BRAND_LOGO_SRC } from "@/lib/brand";

export function Footer() {
    return (
        <footer className="bg-slate-50 py-20 px-6 border-t border-slate-200">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-2">
                        <div className="flex items-center gap-3 mb-8">
                            <Image
                                src={BRAND_LOGO_SRC}
                                alt="Logo ISTPET"
                                width={120}
                                height={30}
                                className="h-8 w-auto grayscale opacity-50"
                            />
                            <div className="w-px h-6 bg-slate-300" />
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-blue">Emitesis</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed mb-8">
                            Sistema de Gestión de Prácticas Preprofesionales del Instituto Superior Tecnológico &quot;Mayor Pedro Traversari&quot;. Innovación y Excelencia Académica.
                        </p>
                        <div className="flex gap-4">
                            {[Globe2, Building2, ShieldCheck].map((Icon, i) => (
                                <div key={i} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-blue hover:border-brand-blue transition-all cursor-pointer">
                                    <Icon className="w-5 h-5" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-8">Navegación</p>
                        <ul className="space-y-4">
                            {[
                                { name: 'Sobre Emitesis', path: '/nosotros' },
                                { name: 'Servicios Académicos', path: '/servicios' },
                                { name: 'Portal Empresas', path: '/empresas' },
                                { name: 'Soporte Técnico', path: '#' }
                            ].map(item => (
                                <li key={item.name}>
                                    <Link href={item.path} className="text-[11px] font-bold text-slate-400 hover:text-brand-blue uppercase transition-colors tracking-tighter">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-8">Contacto</p>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[9px] font-black text-brand-gold uppercase tracking-widest mb-1">Escríbenos</p>
                                <p className="text-sm font-bold text-brand-blue">vinculacion@istpet.edu.ec</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-brand-gold uppercase tracking-widest mb-1">Ubicación</p>
                                <p className="text-sm font-bold text-brand-blue">Quito, Ecuador - Sector Chillogallo</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        © 2026 ISTPET – Emitesis. Desarrollado por Cristhofer Steve Parreño Poma.
                    </p>
                    <div className="flex items-center gap-8">


                    </div>
                </div>
            </div>
        </footer>
    );
}
