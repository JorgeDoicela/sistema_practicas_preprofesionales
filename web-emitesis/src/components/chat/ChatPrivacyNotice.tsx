"use client";

import React from "react";
import { ShieldCheck, ExternalLink, X } from "lucide-react";

interface Props {
  retentionDays?: number;
  onAccept: () => void;
  onClose: () => void;
}

/**
 * RF-LOPDP Art. 13 — Transparencia en el tratamiento de datos.
 *
 * Aviso informativo que se muestra la primera vez que el usuario abre el chat,
 * explicando cómo se tratan sus mensajes conforme a la Ley Orgánica de
 * Protección de Datos Personales (LOPDP) de Ecuador.
 */
export default function ChatPrivacyNotice({ retentionDays = 730, onAccept, onClose }: Props) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col rounded-2xl bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#003366] px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
          <span className="text-sm font-semibold text-white">Aviso de Privacidad</span>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm text-slate-700">
        <p className="font-medium text-[#003366]">
          Antes de usar el chat, te informamos cómo tratamos tus mensajes.
        </p>

        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Responsable del tratamiento
          </h3>
          <p>
            Instituto Superior Tecnológico "Mayor Pedro Traversari" (ISTPET), conforme a la
            <strong> Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP)</strong>.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Datos que se tratan
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>Contenido de tus mensajes</li>
            <li>Fecha y hora de envío</li>
            <li>Confirmación de lectura</li>
            <li>Identificador de la sala de conversación</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Finalidad y base legal (Art. 7 LOPDP)
          </h3>
          <p className="text-slate-600">
            Facilitar la comunicación institucional en el seguimiento de prácticas
            preprofesionales. Base legal: <em>interés legítimo institucional</em> y
            consentimiento previo (política de privacidad ya aceptada).
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Retención de datos (Art. 16 LOPDP)
          </h3>
          <p className="text-slate-600">
            Los mensajes se conservan durante{" "}
            <strong>{retentionDays} días ({Math.round(retentionDays / 365)} año
            {retentionDays / 365 !== 1 ? "s" : ""})</strong> y se eliminan automáticamente
            al finalizar ese período.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tus derechos (Arts. 18–26 LOPDP)
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>
              <strong>Acceso y portabilidad:</strong> descarga tu historial de chat desde
              Configuración → Mis Datos (ARCO).
            </li>
            <li>
              <strong>Supresión:</strong> puedes eliminar tus propios mensajes dentro de
              las <strong>24 horas</strong> siguientes al envío.
            </li>
            <li>
              <strong>Cancelación total:</strong> presenta una solicitud ARCO-Cancelación
              en el módulo de Privacidad; tus mensajes serán anonimizados.
            </li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Seguridad (Art. 37 LOPDP)
          </h3>
          <p className="text-slate-600">
            Las conversaciones están protegidas con autenticación JWT y solo son
            accesibles por los participantes autorizados según los permisos institucionales.
          </p>
        </section>

        <a
          href="/dashboard/configuracion"
          className="inline-flex items-center gap-1.5 text-xs text-[#003366] underline underline-offset-2 hover:text-[#C5A059] transition-colors"
        >
          Ver módulo de Privacidad y derechos ARCO
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100 px-5 py-3 bg-slate-50">
        <button
          onClick={onAccept}
          className="w-full rounded-xl bg-[#003366] py-2.5 text-sm font-semibold text-white hover:bg-[#004080] transition-colors active:scale-95"
        >
          Entendido — Continuar al chat
        </button>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          Al continuar confirmas que has leído este aviso (Art. 13 LOPDP Ecuador).
        </p>
      </div>
    </div>
  );
}
