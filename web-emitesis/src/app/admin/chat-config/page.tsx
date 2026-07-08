"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  Shield, 
  MessageSquare, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Info, 
  Plus, 
  X, 
  Users, 
  Key, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  BookOpen, 
  Briefcase, 
  Clock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { chatConfigService } from "@/services/chat-config.service";
import { API_URL } from "@/lib/api-base";
import { useLanguage } from "@/providers/LanguageProvider";

// ── Tipos ────────────────────────────────────────────────────────────────────

type Role = "ADMIN" | "COORDINADOR" | "TUTOR" | "ESTUDIANTE" | "EMPRESA";

interface ChatPermission {
  id: string;
  fromRole: Role;
  toRole: Role;
  isEnabled: boolean;
}

// ── Metadatos por rol ────────────────────────────────────────────────────────

const ROLE_META: Record<Role, { label: string; color: string; Icon: React.ElementType; desc: string }> = {
  ADMIN: {
    label: "Administrador",
    color: "text-red-700",
    Icon: ShieldCheck,
    desc: "Gestiona el sistema completo",
  },
  COORDINADOR: {
    label: "Coordinador",
    color: "text-blue-700",
    Icon: BookOpen,
    desc: "Supervisa prácticas y tutores académicos",
  },
  TUTOR: {
    label: "Tutor Académico",
    color: "text-green-700",
    Icon: GraduationCap,
    desc: "Guía académica de los estudiantes asignados",
  },

  ESTUDIANTE: {
    label: "Estudiante",
    color: "text-violet-700",
    Icon: Users,
    desc: "Realiza las prácticas preprofesionales",
  },
  EMPRESA: {
    label: "Empresa",
    color: "text-amber-700",
    Icon: Building2,
    desc: "Institución receptora de pasantes",
  },
};

/**
 * Descripciones contextuales de cada par de roles para ayudar al admin
 * a entender el impacto de habilitar el canal.
 */
const PAIR_CONTEXT: Partial<Record<string, string>> = {
  "TUTOR__COORDINADOR": "Canal de coordinación académica: tutores y coordinadores discuten asignaciones y avances.",
  "COORDINADOR__TUTOR": "Canal de coordinación académica: tutores y coordinadores discuten asignaciones y avances.",
  "ESTUDIANTE__TUTOR": "Canal principal de tutoría: el estudiante puede consultar a su tutor asignado.",
  "TUTOR__ESTUDIANTE": "Canal principal de tutoría: el estudiante puede consultar a su tutor asignado.",
  "ESTUDIANTE__COORDINADOR": "Comunicación directa del estudiante con coordinación para trámites y aclaraciones.",
  "COORDINADOR__ESTUDIANTE": "Comunicación directa del estudiante con coordinación para trámites y aclaraciones.",

  "EMPRESA__COORDINADOR": "Canal institucional: empresa y coordinación gestionan convenios y condiciones.",
  "COORDINADOR__EMPRESA": "Canal institucional: empresa y coordinación gestionan convenios y condiciones.",
  "ADMIN__COORDINADOR": "Canal interno administrativo.",
  "COORDINADOR__ADMIN": "Canal interno administrativo.",
};

function pairContextKey(a: Role, b: Role) {
  return `${a}__${b}`;
}

function pairKey(a: Role, b: Role) {
  return [a, b].sort().join("__");
}

const ALL_ROLES: Role[] = ["ADMIN", "COORDINADOR", "TUTOR", "ESTUDIANTE", "EMPRESA"];

// ── Presets del sistema ───────────────────────────────────────────────────────

const PRESETS: {
  label: string;
  desc: string;
  icon: React.ElementType;
  pairs: [Role, Role][];
}[] = [
  {
    label: "Comunicación académica",
    desc: "Tutor ↔ Coordinador + Tutor ↔ Estudiante",
    icon: GraduationCap,
    pairs: [
      ["TUTOR", "COORDINADOR"],
      ["TUTOR", "ESTUDIANTE"],
    ],
  },
  {
    label: "Circuito completo de prácticas",
    desc: "Todo el flujo académico-empresarial",
    icon: Briefcase,
    pairs: [
      ["TUTOR", "COORDINADOR"],
      ["TUTOR", "ESTUDIANTE"],

      ["COORDINADOR", "EMPRESA"],
    ],
  },
  {
    label: "Habilitar todo",
    desc: "Todos los canales abiertos",
    icon: MessageSquare,
    pairs: ALL_ROLES.flatMap((a, i) =>
      ALL_ROLES.slice(i + 1).map(b => [a, b] as [Role, Role]),
    ),
  },
  {
    label: "Deshabilitar todo",
    desc: "Cerrar todos los canales",
    icon: AlertCircle,
    pairs: [],
  },
];

