"use client";

import React from "react";
import { ShieldCheck, ExternalLink, X } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

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
  const { t } = useLanguage();

  return (
    <div className="absolute inset-0 z-10 flex flex-col rounded-2xl bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#003366] px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
          <span className="text-sm font-semibold text-white">{t.chatNotice.title}</span>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm text-slate-700">
        <p className="font-medium text-[#003366]">
          {t.chatNotice.intro}
        </p>

        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t.chatNotice.controller}
          </h3>
          <p>
            {t.chatNotice.controllerDesc}
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t.chatNotice.dataTreated}
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            {t.chatNotice.dataItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t.chatNotice.purpose}
          </h3>
          <p className="text-slate-600">
            {t.chatNotice.purposeDesc}
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t.chatNotice.retention}
          </h3>
          <p className="text-slate-600">
            {t.chatNotice.retentionDesc
              .replace("{days}", retentionDays.toString())
              .replace("{years}", Math.round(retentionDays / 365).toString())}
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t.chatNotice.rights}
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            {t.chatNotice.rightsItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t.chatNotice.security}
          </h3>
          <p className="text-slate-600">
            {t.chatNotice.securityDesc}
          </p>
        </section>

        <a
          href="/dashboard/configuracion"
          className="inline-flex items-center gap-1.5 text-xs text-[#003366] underline underline-offset-2 hover:text-[#C5A059] transition-colors"
        >
          {t.chatNotice.viewPrivacyModule}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100 px-5 py-3 bg-slate-50">
        <button
          onClick={onAccept}
          className="w-full rounded-xl bg-[#003366] py-2.5 text-sm font-semibold text-white hover:bg-[#004080] transition-colors active:scale-95"
        >
          {t.chatNotice.acceptBtn}
        </button>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          {t.chatNotice.footerText}
        </p>
      </div>
    </div>
  );
}
