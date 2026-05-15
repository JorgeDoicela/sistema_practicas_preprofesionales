// ── Locales soportados ───────────────────────────────────────────
export type Locale = "es" | "en";

export const LOCALES: Locale[] = ["es", "en"];
export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_STORAGE_KEY = "praxis-hub-locale";

export const LOCALE_LABELS: Record<Locale, { label: string; flag: string; native: string }> = {
  es: { label: "Español", flag: "🇪🇸", native: "Español" },
  en: { label: "English", flag: "🇬🇧", native: "English" },
};

// ── Detección del idioma del dispositivo ─────────────────────────
export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const lang = navigator.language || navigator.languages?.[0] || "";
  const code = lang.split("-")[0].toLowerCase();
  if (code === "en") return "en";
  return DEFAULT_LOCALE; // Español por defecto
}

// ── Tipo del diccionario (inferido de es.ts) ─────────────────────
export type TranslationDict = typeof import("./es").es;