// ── Página ───────────────────────────────────────────────────────────────────

export default function ChatConfigPage() {
  const { t } = useLanguage();
  const [permissions, setPermissions] = useState<ChatPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [retentionDays, setRetentionDays] = useState(730);
  const [retentionInput, setRetentionInput] = useState("730");
  const [savingRetention, setSavingRetention] = useState(false);

  // ── Metadatos por rol (Traducidos) ──────────────────────────────────────────
  const ROLE_META = useMemo<Record<Role, { label: string; color: string; Icon: React.ElementType; desc: string }>>(() => ({
    ADMIN: {
      label: t.common.roles.ADMIN,
      color: "text-red-700",
      Icon: ShieldCheck,
      desc: t.common.language === "es" ? "Gestiona el sistema completo" : "Manages the entire system",
    },
    COORDINADOR: {
      label: t.common.roles.COORDINADOR,
      color: "text-blue-700",
      Icon: BookOpen,
      desc: t.common.language === "es" ? "Supervisa prácticas y tutores académicos" : "Supervises internships and academic tutors",
    },
    TUTOR: {
      label: t.common.roles.TUTOR,
      color: "text-green-700",
      Icon: GraduationCap,
      desc: t.common.language === "es" ? "Guía académica de los estudiantes asignados" : "Academic guide for assigned students",
    },

    ESTUDIANTE: {
      label: t.common.roles.ESTUDIANTE,
      color: "text-violet-700",
      Icon: Users,
      desc: t.common.language === "es" ? "Realiza las prácticas preprofesionales" : "Performs pre-professional internships",
    },
    EMPRESA: {
      label: t.common.roles.EMPRESA,
      color: "text-amber-700",
      Icon: Building2,
      desc: t.common.language === "es" ? "Institución receptora de pasantes" : "Host institution for interns",
    },
  }), [t]);

  const PAIR_CONTEXT: Partial<Record<string, string>> = {
    "TUTOR__COORDINADOR": t.common.language === "es" ? "Canal de coordinación académica: tutores y coordinadores discuten asignaciones y avances." : "Academic coordination channel: tutors and coordinators discuss assignments and progress.",
    "COORDINADOR__TUTOR": t.common.language === "es" ? "Canal de coordinación académica: tutores y coordinadores discuten asignaciones y avances." : "Academic coordination channel: tutors and coordinators discuss assignments and progress.",
    "ESTUDIANTE__TUTOR": t.common.language === "es" ? "Canal principal de tutoría: el estudiante puede consultar a su tutor asignado." : "Main tutoring channel: the student can consult their assigned tutor.",
    "TUTOR__ESTUDIANTE": t.common.language === "es" ? "Canal principal de tutoría: el estudiante puede consultar a su tutor asignado." : "Main tutoring channel: the student can consult their assigned tutor.",
    "ESTUDIANTE__COORDINADOR": t.common.language === "es" ? "Comunicación directa del estudiante con coordinación para trámites y aclaraciones." : "Direct communication between student and coordination for procedures and clarifications.",
    "COORDINADOR__ESTUDIANTE": t.common.language === "es" ? "Comunicación directa del estudiante con coordinación para trámites y aclaraciones." : "Direct communication between student and coordination for procedures and clarifications.",

    "EMPRESA__COORDINADOR": t.common.language === "es" ? "Canal institucional: empresa y coordinación gestionan convenios y condiciones." : "Institutional channel: company and coordination manage agreements and conditions.",
    "COORDINADOR__EMPRESA": t.common.language === "es" ? "Canal institucional: empresa y coordinación gestionan convenios y condiciones." : "Institutional channel: company and coordination manage agreements and conditions.",
    "ADMIN__COORDINADOR": t.common.language === "es" ? "Canal interno administrativo." : "Internal administrative channel.",
    "COORDINADOR__ADMIN": t.common.language === "es" ? "Canal interno administrativo." : "Internal administrative channel.",
  };

  const PRESETS: {
    label: string;
    desc: string;
    icon: React.ElementType;
    pairs: [Role, Role][];
  }[] = [
    {
      label: t.chatConfig.presets.academic,
      desc: t.chatConfig.presets.academicDesc,
      icon: GraduationCap,
      pairs: [
        ["TUTOR", "COORDINADOR"],
        ["TUTOR", "ESTUDIANTE"],
      ],
    },
    {
      label: t.chatConfig.presets.full,
      desc: t.chatConfig.presets.fullDesc,
      icon: Briefcase,
      pairs: [
        ["TUTOR", "COORDINADOR"],
        ["TUTOR", "ESTUDIANTE"],

        ["COORDINADOR", "EMPRESA"],
      ],
    },
    {
      label: t.chatConfig.presets.enableAll,
      desc: t.chatConfig.presets.enableAllDesc,
      icon: MessageSquare,
      pairs: ALL_ROLES.flatMap((a, i) =>
        ALL_ROLES.slice(i + 1).map(b => [a, b] as [Role, Role]),
      ),
    },
    {
      label: t.chatConfig.presets.disableAll,
      desc: t.chatConfig.presets.disableAllDesc,
      icon: AlertCircle,
      pairs: [],
    },
  ];

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await chatConfigService.getPermissions() as unknown as ChatPermission[];
      if (Array.isArray(data)) {
        setPermissions(data);
      } else {
        setPermissions([]);
        showToast("error", "Error: La respuesta no es un listado válido.");
      }
    } catch {
      showToast("error", t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t.common.error]);

  useEffect(() => {
    fetchPermissions();
    // Cargar configuración de retención actual
    chatConfigService.getRetentionDays()
      .then(days => {
        setRetentionDays(days);
        setRetentionInput(String(days));
      })
      .catch(() => {});
  }, [fetchPermissions]);

  const handleToggle = useCallback(async (fromRole: Role, toRole: Role, current: boolean) => {
    const key = pairKey(fromRole, toRole);
    setToggling(key);
    try {
      await chatConfigService.updatePermission(fromRole, toRole, !current);
      setPermissions(prev => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.map(p => {
          const same = p.fromRole === fromRole && p.toRole === toRole;
          const rev = p.fromRole === toRole && p.toRole === fromRole;
          return same || rev ? { ...p, isEnabled: !current } : p;
        });
      });
      showToast(
        "success",
        `${t.chatConfig.title}: ${ROLE_META[fromRole].label} ↔ ${ROLE_META[toRole].label}`,
      );
    } catch {
      showToast("error", "Error al actualizar el permiso.");
    } finally {
      setToggling(null);
    }
  }, [ROLE_META, t.chatConfig.title]);

  const handleToggleBulk = useCallback(async (items: { fromRole: Role; toRole: Role; isEnabled: boolean }[]) => {
    setLoading(true);
    try {
      await chatConfigService.updatePermissionsBulk(items);
      setPermissions(prev => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.map(p => {
          const match = items.find(
            item =>
              (item.fromRole === p.fromRole && item.toRole === p.toRole) ||
              (item.fromRole === p.toRole && item.toRole === p.fromRole)
          );
          return match ? { ...p, isEnabled: match.isEnabled } : p;
        });
      });
      showToast("success", "Permisos actualizados correctamente.");
    } catch {
      showToast("error", "Error al actualizar los permisos.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Pares únicos para la tabla
  const handleSaveRetention = async () => {
    const days = parseInt(retentionInput, 10);
    if (!days || days < 30 || days > 3650) {
      showToast("error", t.chatConfig.retention.minMax);
      return;
    }
    setSavingRetention(true);
    try {
      await chatConfigService.updateRetentionDays(days);
      setRetentionDays(days);
      showToast("success", `${t.chatConfig.retention.current}: ${days} ${t.chatConfig.retention.days}.`);
    } catch {
      showToast("error", t.common.error);
    } finally {
      setSavingRetention(false);
    }
  };

  const pairs: { fromRole: Role; toRole: Role; isEnabled: boolean }[] = [];
  const seen = new Set<string>();
  const safePermissions = Array.isArray(permissions) ? permissions : [];
  for (const p of safePermissions) {
    const key = pairKey(p.fromRole, p.toRole);
    if (!seen.has(key)) {
      seen.add(key);
      pairs.push({ fromRole: p.fromRole, toRole: p.toRole, isEnabled: p.isEnabled });
    }
  }
  const enabledCount = pairs.filter(p => p.isEnabled).length;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#003366] shadow">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#003366]">{t.chatConfig.title}</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {t.chatConfig.subtitle}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Banner info */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <strong>{t.chatConfig.infoBanner.title}</strong>: {t.chatConfig.infoBanner.desc}
            </p>
            <p className="text-blue-600">
              {t.chatConfig.infoBanner.relationships}
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: t.chatConfig.stats.possible, value: pairs.length, color: "text-[#003366]", bg: "border-slate-200 bg-white" },
            { label: t.chatConfig.stats.enabled, value: enabledCount, color: "text-green-600", bg: "border-green-200 bg-green-50" },
            { label: t.chatConfig.stats.disabled, value: pairs.length - enabledCount, color: "text-slate-400", bg: "border-slate-200 bg-slate-50" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 text-center shadow-sm ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabla de permisos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6"
          data-tour="chat-permissions"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">{t.chatConfig.table.title}</h2>
            <span className="text-xs text-slate-400">
              {t.chatConfig.table.helper}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#003366]" />
            </div>
          ) : (
            <div>
              {ALL_ROLES.map(fromRole => {
                const meta = ROLE_META[fromRole];
                const rolePairs = pairs.filter(
                  p => p.fromRole === fromRole || p.toRole === fromRole,
                );
                if (rolePairs.length === 0) return null;

                return (
                  <div key={fromRole} className="border-b border-slate-100 last:border-0">
                    {/* Cabecera de grupo */}
                    <div className="flex items-center gap-3 px-6 py-3 bg-slate-50/70">
                      <meta.Icon className="h-4 w-4 text-slate-500 shrink-0" />
                      <span className={`text-xs font-black uppercase tracking-widest ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-400">{meta.desc}</span>
                    </div>

                    {rolePairs.map(pair => {
                      const otherRole = pair.fromRole === fromRole ? pair.toRole : pair.fromRole;
                      const otherMeta = ROLE_META[otherRole];
                      const toggleKey = pairKey(fromRole, otherRole);
                      const isLoading = toggling === toggleKey;
                      const contextDesc =
                        PAIR_CONTEXT[pairContextKey(fromRole, otherRole)] ??
                        PAIR_CONTEXT[pairContextKey(otherRole, fromRole)];

                      return (
                        <div
                          key={toggleKey}
                          className="flex items-center justify-between px-6 py-3 hover:bg-slate-50/50 transition-colors border-t border-slate-100/60"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0 mr-4">
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-black uppercase tracking-widest shrink-0 ${otherMeta.color}`}>
                                {otherMeta.label}
                              </span>
                              <span className="text-xs text-slate-400">↔ {meta.label}</span>
                            </div>
                            {contextDesc && (
                              <p className="text-[11px] text-slate-400 leading-snug">
                                {contextDesc}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-xs font-medium ${pair.isEnabled ? "text-green-600" : "text-slate-400"}`}>
                              {pair.isEnabled ? t.chatConfig.table.active : t.chatConfig.table.inactive}
                            </span>
                            <button
                              onClick={() => handleToggle(pair.fromRole, pair.toRole, pair.isEnabled)}
                              disabled={isLoading}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                                pair.isEnabled ? "bg-[#003366]" : "bg-slate-200"
                              }`}
                              role="switch"
                              aria-checked={pair.isEnabled}
                            >
                              {isLoading ? (
                                <Loader2 className="absolute left-1/2 -translate-x-1/2 h-3 w-3 animate-spin text-white" />
                              ) : (
                                <span
                                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                    pair.isEnabled ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Presets */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-slate-700 mb-1">{t.chatConfig.presets.title}</h2>
          <p className="text-xs text-slate-400 mb-4">
            {t.chatConfig.presets.subtitle}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESETS.map(preset => (
              <PresetButton
                key={preset.label}
                label={preset.label}
                desc={preset.desc}
                Icon={preset.icon}
                targetPairs={preset.pairs}
                currentPairs={pairs}
                onApply={handleToggle}
                onApplyBulk={handleToggleBulk}
                disableAll={preset.pairs.length === 0}
              />
            ))}
          </div>
        </motion.div>

        {/* Sección LOPDP — Retención de mensajes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mt-6 rounded-2xl border border-[#C5A059]/30 bg-amber-50 p-6 shadow-sm"
          data-tour="chat-retention"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C5A059]/20">
              <ShieldCheck className="h-5 w-5 text-[#C5A059]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">{t.chatConfig.retention.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.chatConfig.retention.law}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <p>
              {t.chatConfig.retention.desc}
            </p>

            <div className="rounded-xl border border-amber-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-sm font-medium text-slate-700">
                  {t.chatConfig.retention.current}:{" "}
                  <span className="text-[#003366] font-bold">
                    {retentionDays} {t.chatConfig.retention.days} ({(retentionDays / 365).toFixed(1)} {t.chatConfig.retention.years})
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={30}
                  max={3650}
                  value={retentionInput}
                  onChange={e => setRetentionInput(e.target.value)}
                  className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#003366]/20"
                  placeholder="730"
                />
                <span className="text-sm text-slate-500">{t.chatConfig.retention.days}</span>
                <button
                  onClick={handleSaveRetention}
                  disabled={savingRetention}
                  className="flex items-center gap-2 rounded-xl bg-[#003366] px-4 py-2 text-sm font-medium text-white hover:bg-[#004080] transition-colors disabled:opacity-50"
                >
                  {savingRetention ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {t.common.save}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {t.chatConfig.retention.minMax}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {[
                { label: t.chatConfig.retention.presets.standard, days: 730, desc: t.chatConfig.retention.presets.standardDesc },
                { label: t.chatConfig.retention.presets.short, days: 365, desc: t.chatConfig.retention.presets.shortDesc },
                { label: t.chatConfig.retention.presets.minimum, days: 90, desc: t.chatConfig.retention.presets.minimumDesc },
              ].map(preset => (
                <button
                  key={preset.days}
                  onClick={() => { setRetentionInput(String(preset.days)); }}
                  className={`rounded-xl border px-3 py-2 text-left transition-all hover:border-[#003366] ${
                    retentionDays === preset.days ? "border-[#003366] bg-blue-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-xs font-medium text-slate-700">{preset.label}</p>
                  <p className="text-[10px] text-slate-400">{preset.desc}</p>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 pt-1 border-t border-amber-200 mt-2">
              {t.chatConfig.retention.legalBase}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl px-5 py-3 shadow-xl text-sm font-medium text-white transition-all ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.text}
        </div>
      )}
    </DashboardLayout>
  );
}

// ── Botón de preset ──────────────────────────────────────────────────────────

function PresetButton({
  label,
  desc,
  Icon,
  targetPairs,
  currentPairs,
  onApply,
  onApplyBulk,
  disableAll = false,
}: {
  label: string;
  desc: string;
  Icon: React.ElementType;
  targetPairs: [Role, Role][];
  currentPairs: { fromRole: Role; toRole: Role; isEnabled: boolean }[];
  onApply: (fromRole: Role, toRole: Role, current: boolean) => Promise<void>;
  onApplyBulk: (items: { fromRole: Role; toRole: Role; isEnabled: boolean }[]) => Promise<void>;
  disableAll?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (disableAll) {
        const toDisable = currentPairs
          .filter(p => p.isEnabled)
          .map(p => ({ fromRole: p.fromRole, toRole: p.toRole, isEnabled: false }));
        if (toDisable.length > 0) {
          await onApplyBulk(toDisable);
        }
      } else {
        const toEnable: { fromRole: Role; toRole: Role; isEnabled: boolean }[] = [];
        for (const [a, b] of targetPairs) {
          const existing = currentPairs.find(
            p =>
              (p.fromRole === a && p.toRole === b) ||
              (p.fromRole === b && p.toRole === a),
          );
          if (existing && !existing.isEnabled) {
            toEnable.push({ fromRole: existing.fromRole, toRole: existing.toRole, isEnabled: true });
          }
        }
        if (toEnable.length > 0) {
          await onApplyBulk(toEnable);
        }
      }
    } catch {
      // toast manejado por callback padre
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-[#003366] hover:bg-slate-50 transition-all disabled:opacity-50"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#003366]/10">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#003366]" />
        ) : (
          <Icon className="h-4 w-4 text-[#003366]" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </button>
  );
}
