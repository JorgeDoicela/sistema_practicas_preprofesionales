"use client";

import { useLanguage } from "@/providers/LanguageProvider";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/index";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/providers/ThemeProvider";

/**
 * LanguageToggle — dropdown compacto para cambiar idioma en el Navbar.
 * Muestra la bandera y el nombre del idioma activo.
 */
export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Placeholder para evitar layout shift durante SSR
  if (!mounted) return <div className="w-[52px] h-8" />;

  const current = LOCALE_LABELS[locale];
  const isDark = resolvedTheme === "dark";

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setOpen((v) => !v)}
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 border text-[11px] font-bold
          ${isDark
            ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            : "bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50"
          }
        `}
        aria-label="Change language"
        title="Change language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="uppercase tracking-widest hidden sm:inline">{locale}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.14 }}
            className={`
              absolute right-0 top-full mt-2 w-40 rounded-2xl shadow-2xl border overflow-hidden z-[100]
              ${isDark
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-100"
              }
            `}
          >
            {LOCALES.map((loc: Locale) => {
              const info = LOCALE_LABELS[loc];
              const isActive = loc === locale;
              return (
                <button
                  key={loc}
                  onClick={() => { setLocale(loc); setOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all
                    ${isActive
                      ? isDark
                        ? "bg-sky-500/20 text-sky-400"
                        : "bg-brand-blue/10 text-brand-blue"
                      : isDark
                        ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                        : "text-slate-500 hover:bg-slate-50 hover:text-brand-blue"
                    }
                  `}
                >
                  <span className="text-base">{info.flag}</span>
                  <span>{info.native}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
