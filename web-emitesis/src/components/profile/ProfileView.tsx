"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Save,
  Shield,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usersService } from "@/services/users.service";
import type { UserProfile } from "@/types/user";
import { ROLE_LABELS, ROLES, normalizeApiRoleToAppRole, type Role } from "@/constants/roles";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-EC", { dateStyle: "long" });
  } catch {
    return iso;
  }
}

export function ProfileView() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirm, setEditConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await usersService.getProfile();
        if (!cancelled) setProfile(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t.profile.errorLoading);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const openEdit = () => {
    setEditName(profile?.fullName ?? "");
    setEditPassword("");
    setEditConfirm("");
    setSaveError(null);
    setSaveSuccess(false);
    setEditing(true);
  };

  const closeEdit = () => setEditing(false);

  const handleSave = async () => {
    if (!editName.trim()) {
      setSaveError(t.profile.nameRequired);
      return;
    }
    if (editPassword && editPassword !== editConfirm) {
      setSaveError(t.profile.passMismatch);
      return;
    }
    if (editPassword && editPassword.length < 6) {
      setSaveError(t.profile.passTooShort);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const payload: { fullName?: string; password?: string } = {};
      if (editName.trim() !== profile?.fullName) payload.fullName = editName.trim();
      if (editPassword) payload.password = editPassword;

      if (Object.keys(payload).length === 0) {
        setEditing(false);
        return;
      }

      const updated = await usersService.updateMe(payload);
      setProfile((prev) => prev ? { ...prev, ...updated } : prev);

      // Actualizar localStorage para que el sidebar refleje el nuevo nombre
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem("user", JSON.stringify({ ...parsed, fullName: updated.fullName ?? parsed.fullName }));
      }

      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); setEditing(false); }, 1800);
    } catch (e: any) {
      setSaveError(e.message || t.profile.saveError || "Error saving changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-[#003366]" />
        <p className="text-sm font-semibold">{t.profile.loadingProfile}</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 max-w-lg">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">{error || t.profile.errorLoading}</p>
          <Link href="/dashboard" className="text-xs font-semibold text-red-900 underline mt-2 inline-block">
            {t.profile.backToDashboard}
          </Link>
          {/* saveError: "Error saving changes" */}
        </div>
      </div>
    );
  }

  const roleKey = normalizeApiRoleToAppRole(String(profile.role)) as Role;
  const roleLabel = ROLE_LABELS[roleKey] ?? String(profile.role);
  const canOpenAccountSettings = roleKey !== ROLES.EMPRESA;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center gap-6"
        data-tour="profile-header"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#003366] text-white flex items-center justify-center text-2xl sm:text-3xl font-black shrink-0 shadow-xl shadow-blue-900/20">
          {profile.fullName?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div className="flex-1">
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
        <button
          onClick={openEdit}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#004488] transition-all shadow-lg shadow-blue-900/10 self-start sm:self-center"
        >
          <Pencil className="w-4 h-4" />
          {t.profile.editProfile}
        </button>
      </motion.div>

      {/* Data sections */}
      <div className="grid gap-6">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm"
          data-tour="profile-data"
        >
          <h2 className="text-xs font-black text-[#003366] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <User className="w-4 h-4" />
            {t.profile.accountData}
          </h2>
          <dl className="space-y-4 text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
              <dt className="text-slate-500 font-semibold">{t.profile.fullName}</dt>
              <dd className="font-bold text-slate-800 text-right sm:text-right">{profile.fullName}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
              <dt className="text-slate-500 font-semibold">{t.profile.institutionalEmail}</dt>
              <dd className="font-bold text-slate-800 break-all">{profile.email}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
              <dt className="text-slate-500 font-semibold">{t.profile.accountStatus}</dt>
              <dd>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg",
                  profile.isActive
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                    : "bg-red-50 text-red-800 border border-red-100",
                )}>
                  {profile.isActive ? t.common.active : t.common.inactive}
                </span>
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-slate-500 font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t.profile.memberSince}
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
          data-tour="profile-security"
        >
          <h2 className="text-xs font-black text-[#003366] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {t.profile.security}
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-800">{t.profile.twoFactor}</p>
              <p className="text-xs text-slate-500 mt-1">
                {t.profile.twoFactorDesc}
              </p>
            </div>
            <span className={cn(
              "self-start sm:self-center text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border",
              profile.isTwoFactorEnabled
                ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                : "bg-slate-50 text-slate-600 border-slate-200",
            )}>
              {profile.isTwoFactorEnabled ? t.common.active : t.common.inactive}
            </span>
          </div>
          {canOpenAccountSettings && (
            <Link
              href="/dashboard/configuracion"
              className="inline-block mt-6 text-xs font-black uppercase tracking-widest text-[#C5A059] hover:text-[#003366] underline-offset-4 hover:underline"
            >
              {t.profile.manageSettings}
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
              {t.profile.linkedCompany}
            </h2>
            <dl className="space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
                <dt className="text-slate-500 font-semibold">{t.profile.companyName}</dt>
                <dd className="font-bold text-slate-800 text-right">{profile.company.name}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
                <dt className="text-slate-500 font-semibold">{t.profile.ruc}</dt>
                <dd className="font-mono font-bold text-slate-800">{profile.company.ruc}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
                <dt className="text-slate-500 font-semibold">{t.profile.representative}</dt>
                <dd className="font-bold text-slate-800 text-right">{profile.company.representative}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-4">
                <dt className="text-slate-500 font-semibold">{t.profile.companyEmail}</dt>
                <dd className="font-bold text-slate-800 break-all">{profile.company.email}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-slate-500 font-semibold">{t.profile.address}</dt>
                <dd className="font-medium text-slate-800 leading-relaxed">{profile.company.address}</dd>
              </div>
            </dl>
          </motion.section>
        )}
      </div>

      {/* ─── Modal de edición ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEdit}
              className="fixed inset-0 bg-[#003366]/40 backdrop-blur-[2px] z-[200]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed z-[201] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[2rem] shadow-2xl p-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#003366] rounded-2xl flex items-center justify-center">
                    <Pencil className="w-5 h-5 text-[#C5A059]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#003366]">{t.profile.editProfile}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.profile.personalData}</p>
                  </div>
                </div>
                <button
                  onClick={closeEdit}
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Nombre */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="w-3 h-3" /> {t.profile.fullName}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#003366] transition-all text-sm font-medium"
                    placeholder="Tu nombre completo"
                  />
                </div>

                {/* Nueva contraseña */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Lock className="w-3 h-3" /> {t.profile.newPassword} <span className="text-slate-300">{t.profile.optional}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full p-4 pr-12 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#003366] transition-all text-sm font-medium"
                      placeholder={t.profile.minChars}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar contraseña */}
                {editPassword && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t.profile.confirmPassword}
                    </label>
                    <input
                      type={showPass ? "text" : "password"}
                      value={editConfirm}
                      onChange={(e) => setEditConfirm(e.target.value)}
                      className={cn(
                        "w-full p-4 rounded-2xl border outline-none focus:ring-2 transition-all text-sm font-medium",
                        editConfirm && editPassword !== editConfirm
                          ? "bg-rose-50 border-rose-200 focus:ring-rose-300"
                          : "bg-slate-50 border-slate-200 focus:ring-[#003366]"
                      )}
                      placeholder={t.profile.repeatPassword}
                    />
                  </div>
                )}

                {/* Error / Success */}
                {saveError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {saveError}
                  </div>
                )}
                {saveSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> {t.profile.saveSuccess}
                  </div>
                )}

                {/* Acciones */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={closeEdit}
                    className="h-12 bg-slate-100 text-[#003366] rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-sm"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || saveSuccess}
                    className="h-12 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#004488] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-60 text-sm"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saveSuccess ? (
                      <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
                    ) : (
                      <Save className="w-4 h-4 text-[#C5A059]" />
                    )}
                    {saveSuccess ? t.stats.upToDate : t.common.save}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
