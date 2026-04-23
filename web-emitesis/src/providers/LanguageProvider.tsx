"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { es } from "@/i18n/es";
import { en } from "@/i18n/en";
import {
  type Locale,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  detectBrowserLocale,
} from "@/i18n/index";

// ── Tipos ────────────────────────────────────────────────────────
// Convertimos el diccionario a tipo con valores string (no literales)
// para que tanto 'es' como 'en' sean asignables al mismo Dict.
type StringifyValues<T> = {
  [K in keyof T]: T[K] extends object ? StringifyValues<T[K]> : string;
};
export type Dict = StringifyValues<typeof es>;

const DICTS: Record<Locale, Dict> = {
  es: es as unknown as Dict,
  en: en as unknown as Dict,
};

// ── Context ──────────────────────────────────────────────────────
interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dict;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

// ── Provider ─────────────────────────────────────────────────────
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Leer preferencia guardada o detectar del dispositivo
  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    const initial: Locale =
      saved && (saved === "es" || saved === "en")
        ? saved
        : detectBrowserLocale();

    setLocaleState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useMemo(() => DICTS[locale], [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
