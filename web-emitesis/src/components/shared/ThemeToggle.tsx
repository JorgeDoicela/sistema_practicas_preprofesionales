"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { Moon, Sun, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

/**
 * ThemeToggle — Compact icon button for Navbar.
 * Dropdown allows selecting: light / dark / system (auto)
 */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Placeholder to avoid layout shift during SSR
  if (!mounted) return <div className="w-8 h-8" />;

  const options: { value: "light" | "dark" | "system"; label: string; Icon: typeof Sun }[] = [
    { value: "light", label: "Claro", Icon: Sun },
    { value: "dark", label: "Oscuro", Icon: Moon },
    { value: "system", label: "Sistema", Icon: Monitor },
  ];

  const CurrentIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.08 }}
        onClick={() => setOpen((v) => !v)}
        className={`
          p-2 rounded-xl transition-all duration-200 border
          ${resolvedTheme === "dark"
            ? "bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-700"
            : "bg-white/80 border-slate-200 text-brand-blue hover:bg-slate-50"
          }
        `}
        aria-label="Cambiar tema"
        title="Cambiar tema"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={theme}
            initial={{ rotate: -30, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 30, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="block"
          >
            <CurrentIcon size={16} strokeWidth={2.5} />
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute right-0 top-full mt-2 w-36 rounded-2xl shadow-2xl border overflow-hidden z-[100]
              ${resolvedTheme === "dark"
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-100"
              }
            `}
          >
            {options.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => { setTheme(value); setOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all
                  ${theme === value
                    ? resolvedTheme === "dark"
                      ? "bg-sky-500/20 text-sky-400"
                      : "bg-brand-blue/10 text-brand-blue"
                    : resolvedTheme === "dark"
                      ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-brand-blue"
                  }
                `}
              >
                <Icon size={13} strokeWidth={2.5} />
                {label}
                {theme === value && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
