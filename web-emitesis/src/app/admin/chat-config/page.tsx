"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  GraduationCap,
  Users,
  Building2,
  ShieldCheck,
  BookOpen,
  Briefcase,
  Clock,
  Save,
} from "lucide-react";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/api-base";

// ── Tipos ────────────────────────────────────────────────────────────────────

type Role = "ADMIN" | "COORDINADOR" | "TUTOR" | "TUTOR_EMPRESARIAL" | "ESTUDIANTE" | "EMPRESA";

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
    color: "bg-red-100 text-red-700 border-red-200",
    Icon: ShieldCheck,
    desc: "Gestiona el sistema completo",
  },
  COORDINADOR: {
    label: "Coordinador",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    Icon: BookOpen,
    desc: "Supervisa prácticas y tutores académicos",
  },
  TUTOR: {
    label: "Tutor Académico",
    color: "bg-green-100 text-green-700 border-green-200",
    Icon: GraduationCap,
    desc: "Guía académica de los estudiantes asignados",
  },
  TUTOR_EMPRESARIAL: {
    label: "Tutor Empresarial",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    Icon: Briefcase,
    desc: "Supervisa al practicante en la empresa",
  },
  ESTUDIANTE: {
    label: "Estudiante",
    color: "bg-violet-100 text-violet-700 border-violet-200",
    Icon: Users,
    desc: "Realiza las prácticas preprofesionales",
  },
  EMPRESA: {
    label: "Empresa",
    color: "bg-amber-100 text-amber-700 border-amber-200",
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
  "TUTOR_EMPRESARIAL__COORDINADOR": "Coordinación institucional: la empresa puede reportar novedades a coordinación.",
  "COORDINADOR__TUTOR_EMPRESARIAL": "Coordinación institucional: la empresa puede reportar novedades a coordinación.",
  "TUTOR_EMPRESARIAL__TUTOR": "Canal entre tutores: alineación académico-empresarial sobre el desempeño del practicante.",
  "TUTOR__TUTOR_EMPRESARIAL": "Canal entre tutores: alineación académico-empresarial sobre el desempeño del practicante.",
  "ESTUDIANTE__TUTOR_EMPRESARIAL": "Comunicación del estudiante con su supervisor empresarial.",
  "TUTOR_EMPRESARIAL__ESTUDIANTE": "Comunicación del estudiante con su supervisor empresarial.",
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

const ALL_ROLES: Role[] = ["ADMIN", "COORDINADOR", "TUTOR", "TUTOR_EMPRESARIAL", "ESTUDIANTE", "EMPRESA"];

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
      ["TUTOR_EMPRESARIAL", "TUTOR"],
      ["TUTOR_EMPRESARIAL", "ESTUDIANTE"],
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
  const [permissions, setPermissions] = useState<ChatPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [retentionDays, setRetentionDays] = useState(730);
  const [retentionInput, setRetentionInput] = useState("730");
  const [savingRetention, setSavingRetention] = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const getToken = () => localStorage.getItem("token") ?? "";

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chat/permissions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data: ChatPermission[] = await res.json();
      setPermissions(data);
    } catch {
      showToast("error", "Error al cargar los permisos de chat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
    // Cargar configuración de retención actual
    fetch(`${API_URL}/settings/chat_message_retention_days`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.value) {
          const days = parseInt(data.value, 10) || 730;
          setRetentionDays(days);
          setRetentionInput(String(days));
        }
      })
      .catch(() => {});
  }, [fetchPermissions]);

  const handleToggle = useCallback(async (fromRole: Role, toRole: Role, current: boolean) => {
    const key = pairKey(fromRole, toRole);
    setToggling(key);
    try {
      const res = await fetch(`${API_URL}/chat/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ fromRole, toRole, isEnabled: !current }),
      });
      if (!res.ok) throw new Error();
      setPermissions(prev =>
        prev.map(p => {
          const same = p.fromRole === fromRole && p.toRole === toRole;
          const rev = p.fromRole === toRole && p.toRole === fromRole;
          return same || rev ? { ...p, isEnabled: !current } : p;
        }),
      );
      showToast(
        "success",
        `Canal ${!current ? "habilitado" : "deshabilitado"}: ${ROLE_META[fromRole].label} ↔ ${ROLE_META[toRole].label}`,
      );
    } catch {
      showToast("error", "Error al actualizar el permiso.");
    } finally {
      setToggling(null);
    }
  }, []);

  // Pares únicos para la tabla
  const handleSaveRetention = async () => {
    const days = parseInt(retentionInput, 10);
    if (!days || days < 30 || days > 3650) {
      showToast("error", "El período debe estar entre 30 y 3650 días.");
      return;
    }
    setSavingRetention(true);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ key: "chat_message_retention_days", value: String(days) }),
      });
      if (!res.ok) throw new Error();
      setRetentionDays(days);
      showToast("success", `Período de retención actualizado a ${days} días.`);
    } catch {
      showToast("error", "Error al guardar la configuración de retención.");
    } finally {
      setSavingRetention(false);
    }
  };

  const pairs: { fromRole: Role; toRole: Role; isEnabled: boolean }[] = [];
  const seen = new Set<string>();
  for (const p of permissions) {
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
              <h1 className="text-2xl font-bold text-[#003366]">Control de Chat Institucional</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Define qué roles pueden comunicarse en tiempo real dentro del sistema de prácticas preprofesionales.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Banner info */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              Los canales son <strong>bidireccionales y simétricos</strong>: habilitar
              Tutor Académico ↔ Estudiante permite que ambos puedan iniciar conversaciones.
              Los cambios aplican <strong>de inmediato</strong>; si un canal se deshabilita,
              los mensajes en curso quedan en el historial pero no se pueden enviar nuevos.
            </p>
            <p className="text-blue-600">
              Los contactos de cada usuario se filtran automáticamente según sus relaciones
              de práctica (el estudiante solo verá a su tutor asignado, no a todos los tutores).
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Canales posibles", value: pairs.length, color: "text-[#003366]", bg: "border-slate-200 bg-white" },
            { label: "Habilitados", value: enabledCount, color: "text-green-600", bg: "border-green-200 bg-green-50" },
            { label: "Deshabilitados", value: pairs.length - enabledCount, color: "text-slate-400", bg: "border-slate-200 bg-slate-50" },
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
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Canales por rol</h2>
            <span className="text-xs text-slate-400">
              Cada fila = canal bidireccional A ↔ B
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
                      <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium ${meta.color}`}>
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
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium shrink-0 ${otherMeta.color}`}>
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
                              {pair.isEnabled ? "Activo" : "Inactivo"}
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
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Configuraciones rápidas</h2>
          <p className="text-xs text-slate-400 mb-4">
            Aplica conjuntos de canales predefinidos según el flujo académico del sistema.
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
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C5A059]/20">
              <ShieldCheck className="h-5 w-5 text-[#C5A059]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Política de retención LOPDP</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Art. 16 Ley Orgánica de Protección de Datos Personales — Ecuador
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <p>
              Los mensajes de chat son <strong>datos personales</strong> y deben conservarse
              únicamente durante el tiempo necesario para el fin declarado (seguimiento de prácticas
              preprofesionales). Al superar el período configurado, los mensajes se eliminan
              automáticamente cada noche a las 03:00 h.
            </p>

            <div className="rounded-xl border border-amber-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-sm font-medium text-slate-700">
                  Período de retención actual:{" "}
                  <span className="text-[#003366] font-bold">
                    {retentionDays} días ({(retentionDays / 365).toFixed(1)} años)
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
                <span className="text-sm text-slate-500">días</span>
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
                  Guardar
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Mínimo: 30 días · Máximo: 3650 días (10 años) · Recomendado: 730 días (2 años)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {[
                { label: "Académico estándar", days: 730, desc: "2 años — recomendado para prácticas" },
                { label: "Operativo corto", days: 365, desc: "1 año — ciclo académico único" },
                { label: "Mínimo legal", days: 90, desc: "90 días — solo seguimiento activo" },
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
              <strong>Base legal:</strong> Art. 6 (principio de limitación del plazo de conservación)
              y Art. 16 LOPDP Ecuador. Los usuarios pueden solicitar la eliminación anticipada
              mediante una solicitud ARCO-Cancelación desde el módulo de Privacidad.
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
  disableAll = false,
}: {
  label: string;
  desc: string;
  Icon: React.ElementType;
  targetPairs: [Role, Role][];
  currentPairs: { fromRole: Role; toRole: Role; isEnabled: boolean }[];
  onApply: (fromRole: Role, toRole: Role, current: boolean) => Promise<void>;
  disableAll?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    if (disableAll) {
      // Deshabilitar todos
      for (const p of currentPairs) {
        if (p.isEnabled) await onApply(p.fromRole, p.toRole, true);
      }
    } else {
      // Habilitar los pares del preset que estén desactivados
      for (const [a, b] of targetPairs) {
        const existing = currentPairs.find(
          p =>
            (p.fromRole === a && p.toRole === b) ||
            (p.fromRole === b && p.toRole === a),
        );
        if (existing && !existing.isEnabled) {
          await onApply(existing.fromRole, existing.toRole, false);
        }
      }
    }
    setLoading(false);
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
