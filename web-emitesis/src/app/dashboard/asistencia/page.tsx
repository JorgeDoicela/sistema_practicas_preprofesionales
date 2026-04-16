"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  MapPin, Clock, ArrowRightCircle, ArrowLeftCircle, CheckCircle2,
  AlertCircle, Loader2, Calendar, History, Camera, Fingerprint,
  ShieldCheck, ShieldX, Image as ImageIcon, Plus, X, Info, ChevronDown, ChevronUp,
  RefreshCw, SwitchCamera, Wifi, WifiOff,
} from "lucide-react";
import NextImage from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { attendancesService } from "@/services/attendances.service";
import { internshipsService } from "@/services/internships.service";
import { ROLES } from "@/constants/roles";
import {
  clearAttendanceGeoCache,
  getAttendanceCoordinates,
  geoErrorMessage,
  getAccuracyLevel,
  prefetchAttendanceCoordinates,
} from "@/lib/geolocation-attendance";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useCamera } from "@/hooks/useCamera";
import { aiService } from "@/services/ai.service";
import { Sparkles } from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────
type AttendanceAction = "IN" | "OUT";
type ModalStep = "photo" | "biometric" | "submitting" | "done" | "error";

interface AllowedLocation {
  label: string;
  lat: number;
  lng: number;
  radiusM?: number;
}

interface ActivityPhotoItem {
  id: string;
  photoUrl: string;
  caption?: string;
  createdAt: string;
}

