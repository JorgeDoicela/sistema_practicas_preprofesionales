"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  CalendarCheck, Search, Clock, CheckCircle2, AlertCircle, Loader2,
  Building2, ChevronDown, ChevronUp, ArrowRightCircle, ArrowLeftCircle,
  MapPin, Plus, Trash2, Navigation, Edit3, X, Save, Info, User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";
import { attendancesService } from "@/services/attendances.service";
import { useLanguage } from "@/providers/LanguageProvider";
import MapPicker from "@/components/shared/MapPicker";
import Link from "next/link";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface AllowedLocation {
  label: string;
  lat: number;
  lng: number;
  radiusM?: number;
}

interface StudentAttendance {
  internshipId: string;
  studentName: string;
  companyName: string;
  status: string;
  allowedLocations: AllowedLocation[];
  legacyLat?: number | null;
  legacyLng?: number | null;
  summary: {
    totalHours: number;
    requiredHours: number;
    progressPercentage: number;
    totalRecords: number;
    remainingHours: number;
  } | null;
  history: any[];
  loadingDetail: boolean;
}

// ── Componente principal ───────────────────────────────────────────────────
export default function TutorAsistenciaPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal de ubicaciones
  const [locationModalId, setLocationModalId] = useState<string | null>(null);
  const [editingLocations, setEditingLocations] = useState<AllowedLocation[]>([]);
  const [savingLocations, setSavingLocations] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);

  // Form de nueva ubicación
  const [newLocLabel, setNewLocLabel] = useState("");
  const [newLocLat, setNewLocLat] = useState("");
  const [newLocLng, setNewLocLng] = useState("");
  const [newLocRadius, setNewLocRadius] = useState("200");
  const [gettingGps, setGettingGps] = useState(false);
  const [addLocError, setAddLocError] = useState<string | null>(null);
  const [showMapSelector, setShowMapSelector] = useState(false);

  const loadBase = useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const res: any = await internshipsService.findByTutor(user.id);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
      
      setRows(
        list.map((i: any) => ({
          internshipId: i.id,
          studentName: i.student?.fullName ?? "—",
          companyName: i.company?.name ?? "—",
          status: i.status ?? "—",
          allowedLocations: Array.isArray(i.allowedLocations) ? i.allowedLocations : [],
          legacyLat: i.lat ?? null,
          legacyLng: i.lng ?? null,
          summary: null,
          history: [],
          loadingDetail: false,
        })),
      );
    } catch (error) {
      console.error("Error cargando pasantes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBase(); }, [loadBase]);

  const loadDetail = useCallback(async (internshipId: string) => {
    setRows((prev) =>
      prev.map((r) => r.internshipId === internshipId ? { ...r, loadingDetail: true } : r),
    );
    try {
      const [sumRes, histRes]: [any, any] = await Promise.all([
        attendancesService.getSummary(internshipId),
        attendancesService.findByInternship(internshipId),
      ]);

      const summary = sumRes?.data || sumRes || null;
      const history = Array.isArray(histRes) ? histRes : (Array.isArray(histRes?.data) ? histRes.data : []);

      setRows((prev) =>
        prev.map((r) =>
          r.internshipId === internshipId
            ? { ...r, summary, history: history as any[], loadingDetail: false }
            : r,
        ),
      );
    } catch {
      setRows((prev) =>
        prev.map((r) => r.internshipId === internshipId ? { ...r, loadingDetail: false } : r),
      );
    }
  }, []);

  const handleToggle = (internshipId: string) => {
    if (expandedId === internshipId) { setExpandedId(null); return; }
    setExpandedId(internshipId);
    const row = rows.find((r) => r.internshipId === internshipId);
    if (row && !row.summary && !row.loadingDetail) loadDetail(internshipId);
  };

  // ── Gestión de ubicaciones ──────────────────────────────────────────────
  const openLocationModal = (row: StudentAttendance) => {
    const locs: AllowedLocation[] =
      row.allowedLocations.length > 0
        ? [...row.allowedLocations]
        : row.legacyLat && row.legacyLng
          ? [{ label: "Sede principal", lat: row.legacyLat, lng: row.legacyLng, radiusM: 200 }]
          : [];
    setEditingLocations(locs);
    setNewLocLabel(""); setNewLocLat(""); setNewLocLng(""); setNewLocRadius("200");
    setAddLocError(null); setLocationSaved(false);
    setLocationModalId(row.internshipId);
    setShowMapSelector(false);
  };

  const closeLocationModal = () => setLocationModalId(null);

  const handleGetGps = () => {
    if (!navigator.geolocation) { setAddLocError(t.asistencia.errors.gpsUnsupported || "Tu navegador no soporta GPS"); return; }
    setGettingGps(true);
    setAddLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewLocLat(pos.coords.latitude.toFixed(6));
        setNewLocLng(pos.coords.longitude.toFixed(6));
        setGettingGps(false);
      },
      () => { setAddLocError(t.asistencia.errors.gpsFailed || "No se pudo obtener la ubicación"); setGettingGps(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleAddLocation = () => {
    setAddLocError(null);
    
    // Sanitización: Convertir comas a puntos en las coordenadas (común en teclados en español)
    const sanitizedLat = newLocLat.toString().replace(',', '.');
    const sanitizedLng = newLocLng.toString().replace(',', '.');
    
    const lat = parseFloat(sanitizedLat);
    const lng = parseFloat(sanitizedLng);
    const radius = parseInt(newLocRadius, 10);

    if (!newLocLabel.trim()) { 
      setAddLocError("Por favor, asigne un nombre a la sede (ej: Sede Norte)"); 
      return; 
    }
    if (isNaN(lat) || lat < -90 || lat > 90) { 
      setAddLocError("La latitud debe ser un número entre -90 y 90"); 
      return; 
    }
    if (isNaN(lng) || lng < -180 || lng > 180) { 
      setAddLocError("La longitud debe ser un número entre -180 y 180"); 
      return; 
    }
    if (isNaN(radius) || radius < 50 || radius > 5000) { 
      setAddLocError("El radio debe estar entre 50m y 5000m"); 
      return; 
    }

    setEditingLocations((prev) => [...prev, { label: newLocLabel.trim(), lat, lng, radiusM: radius }]);
    // Limpiar campos y cerrar mapa para ver la lista
    setNewLocLabel(""); 
    setNewLocLat(""); 
    setNewLocLng(""); 
    setNewLocRadius("200");
    setShowMapSelector(false);
  };

  const handleRemoveLocation = (idx: number) => {
    setEditingLocations((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveLocations = async () => {
    if (!locationModalId) return;
    setSavingLocations(true);
    try {
      await internshipsService.updateLocations(locationModalId, editingLocations);
      setRows((prev) =>
        prev.map((r) =>
          r.internshipId === locationModalId
            ? { ...r, allowedLocations: editingLocations }
            : r,
        ),
      );
      setLocationSaved(true);
      setTimeout(() => { setLocationSaved(false); closeLocationModal(); }, 1200);
    } catch (err: any) {
      setAddLocError(err.message || "Error al guardar");
    } finally {
      setSavingLocations(false);
    }
  };

  const filtered = rows.filter(
    (r) =>
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.companyName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalHoursAll = rows.reduce((acc, r) => acc + (r.summary?.totalHours ?? 0), 0);
  const avgProgress =
    rows.filter((r) => r.summary).length > 0
      ? Math.round(
          rows
            .filter((r) => r.summary)
            .reduce((acc, r) => acc + (r.summary?.progressPercentage ?? 0), 0) /
            rows.filter((r) => r.summary).length,
        )
      : null;

  const activeRow = rows.find((r) => r.internshipId === locationModalId);

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-[1300px] mx-auto pb-20">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
              {t.tutor.portal}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">
              {t.asistencia.title} <span className="text-slate-400">{t.asistencia.company.interns}</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              {t.tutor.desc}
            </p>
          </div>
          <div className="relative group" data-tour="tutor-asistencia-search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
            <input
              type="text"
              placeholder={t.common.search + "..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-[300px] outline-none focus:ring-4 focus:ring-[#003366]/5 focus:border-[#003366] transition-all font-medium text-sm shadow-sm"
            />
          </div>
        </section>

        {/* KPIs */}
        {!loading && rows.length > 0 && (
          <section className="grid sm:grid-cols-3 gap-6" data-tour="tutor-asistencia-kpis">
            <KpiCard icon={<Clock className="w-6 h-6" />} title={t.asistencia.company.activeInterns} value={rows.filter((r) => r.status !== "Finalizado").length} color="bg-blue-500" />
            <KpiCard icon={<CheckCircle2 className="w-6 h-6" />} title={t.asistencia.company.accumulatedHours} value={`${totalHoursAll}h`} color="bg-emerald-500" />
            <KpiCard icon={<CalendarCheck className="w-6 h-6" />} title={t.tutor.avgProgress} value={avgProgress !== null ? `${avgProgress}%` : "—"} color="bg-amber-500" />
          </section>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.asistencia.company.loadingInterns}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 text-center">
            <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">
              {searchTerm ? t.asistencia.company.noResults : t.asistencia.company.noInterns}
            </p>
          </div>
        ) : (
          <div className="grid gap-4" data-tour="tutor-asistencia-list">
            {filtered.map((row, idx) => (
              <motion.div
                key={row.internshipId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Fila principal */}
                <div className="p-7 flex flex-col md:flex-row md:items-center gap-5">
                  <button
                    onClick={() => handleToggle(row.internshipId)}
                    className="flex-1 flex flex-col md:flex-row md:items-center gap-5 text-left"
                  >
                    <div className="w-14 h-14 rounded-[1.5rem] bg-[#003366]/5 flex items-center justify-center text-xl font-black text-[#003366] shrink-0">
                      {row.studentName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-black text-[#003366] truncate">{row.studentName}</h3>
                      <div className="flex flex-wrap gap-4 mt-1">
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Building2 className="w-3 h-3" />{row.companyName}
                        </span>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          row.status === "Finalizado" ? "text-emerald-700" : "text-amber-700",
                        )}>
                          {row.status}
                        </span>
                        {/* Badge de ubicaciones */}
                        <span className={cn(
                          "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest",
                          row.allowedLocations.length > 0
                            ? "text-blue-700"
                            : "text-rose-600",
                        )}>
                          <MapPin className="w-2.5 h-2.5" />
                          {row.allowedLocations.length > 0
                            ? `${row.allowedLocations.length} ${t.asistencia.requirements.noLocations.replace("Sin ", "")}`
                            : t.asistencia.requirements.noLocations}
                        </span>
                      </div>
                    </div>

                    {/* Progress mini */}
                    <div className="flex items-center gap-4 shrink-0">
                      {row.summary ? (
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {row.summary.totalHours}h / {row.summary.requiredHours}h
                          </p>
                          <div className="w-32 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-[#003366] rounded-full transition-all" style={{ width: `${row.summary.progressPercentage}%` }} />
                          </div>
                          <p className="text-[9px] font-black text-[#C5A059] mt-0.5">{row.summary.progressPercentage}% {t.asistencia.company.completed}</p>
                        </div>
                      ) : row.loadingDetail ? (
                        <Loader2 className="w-5 h-5 text-[#003366] animate-spin" />
                      ) : null}
                      {expandedId === row.internshipId ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {/* Botones de acción */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/tutor-academico/estudiantes/${row.internshipId}`}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#C5A059] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#b08940] transition-all shadow-lg shadow-amber-900/10"
                    >
                      <User className="w-3.5 h-3.5" />
                      {t.tutor.viewFile}
                    </Link>
                    
                    <button
                      onClick={() => openLocationModal(row)}
                      data-tour="tutor-asistencia-locations"
                      className="flex items-center gap-2 px-4 py-2.5 border-2 border-[#003366]/20 rounded-2xl text-[10px] font-black text-[#003366] uppercase tracking-widest hover:bg-[#003366] hover:text-white hover:border-[#003366] transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {t.tutor.manageLocations}
                    </button>
                  </div>
                </div>

                {/* Detalle de historial */}
                <AnimatePresence>
                  {expandedId === row.internshipId && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <div className="p-7">
                        {row.loadingDetail ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 text-[#003366] animate-spin" />
                          </div>
                        ) : (
                          <>
                            {/* Resumen KPIs */}
                            {row.summary && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                {[
                                  { label: t.asistencia.stats.hours, value: `${row.summary.totalHours}h` },
                                  { label: t.asistencia.stats.progress, value: `${row.summary.requiredHours}h` },
                                  { label: t.asistencia.stats.records, value: String(row.summary.totalRecords) },
                                  { label: t.asistencia.stats.pending, value: `${row.summary.remainingHours}h` },
                                ].map((kpi) => (
                                  <div key={kpi.label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{kpi.label}</p>
                                    <p className="text-xl font-black text-[#003366]">{kpi.value}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Sedes configuradas */}
                            {row.allowedLocations.length > 0 && (
                              <div className="mb-6 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                                <p className="text-[9px] font-black uppercase tracking-widest text-blue-700 mb-3 flex items-center gap-2">
                                  <MapPin className="w-3 h-3" /> {t.tutor.configLocations}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {row.allowedLocations.map((loc, i) => (
                                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-blue-200 text-[10px] font-bold text-blue-800">
                                      <MapPin className="w-3 h-3 text-blue-500" />
                                      {loc.label}
                                      <span className="text-blue-400">· {loc.radiusM ?? 200}m</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Historial tabla */}
                            {row.history.length === 0 ? (
                              <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-300 py-8">
                                {t.asistencia.history.noRecords}
                              </p>
                            ) : (
                              <div className="rounded-2xl border border-slate-100 overflow-hidden overflow-x-auto">
                                <table className="w-full text-xs min-w-[700px]">
                                  <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">{t.common.date}</th>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">{t.asistencia.actions.markIn}</th>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">{t.asistencia.actions.markOut}</th>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">{t.asistencia.actions.photo}</th>
                                      <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-slate-400 text-[9px]">{t.asistencia.actions.gps}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {row.history.slice(0, 15).map((h: any) => (
                                      <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3 font-bold text-[#003366]">
                                          {new Date(h.checkIn).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                                        </td>
                                        <td className="px-5 py-3">
                                          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                            <ArrowRightCircle className="w-3.5 h-3.5" />
                                            {new Date(h.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                          </div>
                                        </td>
                                        <td className="px-5 py-3">
                                          {h.checkOut ? (
                                            <div className="flex items-center gap-1.5 text-rose-500 font-bold">
                                              <ArrowLeftCircle className="w-3.5 h-3.5" />
                                              {new Date(h.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                          ) : (
                                            <span className="text-amber-500 font-black text-[9px] uppercase">{t.common.pending}</span>
                                          )}
                                        </td>
                                        <td className="px-5 py-3">
                                          <div className="flex gap-1">
                                            {h.checkInPhoto && (
                                              <a href={h.checkInPhoto} target="_blank" rel="noopener noreferrer" title="Foto entrada">
                                                <div className="w-7 h-7 rounded-lg overflow-hidden border border-emerald-200">
                                                  <img src={h.checkInPhoto} alt="entrada" className="w-full h-full object-cover" />
                                                </div>
                                              </a>
                                            )}
                                            {h.checkOutPhoto && (
                                              <a href={h.checkOutPhoto} target="_blank" rel="noopener noreferrer" title="Foto salida">
                                                <div className="w-7 h-7 rounded-lg overflow-hidden border border-rose-200">
                                                  <img src={h.checkOutPhoto} alt="salida" className="w-full h-full object-cover" />
                                                </div>
                                              </a>
                                            )}
                                            {!h.checkInPhoto && !h.checkOutPhoto && (
                                              <span className="text-slate-300 text-[9px] font-bold">—</span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-5 py-3">
                                          <div className="flex items-center gap-1 text-slate-400 font-bold">
                                            <MapPin className="w-3 h-3" />
                                            {h.distanceKm ? `${(h.distanceKm * 1000).toFixed(0)}m` : "N/A"}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {row.history.length > 15 && (
                                  <p className="text-center text-[9px] font-black uppercase tracking-widest text-slate-300 py-3 border-t border-slate-100">
                                    Mostrando los últimos 15 registros
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal: Gestionar Ubicaciones ──────────────────────────────────────── */}
      <AnimatePresence>
        {locationModalId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-[#003366] p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em]">
                    {t.tutor.locationsTitle}
                  </p>
                  <p className="text-white font-black text-lg mt-0.5">
                    {activeRow?.studentName}
                  </p>
                </div>
                <button
                  onClick={closeLocationModal}
                  className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Info */}
                <div className="flex gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-blue-700 leading-relaxed">
                    {t.tutor.locationInfo}
                  </p>
                </div>

                {/* Sedes existentes */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {t.tutor.configLocations} ({editingLocations.length})
                  </p>

                  {editingLocations.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                      <MapPin className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                        {t.tutor.noConfigLocations}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {t.tutor.noConfigLocationsDesc}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editingLocations.map((loc, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                          <div className="w-8 h-8 bg-[#003366] rounded-xl flex items-center justify-center text-[#C5A059] shrink-0 text-xs font-black">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-[#003366] text-sm">{loc.label}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                              Lat: {loc.lat.toFixed(6)} · Lng: {loc.lng.toFixed(6)} · Radio: {loc.radiusM ?? 200}m
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveLocation(i)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Agregar nueva sede */}
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Plus className="w-3 h-3" /> {t.tutor.addLocation}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowMapSelector(!showMapSelector)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                        showMapSelector
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      <MapPin className="w-4 h-4" />
                      {showMapSelector ? t.tutor.closeMap : t.tutor.selectOnMap}
                    </button>
                  </div>

                  {showMapSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <MapPicker
                        lat={parseFloat(newLocLat) || -0.180653}
                        lng={parseFloat(newLocLng) || -78.467838}
                        radiusM={parseInt(newLocRadius, 10) || 200}
                        onChange={(lat, lng) => {
                          setNewLocLat(lat.toFixed(6));
                          setNewLocLng(lng.toFixed(6));
                        }}
                      />
                    </motion.div>
                  )}

                  <input
                    type="text"
                    value={newLocLabel}
                    onChange={(e) => setNewLocLabel(e.target.value)}
                    placeholder={t.tutor.locationName}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium text-[#003366] focus:ring-2 focus:ring-blue-500 outline-none"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">
                        {t.tutor.lat}
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={newLocLat}
                        onChange={(e) => setNewLocLat(e.target.value)}
                        placeholder="-0.123456"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium text-[#003366] focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">
                        {t.tutor.lng}
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={newLocLng}
                        onChange={(e) => setNewLocLng(e.target.value)}
                        placeholder="-78.456789"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium text-[#003366] focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">
                        {t.tutor.radius}
                      </label>
                      <input
                        type="number"
                        min={50}
                        max={5000}
                        value={newLocRadius}
                        onChange={(e) => setNewLocRadius(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium text-[#003366] focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <button
                      onClick={handleGetGps}
                      disabled={gettingGps}
                      title="Usar mi ubicación GPS actual"
                      className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 disabled:opacity-60 transition-colors whitespace-nowrap"
                    >
                      {gettingGps ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                      {t.tutor.myGps}
                    </button>
                  </div>

                  {addLocError && (
                    <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p className="text-[10px] font-bold">{addLocError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleAddLocation}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-[#003366] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t.tutor.addToList}
                  </button>
                </div>

                {/* Guardar */}
                <div className="border-t border-slate-100 pt-4">
                  <button
                    onClick={handleSaveLocations}
                    disabled={savingLocations || locationSaved}
                    className={cn(
                      "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3",
                      locationSaved
                        ? "bg-emerald-500 text-white"
                        : "bg-[#003366] text-white hover:bg-[#004488] disabled:opacity-60",
                    )}
                  >
                    {savingLocations ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : locationSaved ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {locationSaved ? t.common.success.generic : savingLocations ? t.common.loading : t.tutor.saveConfig}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function KpiCard({ icon, title, value, color }: { icon: React.ReactElement; title: string; value: string | number; color: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl">
      <div className={cn("inline-flex mb-6", color.replace("bg-", "text-"))}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: "w-8 h-8",
        })}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tighter break-words">{value}</h4>
    </motion.div>
  );
}
