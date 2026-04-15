"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Building2,
  Calendar,
  Loader2,
  Mail,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { usersService } from "@/services/users.service";
import type { UserProfile } from "@/types/user";
import { ROLE_LABELS, ROLES, normalizeApiRoleToAppRole, type Role } from "@/constants/roles";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-EC", {
      dateStyle: "long",
    });
  } catch {
    return iso;
  }
}

export function ProfileView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await usersService.getProfile();
        if (!cancelled) setProfile(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar el perfil");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-[#003366]" />
        <p className="text-sm font-semibold">Cargando tu perfil…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 max-w-lg">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">{error || "No se pudo cargar el perfil"}</p>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-red-900 underline mt-2 inline-block"
          >
            Volver al tablero
          </Link>
        </div>
      </div>
    );
  }

  const roleKey = normalizeApiRoleToAppRole(String(profile.role)) as Role;
  const roleLabel = ROLE_LABELS[roleKey] ?? String(profile.role);
  const canOpenAccountSettings =
    roleKey !== ROLES.EMPRESA && roleKey !== ROLES.TUTOR_EMPRESARIAL;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center gap-6"
      >
        <div className="w-24 h-24 rounded-3xl bg-[#003366] text-white flex items-center justify-center text-3xl font-black shrink-0 shadow-xl shadow-blue-900/20">
          {profile.fullName?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight">
            {profile.fullName}
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              {profile.email}
            </span>
          </p>
          <span className="inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#C5A059]/15 text-[#8a7038] border border-[#C5A059]/30">
            {roleLabel}
          </span>
        </div>
      </motion.div>

      <div className="grid gap-6">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm"
        >
          <h2 className="text-xs font-black text-[#003366] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <User className="w-4 h-4" />
            Datos de la cuenta
          </h2>
          <dl className="space-y-4 text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
              <dt className="text-slate-500 font-semibold">Nombre completo</dt>
              <dd className="font-bold text-slate-800 text-right sm:text-right">
                {profile.fullName}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
              <dt className="text-slate-500 font-semibold">Correo institucional</dt>
              <dd className="font-bold text-slate-800 break-all">{profile.email}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
              <dt className="text-slate-500 font-semibold">Estado de la cuenta</dt>
              <dd>
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg",
                    profile.isActive
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                      : "bg-red-50 text-red-800 border border-red-100",
                  )}
                >
                  {profile.isActive ? "Activa" : "Inactiva"}
                </span>
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-slate-500 font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Miembro desde
              </dt>
              <dd className="font-bold text-slate-800">{formatDate(profile.createdAt)}</dd>
            </div>
          </dl>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm"
        >
          <h2 className="text-xs font-black text-[#003366] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Seguridad
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-800">Verificación en dos pasos (2FA)</p>
              <p className="text-xs text-slate-500 mt-1">
                Refuerza el acceso a tu cuenta con un código de aplicación autenticadora.
              </p>
            </div>
            <span
              className={cn(
                "self-start sm:self-center text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border",
                profile.isTwoFactorEnabled
                  ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                  : "bg-slate-50 text-slate-600 border-slate-200",
              )}
            >
              {profile.isTwoFactorEnabled ? "Activada" : "Desactivada"}
            </span>
          </div>
          {canOpenAccountSettings && (
            <Link
              href="/dashboard/configuracion"
              className="inline-block mt-6 text-xs font-black uppercase tracking-widest text-[#C5A059] hover:text-[#003366] underline-offset-4 hover:underline"
            >
              Gestionar en configuración
            </Link>
          )}
        </motion.section>

        {profile.company && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-xs font-black text-[#003366] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Entidad receptora vinculada
            </h2>
            <dl className="space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
                <dt className="text-slate-500 font-semibold">Razón social</dt>
                <dd className="font-bold text-slate-800 text-right">{profile.company.name}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
                <dt className="text-slate-500 font-semibold">RUC</dt>
                <dd className="font-mono font-bold text-slate-800">{profile.company.ruc}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
                <dt className="text-slate-500 font-semibold">Representante</dt>
                <dd className="font-bold text-slate-800 text-right">{profile.company.representative}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
                <dt className="text-slate-500 font-semibold">Correo de la empresa</dt>
                <dd className="font-bold text-slate-800 break-all">{profile.company.email}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-slate-500 font-semibold">Dirección</dt>
                <dd className="font-medium text-slate-800 leading-relaxed">{profile.company.address}</dd>
              </div>
            </dl>
          </motion.section>
        )}
      </div>
    </div>
  );
}