// ── Componente Principal ───────────────────────────────────────────────────
export default function AsistenciaPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [internship, setInternship] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [filters, setFilters] = useState({ startDate: "", endDate: "" });
  const [pageError, setPageError] = useState<string | null>(null);
  /** Coordinador / tutor: la API de prácticas por estudiante solo aplica al rol ESTUDIANTE (y ADMIN). */
  const [viewerHint, setViewerHint] = useState<string | null>(null);

  // Modal de check-in/out
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<AttendanceAction>("IN");
  const [modalStep, setModalStep] = useState<ModalStep>("photo");
  const [modalError, setModalError] = useState<string | null>(null);
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState<Blob | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);

  // RF-17: Fotos de actividades
  const [activityPhotos, setActivityPhotos] = useState<ActivityPhotoItem[]>([]);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityCaption, setActivityCaption] = useState("");
  const [activityBlobTemp, setActivityBlobTemp] = useState<Blob | null>(null);
  const [activityPreviewTemp, setActivityPreviewTemp] = useState<string | null>(null);
  const [uploadingActivity, setUploadingActivity] = useState(false);
  const [suggestingCaption, setSuggestingCaption] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  /** Biometría: soporte del dispositivo y si ya hay credencial guardada */
  const [biometricPlatformOk, setBiometricPlatformOk] = useState<boolean | null>(null);
  const [hasSavedCredential, setHasSavedCredential] = useState<boolean | null>(null);
  /** GPS durante el envío (mensaje informativo) */
  const [gpsStatusText, setGpsStatusText] = useState<string>("");
  const [lastGpsAccuracy, setLastGpsAccuracy] = useState<number | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");

  const videoRef = useRef<HTMLVideoElement>(null);
  const activityVideoRef = useRef<HTMLVideoElement>(null);

  const webAuthn = useWebAuthn();
  const camera = useCamera();
  const activityCamera = useCamera();

  // Reloj
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Carga inicial
  const loadData = useCallback(async (f?: typeof filters) => {
    try {
      setLoading(true);
      setViewerHint(null);
      setPageError(null);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const role = String(user.role ?? "");

      const canLoadStudentInternships =
        role === ROLES.ESTUDIANTE ||
        role === "ESTUDIANTE" ||
        role === ROLES.ADMIN;

      if (!canLoadStudentInternships) {
        setInternship(null);
        setStatus(null);
        setHistory([]);
        setSummary(null);
        setActivityPhotos([]);
        setViewerHint(
          "El check-in con foto, huella y GPS lo realiza el estudiante desde su cuenta. Como coordinador o tutor académico, revise el seguimiento desde Documentos o el panel de tutor.",
        );
        return;
      }

      const internships = await internshipsService.findByStudent(user.id);
      const active = internships.find(
        (i: Record<string, unknown>) => i.status === "Activo" || i.status === "En Proceso"
      );
      if (active) {
        setInternship(active);
        const [todayStatus, attendanceHistory, attendanceSummary] = await Promise.all([
          attendancesService.getTodayStatus(),
          attendancesService.findByInternship(active.id as string, f?.startDate, f?.endDate),
          attendancesService.getSummary(active.id as string),
        ]);
        setStatus(todayStatus as Record<string, unknown> | null);
        setHistory(attendanceHistory as Record<string, unknown>[]);
        setSummary(attendanceSummary);

        // Si hay registro hoy, cargar fotos de actividades
        if (todayStatus) {
          const photos = await attendancesService.getActivityPhotos(
            (todayStatus as Record<string, unknown>).id as string
          );
          setActivityPhotos(photos as ActivityPhotoItem[]);
        }
      }
    } catch (err) {
      console.error(err);
      setPageError("No se pudo cargar la información de asistencia");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Verificar disponibilidad de IA al montar
  useEffect(() => {
    aiService.isAvailable().then(setAiAvailable).catch(() => setAiAvailable(false));
  }, []);

  // ── Abrir modal de check-in/out ─────────────────────────────────────────
  const openAttendanceModal = (action: AttendanceAction) => {
    setModalAction(action);
    setModalStep("photo");
    setModalError(null);
    setCapturedPhotoBlob(null);
    setCapturedPhotoUrl(null);
    setBiometricPlatformOk(null);
    setHasSavedCredential(null);
    setGpsStatusText("");
    setLastGpsAccuracy(null);
    setCameraFacing("user");
    camera.reset();
    webAuthn.reset();
    setModalOpen(true);
    prefetchAttendanceCoordinates();
  };

  // Cámara: esperar al siguiente frame para que el <video> exista en el DOM
  useEffect(() => {
    if (!modalOpen || modalStep !== "photo") return;
    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        const el = videoRef.current;
        if (el) void camera.openCamera(el, { facingMode: cameraFacing });
      });
    });
    return () => {
      cancelAnimationFrame(outerRaf);
      if (innerRaf) cancelAnimationFrame(innerRaf);
    };
    // `camera` cambia identidad cada render; incluirlo reabriría la cámara en bucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, modalStep, cameraFacing]);

  // Paso biométrico: comprobar soporte+credencial y luego auto-disparar verificación
  useEffect(() => {
    if (!modalOpen || modalStep !== "biometric") return;
    let cancelled = false;
    void (async () => {
      const supported = await webAuthn.checkSupport();
      if (cancelled) return;
      const registered = await webAuthn.checkCredentialStatus();
      if (cancelled) return;
      setBiometricPlatformOk(supported);
      setHasSavedCredential(registered);
      if (!supported) {
        setModalError(
          "Tu dispositivo o navegador no admite verificación biométrica segura. Usa Chrome/Edge actualizado con huella o Face ID habilitado.",
        );
        return;
      }
      setModalError(null);
      // Auto-disparar la verificación biométrica (no esperar que el usuario pulse)
      await handleBiometricAction(registered);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, modalStep]);

  // ── Paso 1: Capturar foto ────────────────────────────────────────────────
  const handleCapturePhoto = async () => {
    if (!videoRef.current) return;
    const blob = await camera.captureAsync();
    if (blob) {
      setCapturedPhotoBlob(blob);
      setCapturedPhotoUrl(camera.previewUrl);
      setModalStep("biometric");
      webAuthn.reset();
    } else {
      setModalError("No se pudo capturar la foto. Intenta de nuevo.");
    }
  };

  // ── Paso 2: Verificar huella (llamado automáticamente + manualmente en reintentos)
  const handleBiometricAction = useCallback(async (hasCredential: boolean) => {
    setModalError(null);
    const ok = hasCredential
      ? await webAuthn.authenticate()
      : await webAuthn.registerBiometric();
    if (!ok) {
      setModalError(webAuthn.error || "Verificación biométrica fallida");
      return;
    }
    await handleSubmitAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webAuthn]);

  /** Wrapper para el botón de reintento manual */
  const handleBiometricRetry = async () => {
    if (biometricPlatformOk === false) return;
    const hasCredential = hasSavedCredential ?? await webAuthn.checkCredentialStatus();
    await handleBiometricAction(hasCredential);
  };

  // ── Paso 3: Enviar check-in/out ──────────────────────────────────────────
  const handleSubmitAttendance = async () => {
    setModalStep("submitting");
    setModalError(null);
    setGpsStatusText("Obteniendo ubicación…");

    if (!navigator.geolocation) {
      setModalError("Tu navegador no soporta geolocalización");
      setModalStep("error");
      return;
    }

    try {
      const pos = await getAttendanceCoordinates();
      const coords = { lat: pos.lat, lng: pos.lng };
      setLastGpsAccuracy(pos.accuracyM);
      if (pos.accuracyM != null) {
        setGpsStatusText(
          pos.accuracyM > 80
            ? `Precisión aproximada ±${Math.round(pos.accuracyM)} m. Si falla el rango, espera mejor señal y reintenta.`
            : `Ubicación lista (±${Math.round(pos.accuracyM)} m).`,
        );
      } else {
        setGpsStatusText("Ubicación obtenida.");
      }

      let photoUrl: string | undefined;
      if (capturedPhotoBlob) {
        const uploaded = await attendancesService.uploadPhoto(
          capturedPhotoBlob,
          `${modalAction === "IN" ? "entrada" : "salida"}-${Date.now()}.jpg`
        );
        photoUrl = uploaded.url;
      }

      if (modalAction === "IN") {
        await attendancesService.checkIn({ ...coords, checkInPhotoUrl: photoUrl });
      } else {
        await attendancesService.checkOut({ ...coords, checkOutPhotoUrl: photoUrl });
      }

      setModalStep("done");
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      setModalError(geoErrorMessage(err));
      setModalStep("error");
    }
  };

  const closeModal = () => {
    camera.stopCamera();
    activityCamera.stopCamera();
    // No limpiar cache de GPS en close normal: si el usuario abre check-out
    // justo después del check-in ya tendrá coordenadas cacheadas.
    // Solo limpiar si hubo error (para forzar nueva lectura al reintentar).
    if (modalStep === "error") clearAttendanceGeoCache();
    setModalOpen(false);
    setModalStep("photo");
    setModalError(null);
    setGpsStatusText("");
    setBiometricPlatformOk(null);
    setHasSavedCredential(null);
  };

  // ── RF-17: Subir foto de actividad ───────────────────────────────────────
  const openActivityModal = () => {
    activityCamera.reset();
    setActivityCaption("");
    setActivityBlobTemp(null);
    setActivityPreviewTemp(null);
    setActivityModalOpen(true);
  };

  useEffect(() => {
    if (activityModalOpen && !activityBlobTemp && activityVideoRef.current) {
      activityCamera.openCamera(activityVideoRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityModalOpen, activityBlobTemp]);

  const handleCaptureActivity = async () => {
    if (!activityVideoRef.current) return;
    const blob = await activityCamera.captureAsync();
    if (blob) {
      setActivityBlobTemp(blob);
      setActivityPreviewTemp(activityCamera.previewUrl);
    }
  };

  /** RF-18: Solicitar al agente IA que analice la foto y sugiera una descripción */
  const handleSuggestCaption = async () => {
    if (!activityBlobTemp) return;
    setSuggestingCaption(true);
    try {
      const suggestion = await aiService.suggestDescription(activityBlobTemp);
      setActivityCaption(suggestion);
    } catch (err) {
      console.error("Error al sugerir descripción:", err);
    } finally {
      setSuggestingCaption(false);
    }
  };

  const handleUploadActivity = async () => {
    if (!activityBlobTemp || !status) return;
    setUploadingActivity(true);
    try {
      await attendancesService.uploadActivityPhoto(
        (status as Record<string, unknown>).id as string,
        activityBlobTemp,
        activityCaption || undefined
      );
      setActivityModalOpen(false);
      activityCamera.reset();
      setActivityBlobTemp(null);
      // Recargar fotos
      const photos = await attendancesService.getActivityPhotos(
        (status as Record<string, unknown>).id as string
      );
      setActivityPhotos(photos as ActivityPhotoItem[]);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setUploadingActivity(false);
    }
  };

  // ── Renderizado ──────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-10 pb-20">

        {/* ── Header: Reloj + GPS ─────────────────────────────────────── */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[#003366] rounded-3xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Clock className="w-10 h-10 text-[#C5A059] animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1 block">Registro de Asistencia</span>
              <h2 className="text-4xl font-black text-[#003366] tracking-tighter">
                {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                <span className="text-slate-300 text-2xl ml-2 font-bold">
                  {currentTime.toLocaleTimeString([], { second: "2-digit" })}
                </span>
              </h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                {currentTime.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          </div>

          {/* Requisitos + sedes */}
          <div className="flex flex-col items-end gap-2">
            {/* Sedes permitidas */}
            {internship && (() => {
              const locs: AllowedLocation[] = Array.isArray((internship as any).allowedLocations) && (internship as any).allowedLocations.length > 0
                ? (internship as any).allowedLocations
                : (internship as any).lat && (internship as any).lng
                  ? [{ label: "Sede principal", lat: (internship as any).lat, lng: (internship as any).lng, radiusM: 200 }]
                  : [];
              if (locs.length === 0) return (
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sin sedes configuradas</span>
                </div>
              );
              return (
                <div className="flex flex-col gap-1 items-end">
                  {locs.map((loc, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{loc.label} · {loc.radiusM ?? 200}m</span>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl">
              <Fingerprint className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Biometría</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl">
              <Camera className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Foto obligatoria</span>
            </div>
          </div>
        </section>

        {/* ── KPIs ────────────────────────────────────────────────────── */}
        {summary && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Clock, label: "Horas", value: `${summary.totalHours}h / ${summary.requiredHours}h`, color: "blue" },
              { icon: CheckCircle2, label: "Progreso", value: `${summary.progressPercentage}%`, color: "emerald" },
              { icon: Calendar, label: "Registros", value: String(summary.totalRecords), color: "amber" },
              { icon: AlertCircle, label: "Pendientes", value: `${summary.remainingHours}h`, color: "rose" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-lg flex items-center gap-4">
                <div className={`w-11 h-11 bg-${color}-50 rounded-2xl flex items-center justify-center text-${color}-600`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className="text-lg font-black text-[#003366]">{value}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verificando estado...</p>
          </div>
        ) : !internship ? (
          viewerHint ? (
            <div className="bg-slate-50 p-12 rounded-[2.5rem] text-center border border-slate-200">
              <Info className="w-16 h-16 text-[#003366] mx-auto mb-6" />
              <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight">Vista de estudiante</h3>
              <p className="text-slate-600 mt-3 font-medium max-w-lg mx-auto leading-relaxed">{viewerHint}</p>
            </div>
          ) : (
            <div className="bg-amber-50 p-12 rounded-[2.5rem] text-center border border-amber-100">
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
              <h3 className="text-xl font-black text-amber-900 uppercase">Sin Asignación Activa</h3>
              <p className="text-amber-700 mt-2 font-medium">No puedes registrar asistencia sin una práctica en proceso.</p>
            </div>
          )
        ) : (
          <div className="space-y-10">
            {/* ── Botones de Control ───────────────────────────────────── */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Check-in */}
              <button
                onClick={() => openAttendanceModal("IN")}
                disabled={!!status}
                className={cn(
                  "group relative flex items-center justify-between p-8 rounded-[2rem] border-2 transition-all overflow-hidden",
                  status
                    ? "bg-slate-50 border-slate-100 cursor-not-allowed"
                    : "bg-white border-emerald-100 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-900/10 active:scale-[0.98]"
                )}
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                    status ? "bg-emerald-100 text-emerald-600" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white"
                  )}>
                    {status ? <CheckCircle2 className="w-7 h-7" /> : <ArrowRightCircle className="w-7 h-7" />}
                  </div>
                  <div className="text-left">
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", status ? "text-emerald-600" : "text-slate-400")}>
                      REGISTRAR ENTRADA
                    </p>
                    <p className="text-xl font-black text-[#003366]">
                      {status
                        ? new Date((status as Record<string, unknown>).checkIn as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Marcar Ingreso"}
                    </p>
                    {!status && (
                      <div className="flex items-center gap-2 mt-2">
                        <StepBadge icon={Camera} label="Foto" />
                        <StepBadge icon={Fingerprint} label="Huella" />
                        <StepBadge icon={MapPin} label="GPS" />
                      </div>
                    )}
                  </div>
                </div>
                {!!(status as Record<string, unknown> | null)?.checkInPhoto && (
                  <NextImage
                    src={(status as Record<string, unknown>).checkInPhoto as string}
                    width={56}
                    height={56}
                    unoptimized
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-200"
                    alt="Foto de entrada"
                  />
                )}
              </button>

              {/* Check-out */}
              <button
                onClick={() => openAttendanceModal("OUT")}
                disabled={!status || !!(status as Record<string, unknown>)?.checkOut}
                className={cn(
                  "group relative flex items-center justify-between p-8 rounded-[2rem] border-2 transition-all overflow-hidden",
                  (!status || !!(status as Record<string, unknown>)?.checkOut)
                    ? "bg-slate-50 border-slate-100 cursor-not-allowed"
                    : "bg-white border-rose-100 hover:border-rose-500 hover:shadow-xl hover:shadow-rose-900/10 active:scale-[0.98]"
                )}
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                    (status as Record<string, unknown> | null)?.checkOut ? "bg-rose-100 text-rose-600" : "bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white"
                  )}>
                    {(status as Record<string, unknown> | null)?.checkOut ? <CheckCircle2 className="w-7 h-7" /> : <ArrowLeftCircle className="w-7 h-7" />}
                  </div>
                  <div className="text-left">
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", (status as Record<string, unknown> | null)?.checkOut ? "text-rose-600" : "text-slate-400")}>
                      REGISTRAR SALIDA
                    </p>
                    <p className="text-xl font-black text-[#003366]">
                      {(status as Record<string, unknown> | null)?.checkOut
                        ? new Date((status as Record<string, unknown>).checkOut as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Marcar Egreso"}
                    </p>
                    {status && !(status as Record<string, unknown>)?.checkOut && (
                      <div className="flex items-center gap-2 mt-2">
                        <StepBadge icon={Camera} label="Foto" />
                        <StepBadge icon={Fingerprint} label="Huella" />
                        <StepBadge icon={MapPin} label="GPS" />
                      </div>
                    )}
                  </div>
                </div>
                {!!(status as Record<string, unknown> | null)?.checkOutPhoto && (
                  <NextImage
                    src={(status as Record<string, unknown>).checkOutPhoto as string}
                    width={56}
                    height={56}
                    unoptimized
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-200"
                    alt="Foto de salida"
                  />
                )}
              </button>
            </div>

            {pageError && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-wider">{pageError}</p>
              </div>
            )}

            {/* ── RF-17: Fotos de Actividades ──────────────────────────── */}
            {status && (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                      <ImageIcon className="w-5 h-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#003366] uppercase tracking-[0.2em]">Fotos de Actividades</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">RF-17 · {activityPhotos.length} foto(s) hoy</p>
                    </div>
                  </div>
                  <button
                    onClick={openActivityModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#004488] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Foto
                  </button>
                </div>

                <div className="p-8">
                  {activityPhotos.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <ImageIcon className="w-12 h-12 text-slate-200 mx-auto" aria-hidden />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sin fotos de actividades hoy</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {activityPhotos.map((photo) => (
                        <div key={photo.id} className="group relative rounded-2xl overflow-hidden border border-slate-100 aspect-square bg-slate-50">
                          <NextImage
                            src={photo.photoUrl}
                            alt={photo.caption || "Foto de actividad"}
                            width={400}
                            height={400}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                          {photo.caption && (
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                              <p className="text-white text-[9px] font-bold truncate">{photo.caption}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Historial ────────────────────────────────────────────── */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-slate-100 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#003366]">
                    <History className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[#003366] uppercase tracking-[0.2em]">Historial de Asistencia</h3>
                </div>

                <form
                  onSubmit={(e) => { e.preventDefault(); loadData(filters); }}
                  className="flex flex-wrap items-end gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100"
                >
                  {[
                    { key: "startDate", label: "Desde" },
                    { key: "endDate", label: "Hasta" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                      <input
                        type="date"
                        value={filters[key as keyof typeof filters]}
                        onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                        className="block px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#003366] focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  ))}
                  <button type="submit" className="px-5 py-2 bg-[#003366] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#004488] transition-colors h-[38px]">
                    Filtrar
                  </button>
                  {(filters.startDate || filters.endDate) && (
                    <button
                      type="button"
                      onClick={() => { setFilters({ startDate: "", endDate: "" }); loadData({ startDate: "", endDate: "" }); }}
                      className="px-4 py-2 text-slate-400 hover:text-[#003366] text-[10px] font-black uppercase tracking-widest h-[38px]"
                    >
                      Limpiar
                    </button>
                  )}
                </form>
              </div>

              <div className="divide-y divide-slate-50">
                {history.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sin registros</p>
                  </div>
                ) : (
                  history.map((record) => (
                    <HistoryRow
                      key={record.id as string}
                      record={record}
                      expanded={expandedRecord === record.id}
                      onToggle={() => setExpandedRecord(expandedRecord === record.id ? null : record.id as string)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Flujo de Registro ───────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Header modal */}
              <div className="bg-[#003366] p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em]">
                    {modalAction === "IN" ? "Registrar Entrada" : "Registrar Salida"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {modalStep === "photo"      && <Camera     className="w-5 h-5 text-white/70" />}
                    {modalStep === "biometric"  && <Fingerprint className="w-5 h-5 text-white/70" />}
                    {modalStep === "submitting" && <MapPin      className="w-5 h-5 text-white/70 animate-pulse" />}
                    {modalStep === "done"       && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
                    {modalStep === "error"      && <AlertCircle  className="w-5 h-5 text-rose-300" />}
                    <p className="text-white font-black text-lg">
                      {modalStep === "photo"      && "Paso 1 — Foto"}
                      {modalStep === "biometric"  && "Paso 2 — Biometría"}
                      {modalStep === "submitting" && "Registrando…"}
                      {modalStep === "done"       && "¡Registrado!"}
                      {modalStep === "error"      && "No se pudo registrar"}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stepper */}
              <div className="px-6 pt-5 pb-0">
                <div className="flex items-center gap-2">
                  {(["photo", "biometric", "submitting"] as ModalStep[]).map((step, i) => (
                    <React.Fragment key={step}>
                      <div className={cn(
                        "flex-1 h-1.5 rounded-full transition-colors",
                        (["photo", "biometric", "submitting", "done"].indexOf(modalStep) >= i)
                          ? "bg-[#003366]" : "bg-slate-100"
                      )} />
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* PASO 1: CÁMARA */}
                {modalStep === "photo" && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Toma una foto para verificar tu presencia
                    </p>

                    {/* Video + overlay de carga */}
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                      {camera.state === "error" ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70 p-6 text-center">
                          <Camera className="w-10 h-10" />
                          <p className="text-xs font-bold leading-relaxed">{camera.error}</p>
                        </div>
                      ) : (
                        <video
                          ref={videoRef}
                          className={cn("w-full h-full object-cover", camera.isMirrored && "scale-x-[-1]")}
                          autoPlay playsInline muted
                        />
                      )}
                      {camera.state === "opening" && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Iniciando cámara…</p>
                        </div>
                      )}
                      {/* Botón cambio de cámara encima del video */}
                      {camera.state === "active" && (
                        <button
                          type="button"
                          onClick={() => {
                            camera.stopCamera();
                            setCameraFacing((f) => (f === "user" ? "environment" : "user"));
                          }}
                          className="absolute top-2 right-2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-xl flex items-center justify-center transition-colors"
                          title={cameraFacing === "user" ? "Cambiar a cámara trasera" : "Cambiar a cámara frontal"}
                        >
                          <SwitchCamera className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleCapturePhoto}
                      disabled={camera.state !== "active"}
                      className="w-full py-4 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#004488] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                    >
                      <Camera className="w-5 h-5" />
                      Capturar Foto
                    </button>

                    {camera.state === "error" && (
                      <button
                        onClick={() => {
                          const el = videoRef.current;
                          if (el) void camera.openCamera(el, { facingMode: cameraFacing });
                        }}
                        className="w-full py-3 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reintentar cámara
                      </button>
                    )}
                  </div>
                )}

                {/* PASO 2: BIOMETRÍA */}
                {modalStep === "biometric" && (
                  <div className="space-y-4">
                    {/* Foto capturada como confirmación */}
                    {capturedPhotoUrl && (
                      <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <NextImage
                          src={capturedPhotoUrl}
                          width={48}
                          height={48}
                          unoptimized
                          className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-200"
                          alt="Foto capturada para asistencia"
                        />
                        <div>
                          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Foto lista</p>
                          <p className="text-[9px] text-emerald-600">Verificando identidad…</p>
                        </div>
                      </div>
                    )}

                    {/* Estado biométrico */}
                    <div className="flex flex-col items-center gap-4 py-7 bg-blue-50 rounded-2xl border border-blue-100">
                      <motion.div
                        animate={
                          webAuthn.state === "authenticating" || webAuthn.state === "registering" || webAuthn.state === "checking"
                            ? { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 1.4 } }
                            : { scale: 1 }
                        }
                        className={cn(
                          "w-20 h-20 rounded-full flex items-center justify-center",
                          webAuthn.state === "authenticating" || webAuthn.state === "registering" || webAuthn.state === "checking"
                            ? "bg-blue-500"
                            : webAuthn.state === "verified" ? "bg-emerald-500"
                            : webAuthn.state === "error"   ? "bg-rose-100"
                            : "bg-blue-100"
                        )}
                      >
                        {webAuthn.state === "verified"
                          ? <ShieldCheck className="w-10 h-10 text-white" />
                          : webAuthn.state === "error"
                          ? <ShieldX className="w-10 h-10 text-rose-500" />
                          : webAuthn.state === "authenticating" || webAuthn.state === "registering" || webAuthn.state === "checking"
                          ? <Loader2 className="w-10 h-10 text-white animate-spin" />
                          : <Fingerprint className="w-10 h-10 text-blue-600" />
                        }
                      </motion.div>

                      <div className="text-center px-4 space-y-1">
                        <p className="text-sm font-black text-blue-900">
                          {(biometricPlatformOk === null || hasSavedCredential === null || webAuthn.state === "checking") && "Comprobando dispositivo…"}
                          {biometricPlatformOk === true && webAuthn.state === "idle"          && "Preparando verificación…"}
                          {webAuthn.state === "registering"                                   && "Registrando credencial…"}
                          {webAuthn.state === "authenticating"                                && "Verifica con tu huella o Face ID"}
                          {webAuthn.state === "verified"                                      && "¡Identidad verificada!"}
                          {webAuthn.state === "error"                                         && "Verificación fallida"}
                        </p>
                        {biometricPlatformOk === true && hasSavedCredential !== null && webAuthn.state === "idle" && (
                          <p className="text-[9px] text-blue-500 font-bold">
                            {hasSavedCredential
                              ? "Se usará tu credencial guardada en este dispositivo"
                              : "Primera vez: se creará una credencial segura en este dispositivo"}
                          </p>
                        )}
                        {(webAuthn.state === "authenticating" || webAuthn.state === "registering") && (
                          <p className="text-[9px] text-blue-400 font-bold">
                            Usa la huella, Face ID o PIN del sistema cuando aparezca
                          </p>
                        )}
                      </div>
                    </div>

                    {modalError && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold leading-relaxed">{modalError}</p>
                      </div>
                    )}

                    {/* Botón manual solo si hay error o no soporta */}
                    {(webAuthn.state === "error" || biometricPlatformOk === false) && (
                      <button
                        onClick={handleBiometricRetry}
                        disabled={biometricPlatformOk === false}
                        className="w-full py-4 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#004488] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reintentar verificación
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setModalStep("photo");
                        setBiometricPlatformOk(null);
                        setHasSavedCredential(null);
                        setModalError(null);
                        webAuthn.reset();
                        camera.reset();
                      }}
                      className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#003366] transition-colors"
                    >
                      ← Volver a tomar foto
                    </button>
                  </div>
                )}

                {/* ENVIANDO */}
                {modalStep === "submitting" && (
                  <div className="flex flex-col items-center gap-6 py-10">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-[#003366]/10 flex items-center justify-center">
                        <MapPin className="w-9 h-9 text-[#003366]" />
                      </div>
                      <Loader2 className="w-6 h-6 text-[#003366] animate-spin absolute -bottom-1 -right-1" />
                    </div>
                    <div className="text-center space-y-2 px-4 w-full">
                      <p className="font-black text-[#003366]">Registrando asistencia…</p>
                      {gpsStatusText ? (
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-xs mx-auto bg-slate-50 rounded-xl p-3 border border-slate-100">
                          {gpsStatusText}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Obteniendo GPS y enviando al servidor
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ÉXITO */}
                {modalStep === "done" && (
                  <div className="flex flex-col items-center gap-5 py-8">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </motion.div>

                    <div className="text-center space-y-1">
                      <p className="font-black text-[#003366] text-lg">
                        {modalAction === "IN" ? "Entrada registrada" : "Salida registrada"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    {/* Foto capturada en miniatura */}
                    {capturedPhotoUrl && (
                      <NextImage
                        src={capturedPhotoUrl}
                        width={80}
                        height={80}
                        unoptimized
                        className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
                        alt="Foto de asistencia registrada"
                      />
                    )}

                    {/* Badge de precisión GPS */}
                    {lastGpsAccuracy !== null && (
                      <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold",
                        getAccuracyLevel(lastGpsAccuracy) === "alta"  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        getAccuracyLevel(lastGpsAccuracy) === "media" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        "bg-rose-50 text-rose-700 border border-rose-100"
                      )}>
                        {getAccuracyLevel(lastGpsAccuracy) !== "baja"
                          ? <Wifi className="w-3.5 h-3.5" />
                          : <WifiOff className="w-3.5 h-3.5" />}
                        GPS ±{Math.round(lastGpsAccuracy)} m
                      </div>
                    )}

                    <button
                      onClick={closeModal}
                      className="px-8 py-3 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#004488] transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                )}

                {/* ERROR */}
                {modalStep === "error" && (
                  <div className="flex flex-col items-center gap-5 py-8">
                    <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center">
                      <ShieldX className="w-10 h-10 text-rose-600" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="font-black text-rose-700">No se pudo registrar asistencia</p>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">{modalError}</p>
                    </div>
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => { setModalStep("photo"); camera.reset(); webAuthn.reset(); }}
                        className="flex-1 py-3 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#004488] transition-colors"
                      >
                        Reintentar
                      </button>
                      <button onClick={closeModal} className="flex-1 py-3 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Foto de Actividad RF-17 ─────────────────────────────────── */}
      <AnimatePresence>
        {activityModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-[#003366] p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em]">RF-17</p>
                  <p className="text-white font-black text-lg mt-1">Foto de Actividad</p>
                </div>
                <button
                  onClick={() => { setActivityModalOpen(false); activityCamera.stopCamera(); setActivityBlobTemp(null); }}
                  className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {!activityBlobTemp ? (
                  <>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Documenta tus actividades del día
                    </p>
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                      {activityCamera.state === "error" ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60 p-4 text-center">
                          <Camera className="w-10 h-10" />
                          <p className="text-xs">{activityCamera.error}</p>
                        </div>
                      ) : (
                        <video ref={activityVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                      )}
                      {activityCamera.state === "opening" && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleCaptureActivity}
                      disabled={activityCamera.state !== "active"}
                      className="w-full py-4 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest text-sm disabled:opacity-50 hover:bg-[#004488] transition-colors flex items-center justify-center gap-3"
                    >
                      <Camera className="w-5 h-5" />
                      Capturar
                    </button>
                  </>
                ) : (
                  <>
                    <NextImage
                      src={activityPreviewTemp!}
                      alt="Vista previa de actividad"
                      width={640}
                      height={360}
                      unoptimized
                      className="w-full aspect-video object-cover rounded-2xl"
                    />

                    {/* RF-18: Campo de descripción + botón de IA */}
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={activityCaption}
                          onChange={(e) => setActivityCaption(e.target.value)}
                          placeholder="Descripción de la actividad (opcional)"
                          className="w-full px-4 py-3 pr-36 border border-slate-200 rounded-2xl text-sm text-[#003366] font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {aiAvailable && (
                          <button
                            type="button"
                            onClick={handleSuggestCaption}
                            disabled={suggestingCaption}
                            title="Sugerir descripción con IA (RF-18)"
                            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:from-purple-600 hover:to-indigo-600 disabled:opacity-60 transition-all"
                          >
                            {suggestingCaption
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Sparkles className="w-3 h-3" />
                            }
                            {suggestingCaption ? "Analizando..." : "Sugerir IA"}
                          </button>
                        )}
                      </div>
                      {aiAvailable && (
                        <p className="text-[9px] text-slate-400 font-bold px-1">
                          ✨ Agente IA disponible — analiza la imagen y sugiere una descripción automáticamente
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleUploadActivity}
                        disabled={uploadingActivity}
                        className="flex-1 py-3 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#004488] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {uploadingActivity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Guardar
                      </button>
                      <button
                        onClick={() => { setActivityBlobTemp(null); setActivityPreviewTemp(null); activityCamera.reset(); if (activityVideoRef.current) activityCamera.openCamera(activityVideoRef.current); }}
                        className="flex-1 py-3 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        Re-tomar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────
function StepBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-tight">
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

function HistoryRow({ record, expanded, onToggle }: {
  record: Record<string, unknown>;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-slate-50 last:border-0">
      <button onClick={onToggle} className="w-full p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex flex-col items-center justify-center group-hover:bg-white transition-colors">
            <span className="text-[11px] font-black text-[#003366] leading-none">
              {new Date(record.checkIn as string).getDate()}
            </span>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">
              {new Date(record.checkIn as string).toLocaleString("es-ES", { month: "short" })}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest mb-1">
              {new Date(record.checkIn as string).toLocaleDateString("es-ES", { weekday: "long" })}
            </p>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <ArrowRightCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-black text-[#003366]">
                  {new Date(record.checkIn as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {record.checkOut ? (
                <div className="flex items-center gap-1.5">
                  <ArrowLeftCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs font-black text-[#003366]">
                    {new Date(record.checkOut as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ) : (
                <span className="px-2 py-0.5 bg-amber-50 rounded text-[9px] font-black text-amber-600 uppercase">Pendiente salida</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
            <MapPin className="w-3 h-3 text-slate-300" />
            {record.distanceKm ? `${((record.distanceKm as number) * 1000).toFixed(0)}m` : "N/A"}
          </div>
          {/* Indicadores de foto */}
          {!!record.checkInPhoto && <div className="w-2 h-2 rounded-full bg-emerald-400" title="Foto de entrada" />}
          {!!record.checkOutPhoto && <div className="w-2 h-2 rounded-full bg-rose-400" title="Foto de salida" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
        </div>
      </button>

      {/* Fotos del registro */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 flex gap-4">
              {!!record.checkInPhoto && (
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Foto Entrada</p>
                  <NextImage
                    src={record.checkInPhoto as string}
                    width={96}
                    height={96}
                    unoptimized
                    alt="Foto de entrada del día"
                    className="w-24 h-24 rounded-xl object-cover border border-emerald-100"
                  />
                </div>
              )}
              {!!record.checkOutPhoto && (
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Foto Salida</p>
                  <NextImage
                    src={record.checkOutPhoto as string}
                    width={96}
                    height={96}
                    unoptimized
                    alt="Foto de salida del día"
                    className="w-24 h-24 rounded-xl object-cover border border-rose-100"
                  />
                </div>
              )}
              {!record.checkInPhoto && !record.checkOutPhoto && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Info className="w-4 h-4" />
                  <p className="text-[9px] font-bold">Sin fotos en este registro</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
