"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { settingsService, SystemSetting } from "@/services/settings.service";
import { 
  Settings, 
  MapPin, 
  Mail, 
  ShieldCheck, 
  Save, 
  Loader2, 
  RefreshCcw,
  CheckCircle2,
  X,
  Plus,
  Search,
  Check,
  AlertCircle,
  MessageSquare,
  Undo,
  Sliders,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";

interface SettingMeta {
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  type: "text" | "number" | "boolean" | "tags" | "email";
  suffix?: string;
  min?: number;
  max?: number;
}

// Highly professional metadata registry mapping system keys to user-friendly titles, descriptions, and validations
const SETTINGS_METADATA: Record<string, SettingMeta> = {
  attendance_radius_meters: {
    labelEs: "Radio de Asistencia GPS",
    labelEn: "GPS Attendance Radius",
    descEs: "Radio máximo permitido (en metros) para que los estudiantes registren su entrada y salida en la sede.",
    descEn: "Maximum permitted radius (in meters) for students to log check-in/out at their location.",
    type: "number",
    suffix: "metros",
    min: 5,
    max: 5000
  },
  attendance_max_distance_km: {
    labelEs: "Distancia de Alerta por Desviación",
    labelEn: "Deviation Alert Distance",
    descEs: "Distancia máxima tolerada (en kilómetros) antes de marcar la asistencia como fuera de rango o irregular.",
    descEn: "Maximum tolerated distance (in kilometers) before marking attendance as out of range or irregular.",
    type: "number",
    suffix: "km",
    min: 0.1,
    max: 100
  },
  session_timeout_seconds: {
    labelEs: "Tiempo de Expiración de Sesión",
    labelEn: "Session Timeout Limit",
    descEs: "Periodo de inactividad de sesión (en segundos) antes de desconectar automáticamente al usuario.",
    descEn: "Session inactivity duration (in seconds) before automatically logging out the user.",
    type: "number",
    suffix: "segundos",
    min: 60,
    max: 86400
  },
  max_login_attempts: {
    labelEs: "Intentos de Inicio de Sesión",
    labelEn: "Login Attempt Limit",
    descEs: "Número máximo de intentos fallidos permitidos antes de bloquear temporalmente la cuenta.",
    descEn: "Maximum number of failed attempts allowed before temporarily locking the account.",
    type: "number",
    suffix: "intentos",
    min: 1,
    max: 20
  },
  lockout_duration_minutes: {
    labelEs: "Duración de Bloqueo de Cuenta",
    labelEn: "Account Lockout Duration",
    descEs: "Tiempo (en minutos) que la cuenta permanecerá inactiva tras superar los intentos fallidos.",
    descEn: "Duration (in minutes) that the account will remain locked after exceeding failed attempts.",
    type: "number",
    suffix: "minutos",
    min: 1,
    max: 1440
  },
  webauthn_enabled: {
    labelEs: "Autenticación Biométrica (WebAuthn)",
    labelEn: "Biometric Authentication (WebAuthn)",
    descEs: "Habilitar soporte y validaciones con huella digital o FaceID para operaciones críticas y accesos.",
    descEn: "Enable global support and validations with fingerprint or FaceID for critical actions.",
    type: "boolean"
  },
  smtp_host: {
    labelEs: "Servidor Host SMTP",
    labelEn: "SMTP Host Server",
    descEs: "Dirección del servidor SMTP utilizado para despachar correos institucionales.",
    descEn: "SMTP server address used to dispatch institutional notification emails.",
    type: "text"
  },
  smtp_port: {
    labelEs: "Puerto SMTP",
    labelEn: "SMTP Port",
    descEs: "Puerto de conexión para el servidor de correo (ej: 587 para TLS/STARTTLS, 465 para SSL).",
    descEn: "Connection port for the email server (e.g. 587 for TLS/STARTTLS, 465 for SSL).",
    type: "number",
    min: 1,
    max: 65535
  },
  smtp_sender: {
    labelEs: "Dirección Remitente de Notificaciones",
    labelEn: "Notification Sender Address",
    descEs: "Dirección de correo electrónico que figurará como remitente en las notificaciones automatizadas.",
    descEn: "Email address that will appear as the sender in automated system notifications.",
    type: "email"
  },
  document_max_size_mb: {
    labelEs: "Tamaño Máximo de Archivo",
    labelEn: "Maximum File Upload Size",
    descEs: "Límite máximo permitido (en Megabytes) para la subida de documentos PDF en la ventanilla.",
    descEn: "Maximum allowed file upload size (in Megabytes) for PDF documents in the delivery window.",
    type: "number",
    suffix: "MB",
    min: 1,
    max: 100
  },
  allowed_file_types: {
    labelEs: "Formatos de Archivo Permitidos",
    labelEn: "Allowed Document Extensions",
    descEs: "Formatos de archivo autorizados para la subida de expedientes y registros académicos.",
    descEn: "File extensions authorized for academic records and dossier uploads.",
    type: "tags"
  },
  lopdp_version_current: {
    labelEs: "Versión de Política de Datos (LOPDP)",
    labelEn: "LOPDP Data Policy Version",
    descEs: "Identificador de la política de protección de datos personales activa en el sistema.",
    descEn: "Identifier of the active personal data protection policy in the system.",
    type: "text"
  },
  chat_message_retention_days: {
    labelEs: "Retención de Mensajes del Chat",
    labelEn: "Chat Message Retention",
    descEs: "Periodo (en días) antes de que los mensajes de chat sean purgados permanentemente según normativas de privacidad.",
    descEn: "Period (in days) before chat messages are permanently purged in compliance with privacy regulations.",
    type: "number",
    suffix: "días",
    min: 1,
    max: 3650
  }
};

export default function AdminSettingsPage() {
  const { t, locale } = useLanguage();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  // States for interactive filters
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  
  // State to hold unsaved edited values (Drafts)
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  
  // State for client-side validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Notification Toast message
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Suffix/Tag new additions input values
  const [newTagInput, setNewTagInput] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await settingsService.findAll();
      setSettings(data);
      setDrafts({});
      setValidationErrors({});
    } catch (err) {
      console.error("Failed to load settings:", err);
      setMessage({ type: "error", text: "Error al cargar la configuración." });
    } finally {
      setLoading(false);
    }
  }

  // Validate the parameter input client-side before submission
  const validateField = (key: string, value: string): boolean => {
    const meta = SETTINGS_METADATA[key];
    if (!meta) return true;

    const currentLang = locale || "es";
    let errorMsg = "";

    if (meta.type === "number") {
      const num = Number(value);
      if (isNaN(num)) {
        errorMsg = currentLang === "es" ? "Debe ser un número válido" : "Must be a valid number";
      } else {
        if (meta.min !== undefined && num < meta.min) {
          errorMsg = currentLang === "es" ? `Mínimo valor es ${meta.min}` : `Minimum value is ${meta.min}`;
        }
        if (meta.max !== undefined && num > meta.max) {
          errorMsg = currentLang === "es" ? `Máximo valor es ${meta.max}` : `Maximum value is ${meta.max}`;
        }
      }
    } else if (meta.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errorMsg = currentLang === "es" ? "Formato de correo electrónico inválido" : "Invalid email address format";
      }
    } else if (meta.type === "tags") {
      if (!value.trim()) {
        errorMsg = currentLang === "es" ? "Debe definir al menos una extensión" : "Must specify at least one extension";
      }
    } else if (meta.type === "text") {
      if (!value.trim()) {
        errorMsg = currentLang === "es" ? "Este campo no puede estar vacío" : "This field cannot be empty";
      }
    }

    if (errorMsg) {
      setValidationErrors(prev => ({ ...prev, [key]: errorMsg }));
      return false;
    }

    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    return true;
  };

  async function handleSave(key: string) {
    const draftValue = drafts[key];
    if (draftValue === undefined) return;

    if (!validateField(key, draftValue)) {
      setMessage({
        type: "error",
        text: locale === "es" ? "Por favor corrige los errores antes de guardar." : "Please correct validation errors before saving."
      });
      return;
    }

    try {
      setSaving(key);
      await settingsService.update(key, draftValue);
      
      // Update local state directly so UI is synchronised
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value: draftValue } : s));
      
      // Clear drafts for this key
      setDrafts(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });

      const keyLabel = locale === "es" ? (SETTINGS_METADATA[key]?.labelEs || key) : (SETTINGS_METADATA[key]?.labelEn || key);
      setMessage({ 
        type: "success", 
        text: t.admin.settings.updateSuccess.replace("{key}", keyLabel) 
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: t.admin.settings.updateError });
    } finally {
      setSaving(null);
    }
  }

  const handleUndo = (key: string) => {
    setDrafts(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleDraftChange = (key: string, value: string) => {
    setDrafts(prev => ({ ...prev, [key]: value }));
    validateField(key, value);
  };

  // Immediate toggle handler for booleans
  const handleToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === "true" ? "false" : "true";
    try {
      setSaving(key);
      await settingsService.update(key, newValue);
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));
      
      const keyLabel = locale === "es" ? (SETTINGS_METADATA[key]?.labelEs || key) : (SETTINGS_METADATA[key]?.labelEn || key);
      setMessage({ 
        type: "success", 
        text: t.admin.settings.updateSuccess.replace("{key}", keyLabel) 
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: t.admin.settings.updateError });
    } finally {
      setSaving(null);
    }
  };

  // Categories list
  const categories = [
    { id: "ALL", title: locale === "es" ? "Todos" : "All", icon: <Sliders className="w-5 h-5" /> },
    { id: "GPS", title: t.admin.settings.sections.gps, icon: <MapPin className="w-5 h-5" /> },
    { id: "EMAIL", title: t.admin.settings.sections.email, icon: <Mail className="w-5 h-5" /> },
    { id: "AUTH", title: t.admin.settings.sections.security, icon: <ShieldCheck className="w-5 h-5" /> },
    { id: "GENERAL", title: t.admin.settings.sections.general, icon: <Settings className="w-5 h-5" /> },
    { id: "CHAT", title: locale === "es" ? "Chat y Mensajería" : "Chat and Messaging", icon: <MessageSquare className="w-5 h-5" /> },
  ];

  // Map category code to translations for subheading descriptions
  const getCategoryManagementLabel = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower === "chat") {
      return locale === "es" ? "Gestión de políticas de comunicación" : "Communication policy management";
    }
    return t.admin.settings.sections.resourceManagement.replace("{id}", lower);
  };

  // Tag manager tag remove handler
  const handleRemoveTag = (settingKey: string, currentString: string, tagToRemove: string) => {
    const tags = currentString.split(",").map(t => t.trim()).filter(Boolean);
    const updatedTags = tags.filter(t => t !== tagToRemove);
    const updatedString = updatedTags.join(",");
    handleDraftChange(settingKey, updatedString);
  };

  // Tag manager tag add handler
  const handleAddTag = (settingKey: string, currentString: string) => {
    const input = newTagInput[settingKey]?.trim().toLowerCase();
    if (!input) return;

    // Clean input of spaces, dots, commas
    const cleaned = input.replace(/[\s\.,]/g, "");
    if (!cleaned) return;

    const tags = currentString.split(",").map(t => t.trim()).filter(Boolean);
    if (tags.includes(cleaned)) {
      setNewTagInput(prev => ({ ...prev, [settingKey]: "" }));
      return;
    }

    const updatedTags = [...tags, cleaned];
    const updatedString = updatedTags.join(",");
    
    handleDraftChange(settingKey, updatedString);
    setNewTagInput(prev => ({ ...prev, [settingKey]: "" }));
  };

  // Filtered settings list
  const filteredSettings = settings.filter(setting => {
    const matchesCategory = activeCategory === "ALL" || setting.category === activeCategory;
    
    const meta = SETTINGS_METADATA[setting.key];
    const friendlyLabel = locale === "es" ? (meta?.labelEs || setting.key) : (meta?.labelEn || setting.key);
    const friendlyDesc = locale === "es" ? (meta?.descEs || setting.description) : (meta?.descEn || setting.description);

    const matchesSearch = 
      setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friendlyLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friendlyDesc.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Group settings by category to show cleanly
  const categoriesInFiltered = Array.from(new Set(filteredSettings.map(s => s.category)));

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Sleek Page Header using official Brand Colors from Tailwind v4 (@theme in globals.css) */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-blue to-blue-navy p-8 md:p-12 text-white shadow-2xl">
          <div className="absolute right-0 top-0 opacity-10 translate-x-20 -translate-y-20 scale-150">
            <Settings className="w-[400px] h-[400px] animate-[spin_80s_linear_infinite]" />
          </div>
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-brand-gold uppercase tracking-[0.4em] bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold fill-brand-gold/20" />
              {t.admin.settings.subtitle}
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none">
              {t.admin.settings.title}
            </h2>
            <p className="text-blue-pale font-medium max-w-2xl text-sm md:text-base leading-relaxed">
              {t.admin.settings.description}
            </p>
          </div>
        </section>

        {/* Global actions row: Search and Reload */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          {/* Gorgeous Search Input aligned with Brand Colors */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={locale === "es" ? "Buscar parámetro, módulo o descripción..." : "Search parameter, module or description..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-brand-gold rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-brand-blue placeholder:text-slate-400 shadow-sm focus:ring-4 focus:ring-brand-gold/15 transition-all outline-none"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button 
            onClick={loadSettings}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all text-sm font-bold text-brand-blue shrink-0"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-gold' : 'text-slate-500'}`} />
            {t.admin.settings.syncBtn}
          </button>
        </div>

        {/* Categories Tab Navigation */}
        <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  isActive 
                    ? 'text-white bg-brand-blue shadow-lg shadow-brand-blue/20' 
                    : 'text-slate-500 bg-white border border-slate-200/60 hover:bg-slate-50'
                }`}
              >
                {category.icon}
                {category.title}
                {isActive && (
                  <motion.div 
                    layoutId="activeCategoryIndicator" 
                    className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-3 h-3 bg-brand-blue rotate-45 rounded-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Alert Banner */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`p-4 md:p-5 rounded-2xl border ${
                message.type === 'success' 
                  ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800' 
                  : 'bg-rose-50/70 border-rose-100 text-rose-800'
              } text-sm font-bold flex items-start gap-3 backdrop-blur-md shadow-lg shadow-slate-100/50`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p>{message.text}</p>
              </div>
              <button 
                onClick={() => setMessage(null)}
                className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Spinner or Content Grid */}
        {loading && settings.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-slate-400 gap-4">
             <Loader2 className="w-12 h-12 animate-spin text-brand-gold" />
             <span className="text-xs font-black uppercase tracking-widest text-brand-blue/40">{t.admin.settings.loading}</span>
          </div>
        ) : filteredSettings.length === 0 ? (
          <div className="py-24 bg-white rounded-3xl border border-slate-100 shadow-sm text-center max-w-md mx-auto p-8 space-y-4">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-brand-blue">
              {locale === "es" ? "Sin resultados" : "No configurations found"}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {locale === "es" 
                ? "No pudimos encontrar parámetros que coincidan con tu búsqueda. Intenta simplificar el término de búsqueda." 
                : "We couldn't find parameters matching your query. Try using simpler search terms."}
            </p>
            <button 
              onClick={() => { setSearchTerm(""); setActiveCategory("ALL"); }}
              className="px-5 py-2.5 bg-brand-blue text-white hover:bg-brand-blue/90 transition-colors rounded-xl text-xs font-bold"
            >
              {locale === "es" ? "Restablecer filtros" : "Reset filters"}
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.filter(c => categoriesInFiltered.includes(c.id)).map(section => {
              const sectionSettings = filteredSettings.filter(s => s.category === section.id);
              if (sectionSettings.length === 0) return null;

              return (
                <motion.div 
                  key={section.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  data-tour={
                    section.id === "GPS" 
                      ? "admin-settings-gps" 
                      : section.id === "AUTH" 
                        ? "admin-settings-auth" 
                        : undefined
                  }
                  className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-100/50 overflow-hidden"
                >
                  
                  {/* Category Header */}
                  <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-brand-blue/5 border border-brand-blue/10 p-3 rounded-2xl text-brand-blue shrink-0 shadow-inner">
                        {section.icon}
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-black text-brand-blue uppercase tracking-tight">{section.title}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          {getCategoryManagementLabel(section.id)}
                        </p>
                      </div>
                    </div>
                    <span className="self-start sm:self-center px-4 py-1.5 bg-brand-gold/10 border border-brand-gold/25 text-brand-gold rounded-full text-[10px] font-black tracking-widest uppercase">
                      {sectionSettings.length} {sectionSettings.length === 1 ? (locale === "es" ? "Parámetro" : "Parameter") : (locale === "es" ? "Parámetros" : "Parameters")}
                    </span>
                  </div>

                  {/* Settings Items Rows */}
                  <div className="divide-y divide-slate-100">
                    {sectionSettings.map((setting: SystemSetting) => {
                      const meta = SETTINGS_METADATA[setting.key];
                      const friendlyLabel = locale === "es" ? (meta?.labelEs || setting.key.replace(/_/g, " ")) : (meta?.labelEn || setting.key.replace(/_/g, " "));
                      const friendlyDesc = locale === "es" ? (meta?.descEs || setting.description || t.admin.settings.noDescription) : (meta?.descEn || setting.description || t.admin.settings.noDescription);
                      const type = meta?.type || "text";
                      
                      const hasDraft = drafts[setting.key] !== undefined;
                      const activeValue: string = (hasDraft ? drafts[setting.key] : setting.value) || "";
                      const isSaving = saving === setting.key;
                      const hasValidationError = validationErrors[setting.key];

                      return (
                        <div 
                          key={setting.id} 
                          className={`p-6 md:p-8 first:pt-6 last:pb-8 grid lg:grid-cols-12 gap-6 lg:gap-8 items-start hover:bg-slate-50/50 transition-all duration-300 ${
                            hasDraft ? "bg-amber-50/15" : ""
                          }`}
                        >
                          {/* Label & Description Column */}
                          <div className="lg:col-span-5 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-md">
                                {setting.key}
                              </span>
                              {hasDraft && (
                                <span className="text-[9px] font-black text-brand-gold bg-brand-gold/15 border border-brand-gold/25 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 animate-pulse">
                                  <Sliders className="w-2.5 h-2.5" />
                                  {locale === "es" ? "Editado" : "Modified"}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-black text-brand-blue leading-snug">{friendlyLabel}</h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-lg">{friendlyDesc}</p>
                          </div>

                          {/* Interactive Input Form Control Column */}
                          <div className="lg:col-span-7 flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              
                              {/* DYNAMIC RENDER BY INPUT TYPE */}
                              {type === "boolean" ? (
                                <button
                                  onClick={() => handleToggle(setting.key, setting.value)}
                                  disabled={isSaving}
                                  className={`relative w-16 h-8 rounded-full border p-1 transition-all duration-300 flex items-center outline-none ${
                                    activeValue === "true" 
                                      ? "bg-emerald-500 border-emerald-500 justify-end" 
                                      : "bg-slate-200 border-slate-300 justify-start"
                                  }`}
                                >
                                  <motion.div 
                                    layout
                                    className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-[10px]"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  >
                                    {isSaving ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue" />
                                    ) : activeValue === "true" ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                                    ) : (
                                      <X className="w-3.5 h-3.5 text-slate-400 font-bold" />
                                    )}
                                  </motion.div>
                                </button>
                              ) : type === "tags" ? (
                                <div className="flex-1 border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-4 transition-all duration-300">
                                  {/* Chip tags lists */}
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {activeValue.split(",").map((t: string) => t.trim()).filter(Boolean).map((tag: string) => (
                                      <span 
                                        key={tag}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-brand-blue/10 text-xs font-bold text-brand-blue rounded-xl shadow-sm group hover:border-rose-200 hover:text-rose-600 transition-all duration-200"
                                      >
                                        .{tag}
                                        <button
                                          onClick={() => handleRemoveTag(setting.key, activeValue, tag)}
                                          className="text-slate-400 group-hover:text-rose-500 p-0.5 rounded-full hover:bg-rose-50 transition-colors"
                                          title={locale === "es" ? `Quitar extension .${tag}` : `Remove extension .${tag}`}
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                    {activeValue.split(",").map((t: string) => t.trim()).filter(Boolean).length === 0 && (
                                      <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {locale === "es" ? "Sin formatos permitidos" : "No formats defined"}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Chip tag add control input */}
                                  <div className="flex items-center gap-2 max-w-[200px]">
                                    <input
                                      type="text"
                                      placeholder={locale === "es" ? "Ej: pdf, docx" : "Ex: pdf, docx"}
                                      value={newTagInput[setting.key] || ""}
                                      onChange={(e) => setNewTagInput(prev => ({ ...prev, [setting.key]: e.target.value }))}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleAddTag(setting.key, activeValue);
                                        }
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-brand-blue focus:border-brand-gold outline-none"
                                    />
                                    <button
                                      onClick={() => handleAddTag(setting.key, activeValue)}
                                      className="p-2 bg-brand-blue text-white hover:bg-brand-blue/90 active:scale-95 transition-colors rounded-xl flex items-center justify-center shrink-0"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative flex-1">
                                  <input 
                                    type={type === "number" ? "number" : "text"}
                                    value={activeValue}
                                    onChange={(e) => handleDraftChange(setting.key, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && hasDraft && !hasValidationError && !isSaving) {
                                        handleSave(setting.key);
                                      }
                                    }}
                                    min={meta?.min}
                                    max={meta?.max}
                                    className={`w-full bg-slate-50 border ${
                                      hasValidationError 
                                        ? "border-rose-300 ring-rose-100 focus:border-rose-400 focus:ring-rose-400/20" 
                                        : hasDraft 
                                          ? "border-brand-gold/50 ring-brand-gold/10 focus:border-brand-gold focus:ring-brand-gold/15" 
                                          : "border-slate-100 focus:border-brand-gold focus:ring-brand-gold/15"
                                    } rounded-2xl pl-6 pr-16 py-3.5 text-sm font-bold text-brand-blue transition-all outline-none`}
                                  />
                                  {meta?.suffix && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase tracking-wider bg-white/80 border border-slate-150 px-2 py-1 rounded-lg backdrop-blur-sm pointer-events-none select-none">
                                      {meta.suffix}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Action Buttons for Drafts State (Save & Revert) */}
                              {hasDraft && type !== "boolean" && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="flex items-center gap-1.5 shrink-0"
                                >
                                  <button
                                    onClick={() => handleSave(setting.key)}
                                    disabled={isSaving || !!hasValidationError}
                                    className="p-3 bg-brand-gold hover:bg-gold-deep disabled:opacity-40 disabled:hover:bg-brand-gold text-white rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center"
                                    title={locale === "es" ? "Guardar cambios" : "Save changes"}
                                  >
                                    {isSaving ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleUndo(setting.key)}
                                    disabled={isSaving}
                                    className="p-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-500 hover:text-slate-700 rounded-2xl active:scale-95 transition-all flex items-center justify-center"
                                    title={locale === "es" ? "Revertir cambios" : "Revert changes"}
                                  >
                                    <Undo className="w-4 h-4" />
                                  </button>
                                </motion.div>
                              )}
                            </div>

                            {/* Input validation bubble errors */}
                            <AnimatePresence>
                              {hasValidationError && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="text-xs font-bold text-rose-600 flex items-center gap-1.5 pl-2"
                                >
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  {hasValidationError}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
