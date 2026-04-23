"use client";
import Link from "next/link";
import Image from "next/image";
import { Globe2, Building2, ShieldCheck } from "lucide-react";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";

export function Footer() {
    const pathname = usePathname();
    const { t } = useLanguage();

    const hiddenRoutes = [
        "/login",
        "/admin",
        "/coordinador",
        "/tutor",
        "/estudiante",
        "/empresa",
        "/dashboard",
        "/registrarse",
        "/reset-password",
        "/olvido-password"
    ];

    const isHidden = hiddenRoutes.some((route) => {
        if (!pathname) return false;
        if (route === "/empresa") {
            return pathname === "/empresa" || pathname.startsWith("/empresa/");
        }
        return pathname.startsWith(route);
    });

    if (isHidden) return null;

    const navLinks = [
        { name: t.footer.links.about,     path: '/nosotros' },
        { name: t.footer.links.services,  path: '/servicios' },
        { name: t.footer.links.companies, path: '/empresas' },
        { name: t.footer.links.privacy,   path: '/privacidad' },
        { name: t.footer.links.support,   path: '#' },
    ];

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
                            {t.footer.description}
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
                        <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-8">{t.footer.navigation}</p>
                        <ul className="space-y-4">
                            {navLinks.map(item => (
                                <li key={item.name}>
                                    <Link href={item.path} className="text-[11px] font-bold text-slate-400 hover:text-brand-blue uppercase transition-colors tracking-tighter">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-8">{t.footer.contact}</p>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[9px] font-black text-brand-gold uppercase tracking-widest mb-1">{t.footer.writeUs}</p>
                                <p className="text-sm font-bold text-brand-blue">vinculacion@istpet.edu.ec</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-brand-gold uppercase tracking-widest mb-1">{t.footer.location}</p>
                                <p className="text-sm font-bold text-brand-blue">{t.footer.locationValue}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        {t.footer.copyright}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <Link
                            href="/privacidad"
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-brand-blue transition-colors"
                        >
                            {t.footer.privacyLink}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
