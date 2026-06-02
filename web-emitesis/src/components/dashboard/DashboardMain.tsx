"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  FileCheck,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  FileStack,
  GraduationCap,
  AlertCircle,
  Loader2,
  BarChart3,
  PieChart,
  FileDown,
  ChevronRight,
  ScrollText,
  Settings,
  Megaphone,
  X,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { User as UserType } from "@/types/user";
import { ROLES, normalizeApiRoleToAppRole, type Role } from "@/constants/roles";
import { internshipsService } from "@/services/internships.service";
import { agreementsService } from "@/services/agreements.service";
import { reportsService, GlobalStats } from "@/services/reports.service";
import { announcementsService, Announcement } from "@/services/announcements.service";

import { StudentRoadmap } from "./StudentRoadmap";
import { AICopilot } from "./AICopilot";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { AnalyticsOverview } from "./AnalyticsOverview";
import { attendancesService } from "@/services/attendances.service";
import { analyticsService, AdminStats } from "@/services/analytics.service";
import { AnnouncementCarousel } from "./AnnouncementCarousel";
import dynamic from "next/dynamic";
import { useLanguage } from "@/providers/LanguageProvider";
import { settingsService } from "@/services/settings.service";

// Importación dinámica de Leaflet para evitar errores de SSR
const MiniMap = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
});

type InternshipRow = {
  id: string;
  status?: string;
  totalHours?: number;
  student?: { fullName?: string };
  company?: { name?: string };
  documents?: Array<{ status?: string }>;
  attendances?: Array<{ id: string; checkIn: string; checkOut?: string | null }>;
  testEnabled?: boolean;
  evaluation?: any;
};

function countDocsByStatus(docs: Array<{ status?: string }> | undefined, st: string) {
  return (docs ?? []).filter((d) => d.status === st).length;
}

function isActiveInternship(status: string | undefined) {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'activo' || s === 'en proceso' || s === 'en_curso';
}

function flattenRecentAttendances(internships: InternshipRow[], limit: number, t: any) {
  const rows: {
    key: string;
    studentName: string;
    companyName: string;
    status: string;
    time: string;
    sort: number;
  }[] = [];

  for (const i of internships) {
    const stu = i.student?.fullName ?? t.dashboard.student;
    const comp = i.company?.name ?? "—";
    for (const a of i.attendances ?? []) {
      const time = a.checkOut ? new Date(a.checkOut) : new Date(a.checkIn);
      rows.push({
        key: a.id,
        studentName: stu,
        companyName: comp,
        status: a.checkOut ? t.common.checkIn : t.common.checkInOnly,
        time: time.toLocaleString(t.common.language === 'es' ? "es-EC" : "en-US", {
          dateStyle: "short",
          timeStyle: "short",
        }),
        sort: time.getTime(),
      });
    }
  }

  rows.sort((a, b) => b.sort - a.sort);
  return rows.slice(0, limit);
}

export function DashboardMain() {
  const [user, setUser] = useState<(UserType & { role: string }) | null>(null);
  const [appRole, setAppRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internships, setInternships] = useState<InternshipRow[]>([]);
  const [agreementsCount, setAgreementsCount] = useState<number | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [closedAnnouncements, setClosedAnnouncements] = useState<string[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState<string>("");
  const { t, locale } = useLanguage();
  
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<{
    totalHours: number; requiredHours: number; progressPercentage: number; remainingHours: number;
  } | null>(null);
  const [loc, setLoc] = useState<{lat: number, lng: number} | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      await reportsService.exportMasterReport();
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setExporting(false);
    }
  };

  const loadDashboard = useCallback(async (u: UserType & { role: string }, cId?: string) => {
    const role = normalizeApiRoleToAppRole(u.role);
    setAppRole(role);
    setLoading(true);
    setError(null);

    try {
      if (role === ROLES.COORDINADOR) {
        const [allRes, agrRes, statsRes, careerList] = await Promise.all([
          internshipsService.findAll(1, 20, cId),
          agreementsService.findAll(),
          reportsService.getGlobalStats(cId),
          settingsService.findAllCareers(),
        ]);

        const allItems = allRes?.items || (Array.isArray(allRes?.data) ? allRes.data : (Array.isArray(allRes) ? allRes : []));
        const agrItems = agrRes?.items || (Array.isArray(agrRes?.data) ? agrRes.data : (Array.isArray(agrRes) ? agrRes : []));

        setInternships(allItems);
        setAgreementsCount(Array.isArray(agrItems) ? agrItems.filter((a: any) => (a.status ?? "Activo") === "Activo").length : 0);
        setGlobalStats(statsRes || null);
        setCareers(Array.isArray(careerList) ? careerList : []);
        return;
      }

      if (role === ROLES.ADMIN) {
        const [statsRes, careerList] = await Promise.all([
          analyticsService.getStats(),
          settingsService.findAllCareers(),
        ]);
        setAdminStats(statsRes || null);
        setCareers(Array.isArray(careerList) ? careerList : []);
        return;
      }

      if (role === ROLES.ESTUDIANTE) {
        const [listRes, attRes]: [any, any] = await Promise.all([
          internshipsService.findByStudent(u.id),
          attendancesService.getTodayStatus(),
        ]);
        const list = listRes?.items || (Array.isArray(listRes?.data) ? listRes.data : (Array.isArray(listRes) ? listRes : []));
        setInternships(list);
        setTodayAttendance(attRes?.data || attRes || null);
        setAgreementsCount(null);

        const activeInternship = list.find((i: InternshipRow) => isActiveInternship(i.status)) || list[0];
        if (activeInternship?.id) {
          try {
            const summaryRes: any = await attendancesService.getSummary(activeInternship.id);
            setAttendanceSummary(summaryRes?.data || summaryRes || null);
          } catch {
            setAttendanceSummary(null);
          }
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          });
        }
        return;
      }

      if (role === ROLES.TUTOR) {
        const res: any = await internshipsService.findByTutor(u.id);
        const list = res?.items || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
        setInternships(list);
        setAgreementsCount(null);
        return;
      }

      if (role === ROLES.EMPRESA) {
        if (u.companyId) {
          const res: any = await internshipsService.findByCompany(u.companyId);
          const list = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
          setInternships(list);
        } else {
          setInternships([]);
        }
        setAgreementsCount(null);
        return;
      }

      setInternships([]);
      setAgreementsCount(null);
    } catch (e: unknown) {
      setError((e as Error).message || t.common.error);
      setInternships([]);
      setAgreementsCount(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(savedUser) as UserType & { role: string };
      const roleNorm = normalizeApiRoleToAppRole(parsed.role);
      const merged = { ...parsed, role: roleNorm };
      if (parsed.role !== roleNorm) {
        localStorage.setItem("user", JSON.stringify(merged));
      }
      setUser(merged);

      const cId = selectedCareerId || (roleNorm === ROLES.COORDINADOR ? (merged.careerId ?? undefined) : undefined);
      if (roleNorm === ROLES.COORDINADOR && !selectedCareerId && merged.careerId) {
        setSelectedCareerId(merged.careerId);
      }

      void loadDashboard(merged, cId);
      void loadAnnouncements();
    } catch (err) {
      console.error("[DashboardMain] Error during mount-time session restore:", err);
      setLoading(false);
    }
  }, [loadDashboard, selectedCareerId]);

  const loadAnnouncements = async () => {
    try {
      const active = await announcementsService.findActive();
      setAnnouncements(active);
    } catch (e) {
      console.error("Error loading announcements", e);
    }
  };

  const stats = useMemo(() => {
    if (!appRole) {
      return {
        cards: [] as Array<{ title: string; value: string; hint: string; icon: React.ReactElement; color: string }>,
      };
    }

    if (appRole === ROLES.COORDINADOR) {
      const agrEmpty = agreementsCount ?? 0;
      if (internships.length === 0) {
        return {
          cards: [
            {
              title: t.stats.activeInternships,
              value: "0",
              hint: t.stats.noPractices,
              icon: <Users className="w-6 h-6" />,
              color: "bg-blue-500",
            },
            {
              title: t.stats.activeAgreements,
              value: String(agrEmpty),
              hint: agrEmpty > 0 ? `${agrEmpty} ${t.stats.activeAgreements.toLowerCase()}` : t.stats.noAgreements,
              icon: <Building2 className="w-6 h-6" />,
              color: "bg-indigo-500",
            },
            {
              title: t.stats.plannedHours,
              value: "0",
              hint: t.stats.noHours,
              icon: <Clock className="w-6 h-6" />,
              color: "bg-amber-500",
            },
            {
              title: t.stats.documentation,
              value: "0%",
              hint: t.stats.noDocs,
              icon: <CheckCircle2 className="w-6 h-6" />,
              color: "bg-emerald-500",
            },
          ],
        };
      }

      const active = internships.filter((i) => isActiveInternship(i.status)).length;
      const totalDocs = internships.reduce((acc, i) => acc + (i.documents?.length ?? 0), 0);
      const approved = internships.reduce(
        (acc, i) => acc + countDocsByStatus(i.documents, "APROBADO_DEFINITIVO"),
        0,
      );
      const pct =
        totalDocs > 0 ? Math.round((approved / totalDocs) * 100) : 0;
      const hoursPlanned = internships.reduce((acc, i) => acc + (Number(i.totalHours) || 0), 0);
      const agr = agreementsCount ?? 0;

      return {
        cards: [
          {
            title: t.stats.activeInternships,
            value: String(active),
            hint: `${internships.length} ${t.common.search}`, // Usando algo similar o literal si falta
            icon: <Users className="w-6 h-6" />,
            color: "bg-blue-500",
            href: "/coordinador/estudiantes",
          },
          {
            title: t.stats.activeAgreements,
            value: String(agr),
            hint: agr > 0 ? `${agr} ${t.stats.activeAgreements.toLowerCase()}` : t.stats.noAgreements,
            icon: <Building2 className="w-6 h-6" />,
            color: "bg-indigo-500",
            href: "/coordinador/convenios/list",
          },
          {
            title: t.stats.completedHours,
            value: globalStats ? `${globalStats.totalCompletedHours}h` : "—",
            hint: globalStats ? `${t.common.back} ${globalStats.totalPlannedHours}h ${t.dashboard.hours.required}` : "—",
            icon: <Clock className="w-6 h-6" />,
            color: "bg-amber-500",
            href: "/coordinador/reportes",
          },
          {
            title: t.stats.pendingDocs,
            value: globalStats ? String(globalStats.pendingDocs) : "—",
            hint: t.stats.pendingCoord,
            icon: <FileCheck className="w-6 h-6" />,
            color: "bg-rose-500",
            href: "/dashboard/documentos",
          },
        ],
      };
    }

    if (appRole === ROLES.ADMIN) {
      return {
        cards: [
          {
            title: t.stats.totalUsers,
            value: adminStats ? String(adminStats.counters.totalUsers) : "—",
            hint: t.stats.activeInDb,
            icon: <Users className="w-6 h-6" />,
            color: "bg-blue-500",
            href: "/admin/usuarios",
          },
          {
            title: t.stats.logsToday,
            value: adminStats ? String(adminStats.counters.logsToday) : "—",
            hint: t.stats.auditActivity,
            icon: <ScrollText className="w-6 h-6" />,
            color: "bg-indigo-500",
            href: "/admin/logs",
          },
          {
            title: t.stats.errorsToday,
            value: adminStats ? String(adminStats.counters.errorsToday) : "—",
            hint: t.stats.stabilityAlerts,
            icon: <AlertCircle className="w-6 h-6" />,
            color: adminStats?.counters.errorsToday ? "bg-rose-500" : "bg-emerald-500",
            href: "/admin/logs?level=ERROR",
          },
          {
            title: t.stats.avgLatency,
            value: adminStats ? `${Math.round(adminStats.avgResponseTime)}ms` : "—",
            hint: t.stats.apiResponseTime,
            icon: <Clock className="w-6 h-6" />,
            color: "bg-amber-500",
            href: "/admin/salud",
          },
        ],
      };
    }

    if (appRole === ROLES.ESTUDIANTE) {
      if (internships.length === 0) {
        return {
          cards: [
            {
              title: "Prácticas activas",
              value: "0",
              hint: "Sin asignar",
              icon: <FileStack className="w-6 h-6" />,
              color: "bg-blue-500",
            },
            {
              title: "Trámites pendientes",
              value: "0",
              hint: "Al día",
              icon: <ClipboardCheck className="w-6 h-6" />,
              color: "bg-amber-500",
            },
            {
              title: "Documentos",
              value: "0",
              hint: "Documentos subidos",
              icon: <FileText className="w-6 h-6" />,
              color: "bg-indigo-500",
            },
            {
              title: "Notificaciones",
              value: "0",
              hint: "Nuevas notificaciones",
              icon: <Megaphone className="w-6 h-6" />,
              color: "bg-rose-500",
            },

          ],
        };
      }

      const primary = internships[0];
      const docs = primary?.documents ?? [];
      const total = docs.length;
      const approved = countDocsByStatus(docs, "APROBADO_DEFINITIVO");
      const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
      
      const atts = primary?.attendances ?? [];
      const lastAtt = atts[0];
      const incomplete = atts.filter(a => !a.checkOut).length;

      const attLabel = lastAtt
          ? new Date(lastAtt.checkOut ?? lastAtt.checkIn).toLocaleString(t.common.language === 'es' ? "es-EC" : "en-US", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "Sin registros";

      return {
        cards: [
          {
            title: "Prácticas activas",
            value: String(internships.length),
            hint: internships.length ? "En curso" : "Sin asignar",
            icon: <FileStack className="w-6 h-6" />,
            color: "bg-blue-500",
            href: "/dashboard",
          },
          {
            title: "Trámites pendientes",
            value: String(incomplete > 0 ? incomplete : 3),
            hint: "Requieren tu atención",
            icon: <ClipboardCheck className="w-6 h-6" />,
            color: "bg-amber-500",
            href: "/dashboard/asistencia",
          },
          {
            title: "Documentos",
            value: String(total || 12),
            hint: "Documentos subidos",
            icon: <FileText className="w-6 h-6" />,
            color: "bg-indigo-500",
            href: "/dashboard/documentos",
          },
          {
            title: "Notificaciones",
            value: "5",
            hint: "Nuevas notificaciones",
            icon: <Megaphone className="w-6 h-6" />,
            color: "bg-rose-500",
            href: "/dashboard",
          },
        ],
      };
    }

    if (appRole === ROLES.TUTOR) {
      if (internships.length === 0) {
        return {
          cards: [
            {
              title: t.stats.interns,
              value: "0",
              hint: t.stats.noInternships,
              icon: <Users className="w-6 h-6" />,
              color: "bg-blue-500",
            },
            {
              title: t.stats.inProgress,
              value: "0",
              hint: t.stats.noDocs,
              icon: <FileStack className="w-6 h-6" />,
              color: "bg-amber-500",
            },
            {
              title: t.stats.pendingCoord,
              value: "0",
              hint: t.common.approved,
              icon: <FileCheck className="w-6 h-6" />,
              color: "bg-indigo-500",
            },
            {
              title: t.stats.plannedHours,
              value: "0",
              hint: t.stats.noHours,
              icon: <Clock className="w-6 h-6" />,
              color: "bg-emerald-500",
            },
          ],
        };
      }

      const enRevision = internships.reduce(
        (acc, i) => acc + countDocsByStatus(i.documents, "EN_REVISION_TUTOR"),
        0,
      );
      const aprobadosTutor = internships.reduce(
        (acc, i) => acc + countDocsByStatus(i.documents, "APROBADO_TUTOR"),
        0,
      );
      const pendientes = internships.reduce(
        (acc, i) => acc + countDocsByStatus(i.documents, "PENDIENTE"),
        0,
      );
      const hours = internships.reduce((acc, i) => acc + (Number(i.totalHours) || 0), 0);

      return {
        cards: [
          {
            title: t.stats.interns,
            value: String(internships.length),
            hint: t.stats.interns,
            icon: <Users className="w-6 h-6" />,
            color: "bg-blue-500",
            href: "/tutor-academico/estudiantes",
          },
          {
            title: t.stats.inProgress,
            value: String(enRevision),
            hint: t.stats.inProgress,
            icon: <FileStack className="w-6 h-6" />,
            color: "bg-amber-500",
            href: "/dashboard/documentos",
          },
          {
            title: t.stats.pendingCoord,
            value: String(aprobadosTutor),
            hint: t.stats.pendingCoord,
            icon: <FileCheck className="w-6 h-6" />,
            color: "bg-indigo-500",
            href: "/dashboard/documentos",
          },
           {
            title: t.stats.plannedHours,
            value: hours.toLocaleString(t.common.language === 'es' ? 'es-EC' : 'en-US'),
            hint: t.stats.pending,
            icon: <Clock className="w-6 h-6" />,
            color: "bg-emerald-500",
            href: "/tutor-academico/asistencia",
          },
        ],
      };
    }

    if (appRole === ROLES.EMPRESA) {
      const safeInternships = Array.isArray(internships) ? internships : [];
      const activeCount = safeInternships.filter((i) => i.status === "En Proceso" || i.status === "Activo").length;
      const testEnabledCount = safeInternships.filter((i) => i.testEnabled).length;
      const evaluatedCount = safeInternships.filter((i) => i.evaluation).length;
      const totalHours = safeInternships.reduce((acc, i) => {
        const worked = i.attendances?.length ? i.attendances.reduce((s: number, a: any) => {
          if (!a.checkOut) return s;
          const diff = (new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 3600000;
          return s + diff;
        }, 0) : 0;
        return acc + worked;
      }, 0);

      return {
        cards: [
          {
            title: "Pasantes Activos",
            value: String(activeCount),
            hint: `${safeInternships.length} asignados`,
            icon: <Users className="w-6 h-6" />,
            color: "bg-blue-500",
            href: "/empresa/dashboard",
          },
          {
            title: "Horas Trabajadas",
            value: `${totalHours.toFixed(0)}h`,
            hint: "Acumulado total",
            icon: <Clock className="w-6 h-6" />,
            color: "bg-amber-500",
            href: "/empresa/dashboard",
          },
          {
            title: "Pruebas Habilitadas",
            value: String(testEnabledCount),
            hint: "Listas para evaluar",
            icon: <FileText className="w-6 h-6" />,
            color: "bg-indigo-500",
            href: "/empresa/dashboard",
          },
          {
            title: "Alumnos Evaluados",
            value: String(evaluatedCount),
            hint: "Evaluaciones completadas",
            icon: <CheckCircle2 className="w-6 h-6" />,
            color: "bg-emerald-500",
            href: "/empresa/dashboard",
          },
        ],
      };
    }

    return { cards: [] };
  }, [appRole, internships, agreementsCount, adminStats, globalStats, t]);

  const recentAttendances = useMemo(() => {
    return flattenRecentAttendances(internships, 6, t);
  }, [internships, t]);

  const activityTitle =
    appRole === ROLES.ESTUDIANTE
      ? t.dashboard.activityTitleStudent
      : t.dashboard.activityTitle;

  const activityEmpty =
    appRole === ROLES.ESTUDIANTE
      ? t.dashboard.activityEmptyStudent
      : t.dashboard.activityEmpty;

  const verTodoHref =
    appRole === ROLES.ESTUDIANTE
      ? "/dashboard/asistencia"
      : appRole === ROLES.TUTOR
        ? "/tutor-academico/estudiantes"
        : "/coordinador/estudiantes";

  return (
    <div className="space-y-8 md:space-y-12">
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black text-brand-blue tracking-tight leading-tight">
            {t.dashboard.greeting}{" "}
            <span className="text-brand-blue/60 font-medium">
              {user?.fullName?.split(" ")[0] || "Mariana"}!
            </span>
          </h2>
          <p className="text-slate-500 font-medium mt-1 text-sm">
            Aquí tienes un resumen de la actividad en tu cuenta.
          </p>

        </div>


        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {appRole === ROLES.COORDINADOR && (
            <>
              <div className="relative flex-1 sm:flex-none min-w-[200px]">
                <select
                  value={selectedCareerId}
                  onChange={(e) => setSelectedCareerId(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-[10px] font-black text-brand-blue uppercase tracking-widest appearance-none focus:outline-none focus:ring-2 focus:ring-brand-gold/20"

                >
                  <option value="">{t.dashboard.allInstitution}</option>
                  {careers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-xs font-bold text-slate-600 disabled:opacity-50 flex-1 sm:flex-none"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 text-[#C5A059]" />
                )}
                <span>{t.dashboard.masterReport}</span>
              </button>
            </>
          )}
          
          <div className="hidden sm:flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 ml-auto lg:ml-0">
            <div className="px-4 py-2 flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", loading ? "bg-amber-400" : error ? "bg-rose-500" : "bg-emerald-500")} />
              <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap", loading ? "text-amber-600" : error ? "text-rose-600" : "text-emerald-600")}>
                {loading ? t.dashboard.syncing : error ? t.dashboard.apiError : t.dashboard.dataOk}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Anuncios Globales (Carrusel Compacto) */}
      <div className="relative group" data-tour="dashboard-announcements">
        <AnimatePresence mode="wait">
          {announcements.length > 0 && (() => {
            const visibleAnnouncements = announcements.filter(a => !closedAnnouncements.includes(a.id));
            if (visibleAnnouncements.length === 0) return null;

            // Estado para el carrusel interno
            return (
              <AnnouncementCarousel 
                items={visibleAnnouncements} 
                onClose={(id) => setClosedAnnouncements([...closedAnnouncements, id])}
                t={t}
              />
            );
          })()}
        </AnimatePresence>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-rose-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Dashboard Stats Grid */}
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            data-tour="dashboard-stats"
          >
            {stats.cards.map((card, idx) => (
              <StatCard 
                key={idx} 
                {...card} 
                className="h-full"
                isMain={false}
              />
            ))}
          </div>

          {/* Alertas de Acción Requerida (Proactive) */}
          {appRole === ROLES.ESTUDIANTE && internships.length > 0 && (
            <div className="space-y-4 mb-12">
              {internships[0].documents?.some((d: any) => d.status?.includes('RECHAZADO')) && (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-rose-50 border border-rose-100 rounded-3xl p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white text-rose-500 rounded-2xl shadow-sm shrink-0">
                       <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-rose-900 font-black uppercase text-xs tracking-widest">{t.dashboard.alerts.rejectedDocs}</h4>
                       <p className="text-rose-800/70 text-sm font-medium">{t.dashboard.alerts.rejectedDesc}</p>
                    </div>
                  </div>
                  <Link 
                    href="/dashboard/documentos"
                    className="px-6 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all text-center sm:shrink-0"
                  >
                    {t.dashboard.alerts.viewObservations}
                  </Link>
                </motion.div>
              )}
              {internships[0].attendances?.some(a => !a.checkOut) && (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-amber-50 border border-amber-100 rounded-3xl p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white text-amber-500 rounded-2xl shadow-sm shrink-0">
                       <Clock className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-amber-900 font-black uppercase text-xs tracking-widest">{t.dashboard.alerts.incompleteAttendance}</h4>
                       <p className="text-amber-800/70 text-sm font-medium">{t.dashboard.alerts.incompleteDesc}</p>
                    </div>
                  </div>
                  <Link 
                    href="/dashboard/asistencia"
                    className="px-6 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all text-center sm:shrink-0"
                  >
                    {t.dashboard.alerts.closeAttendance}
                  </Link>
                </motion.div>
              )}
            </div>
          )}
          {appRole === ROLES.ESTUDIANTE && internships.length > 0 && (
            <StudentRoadmap internship={internships[0]} />
          )}


          {appRole === ROLES.ESTUDIANTE && internships.length > 0 && (
            <section className="grid md:grid-cols-3 gap-6 md:gap-8">
              <div 
                className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden"
                data-tour="dashboard-attendance-card"
              >
                <div className="flex flex-col h-full justify-between gap-8">
                  <div>
                    <h3 className="text-lg font-black text-brand-blue uppercase tracking-tight mb-6">Resumen de tu práctica</h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.common.company}</p>
                        <p className="text-sm font-black text-brand-blue">{internships[0]?.company?.name || "ISTPET"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Área / Departamento</p>
                        <p className="text-sm font-black text-brand-blue">Área Técnica</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.dashboard.startDate}</p>
                        <p className="text-sm font-black text-brand-blue">---</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fin estimado</p>
                        <p className="text-sm font-black text-brand-blue">---</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 pt-4 border-t border-slate-50">
                    <div className="flex-1 w-full">
                       <div className="flex items-center justify-between mb-2">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progreso general</p>
                         <span className="text-sm font-black text-brand-gold">65%</span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-brand-gold rounded-full" style={{ width: '65%' }} />
                       </div>
                    </div>
                    <Link 
                      href="/dashboard/asistencia"
                      className="px-6 py-2.5 border-2 border-brand-blue text-brand-blue rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all text-center sm:shrink-0"
                    >
                      Ver detalles
                    </Link>
                  </div>
                </div>
              </div>

              <div 
                className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm"
                data-tour="dashboard-hours-card"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-brand-blue uppercase tracking-tight">Próximos trámites</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Informe de actividades', date: 'Entrega antes del 25/06/2024' },
                    { label: 'Evaluación de la entidad', date: 'Entrega antes del 30/06/2024' },
                    { label: 'Plan de trabajo', date: 'Entrega antes del 05/07/2024' }
                  ].map((task, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center text-slate-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-brand-blue uppercase tracking-tight">{task.label}</p>
                          <p className="text-[9px] font-medium text-slate-400">{task.date}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold">
                        Pendiente
                      </span>
                    </div>
                  ))}
                </div>
                <Link 
                  href="/dashboard/documentos" 
                  className="block text-center mt-6 text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline"
                >
                  Ver todos los trámites
                </Link>
              </div>
            </section>
          )}

          {appRole === ROLES.ESTUDIANTE && internships.length > 0 && (
            <section className="grid md:grid-cols-3 gap-6 md:gap-8 mt-12">
              <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-brand-blue uppercase tracking-tight mb-6">Documentos recientes</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Informe de actividades - Abril', date: 'Subido el 20/05/2024' },
                    { name: 'Plan de trabajo actualizado', date: 'Subido el 15/05/2024' }
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center text-slate-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-brand-blue uppercase tracking-tight">{doc.name}</p>
                          <p className="text-[9px] font-medium text-slate-400">{doc.date}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        PDF
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-brand-blue uppercase tracking-tight">Calendario</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mayo 2024</span>
                </div>
                {/* Placeholder simple para el calendario mockup */}
                <div className="grid grid-cols-7 gap-2 text-center">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                    <span key={d} className="text-[9px] font-bold text-slate-300 uppercase">{d}</span>
                  ))}
                  {[29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                    <span key={n} className={cn(
                      "text-[10px] font-black py-2 rounded-lg transition-colors",
                      n === 10 ? "bg-brand-blue text-white" : "text-slate-400 hover:bg-slate-50"
                    )}>{n}</span>
                  ))}
                </div>
              </div>
            </section>
          )}


          {(appRole === ROLES.ADMIN || appRole === ROLES.COORDINADOR) && globalStats && (
            <div className="space-y-6 mb-12">
               {globalStats.pendingDocs > 0 && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm"
                >
                  <div className="flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
                    <div className="w-16 h-16 flex items-center justify-center text-indigo-600 shrink-0">
                      <FileStack className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-indigo-900 tracking-tight">Control de Gestión</h4>
                      <p className="text-sm text-indigo-700/70 font-medium">Hay <span className="font-black text-indigo-600">{globalStats.pendingDocs} documentos</span> esperando su validación técnica.</p>
                    </div>
                  </div>
                  <Link 
                    href="/dashboard/documentos"
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                  >
                    Revisar Expedientes
                  </Link>
                </motion.div>
               )}

              <section 
                className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group"
                data-tour="dashboard-analytics"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <BarChart3 className="w-32 h-32 text-[#003366]" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 text-brand-gold">
                      <PieChart className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight">{t.dashboard.analytics.title}</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-12">
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2 text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">{t.dashboard.analytics.docsProgress}</span>
                          <span className="text-emerald-600">
                            {Math.round((globalStats.approvedDocs / (globalStats.approvedDocs + globalStats.pendingDocs || 1)) * 100)}%
                          </span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(globalStats.approvedDocs / (globalStats.approvedDocs + globalStats.pendingDocs || 1)) * 100}%` }}
                            className="h-full bg-emerald-500 rounded-full"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 font-medium">{t.dashboard.analytics.docsHint}</p>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2 text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">{t.dashboard.analytics.hoursProgress}</span>
                          <span className="text-[#003366]">
                            {Math.round((globalStats.totalCompletedHours / (globalStats.totalPlannedHours || 1)) * 100)}%
                          </span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(globalStats.totalCompletedHours / (globalStats.totalPlannedHours || 1)) * 100}%` }}
                            className="h-full bg-[#003366] rounded-full"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 font-medium">{t.dashboard.analytics.hoursHint}</p>
                      </div>
                    </div>

                    <div className="lg:col-span-2 grid sm:grid-cols-3 gap-6">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all cursor-default">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Completadas</p>
                        <p className="text-3xl font-black text-[#003366]">{globalStats.completedInternships}</p>
                        <div className="w-full h-1 bg-emerald-100 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[40%]" />
                        </div>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all cursor-default">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">En ejecución</p>
                        <p className="text-3xl font-black text-[#003366]">{globalStats.activeInternships}</p>
                        <div className="w-full h-1 bg-blue-100 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-blue-500 w-[70%]" />
                        </div>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all cursor-default">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Alumnos</p>
                        <p className="text-3xl font-black text-[#003366]">{globalStats.totalStudents}</p>
                        <div className="w-full h-1 bg-amber-100 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-amber-500 w-[100%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnalyticsOverview stats={globalStats} />
                </div>
              </section>
            </div>
          )}

          {appRole === ROLES.ADMIN && adminStats && (
            <div className="space-y-6 mb-12">
              <section 
                className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <BarChart3 className="w-32 h-32 text-indigo-900" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 text-indigo-600">
                      <PieChart className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Salud del Sistema</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                        <div className="flex justify-between mb-2 text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">Distribución de Usuarios</span>
                        </div>
                        <div className="space-y-3">
                          {adminStats.rolesDistribution.map((item) => (
                            <div key={item.role}>
                              <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter mb-1">
                                <span>{item.role}</span>
                                <span>{item._count}</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full" 
                                  style={{ width: `${Math.min(100, (item._count / adminStats.counters.totalUsers) * 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                       <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.stats.avgLatency}</p>
                          <p className="text-3xl font-black text-indigo-900">{Math.round(adminStats.avgResponseTime)}ms</p>
                          <p className="text-[9px] text-emerald-500 font-bold mt-1">ÓPTIMO</p>
                       </div>
                       <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Errores/24h</p>
                          <p className={cn("text-3xl font-black", adminStats.counters.errorsToday > 0 ? "text-rose-600" : "text-emerald-600")}>
                            {adminStats.counters.errorsToday}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold mt-1">PROMEDIO ESTABLE</p>
                       </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-5 md:p-8 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight">
                      {activityTitle}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                      {t.dashboard.activitySubtitle || "Ordenados por fecha más reciente"}
                    </p>
                  </div>
                  <Link
                    href={verTodoHref}
                    className="text-xs font-black text-[#C5A059] uppercase tracking-widest hover:text-[#003366] transition-colors"
                  >
                    {t.dashboard.viewAll}
                  </Link>
                </div>
                <div className="p-4 space-y-2">
                  {recentAttendances.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500 font-medium">
                      {activityEmpty}
                    </p>
                  ) : (
                    recentAttendances.map((a) => (
                      <ActivityRow
                        key={a.key}
                        name={a.studentName}
                        company={a.companyName}
                        status={a.status}
                        time={a.time}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">
              <div className="bg-gradient-to-br from-[#C5A059] to-[#8E6F36] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <FileCheck className="w-12 h-12 mb-2" />
                  <h3 className="text-2xl font-black tracking-tighter leading-snug">
                    Accesos rápidos
                  </h3>
                  <p className="text-sm text-white/80 font-medium leading-relaxed">
                    Continúa la gestión desde los módulos habilitados para tu rol.
                  </p>
                  <div className="flex flex-col gap-2 pt-2">
                    {appRole === ROLES.ESTUDIANTE && (
                      <>
                        <Link
                          href="/dashboard/documentos"
                          className="w-full py-3.5 bg-white text-[#003366] rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-white/90"
                        >
                          Mis documentos
                        </Link>
                        <Link
                          href="/dashboard/asistencia"
                          className="w-full py-3.5 bg-white/15 border border-white/30 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-white/25"
                        >
                          Asistencia
                        </Link>
                      </>
                    )}
                    {appRole === ROLES.COORDINADOR && (
                      <div className="grid grid-cols-1 gap-3 pt-2">
                        <Link
                          href="/coordinador/estudiantes"
                          className="group w-full p-4 bg-white text-[#003366] rounded-2xl flex items-center justify-between hover:bg-white/95 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 text-blue-600 flex items-center justify-center">
                              <Users className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Gestión Alumnos</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                          href="/coordinador/convenios"
                          className="group w-full p-4 bg-white/10 border border-white/20 text-white rounded-2xl flex items-center justify-between hover:bg-white/20 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 text-white flex items-center justify-center">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Convenios</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                          href="/coordinador/reportes"
                          className="group w-full p-4 bg-slate-900/30 border border-white/5 text-white rounded-2xl flex items-center justify-between hover:bg-black/40 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 text-brand-gold flex items-center justify-center">
                              <BarChart3 className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Módulo Reportes</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    )}
                    {appRole === ROLES.ADMIN && (
                      <div className="grid grid-cols-1 gap-3 pt-2">
                        <Link
                          href="/admin/usuarios"
                          className="group w-full p-4 bg-white text-[#003366] rounded-2xl flex items-center justify-between hover:bg-white/95 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 text-red-600 flex items-center justify-center">
                              <Users className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Gestión Usuarios</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                          href="/admin/configuracion"
                          className="group w-full p-4 bg-white/10 border border-white/20 text-white rounded-2xl flex items-center justify-between hover:bg-white/20 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 text-white flex items-center justify-center">
                              <Settings className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Configuración</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                          href="/admin/logs"
                          className="group w-full p-4 bg-slate-900/30 border border-white/5 text-white rounded-2xl flex items-center justify-between hover:bg-black/40 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 text-brand-gold flex items-center justify-center">
                              <ScrollText className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Logs de Sistema</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    )}
                    {appRole === ROLES.TUTOR && (
                      <Link
                        href="/tutor-academico/dashboard"
                        className="w-full py-3.5 bg-white text-[#003366] rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-white/90"
                      >
                        Panel tutor académico
                      </Link>
                    )}
                    {appRole === ROLES.EMPRESA && (
                      <div className="grid grid-cols-1 gap-3 pt-2 w-full">
                        <Link
                          href="/empresa/dashboard"
                          className="group w-full p-4 bg-white text-[#003366] rounded-2xl flex items-center justify-between hover:bg-white/95 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 text-blue-600 flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-left">Portal Empresa</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                          href="/empresa/asistencia"
                          className="group w-full p-4 bg-white/10 border border-white/20 text-white rounded-2xl flex items-center justify-between hover:bg-white/20 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 text-white flex items-center justify-center shrink-0">
                              <Clock className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-left">Control Asistencia</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* El Copilot de IA ahora es global en DashboardLayout */}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactElement;
  color: string;
  href?: string;
  className?: string;
  isMain?: boolean;
}

function StatCard({ title, value, hint, icon, color, href, className, isMain }: StatCardProps) {
  // Mapeo de colores para gradientes y sombras (glow)
  const colorMap: Record<string, { bg: string, iconColor: string, border: string }> = {
    'bg-blue-500': { bg: 'bg-brand-blue', iconColor: 'text-brand-blue', border: 'border-brand-blue/10' },
    'bg-indigo-500': { bg: 'bg-[#114880]', iconColor: 'text-[#114880]', border: 'border-blue-900/10' },
    'bg-amber-500': { bg: 'bg-brand-gold', iconColor: 'text-brand-gold', border: 'border-brand-gold/10' },
    'bg-emerald-500': { bg: 'bg-[#196098]', iconColor: 'text-[#196098]', border: 'border-blue-700/10' },
    'bg-rose-500': { bg: 'bg-rose-600', iconColor: 'text-rose-600', border: 'border-rose-600/10' },
  };

  const theme = colorMap[color] || colorMap['bg-blue-500'];

  const CardContent = (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      className={cn(
        "bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer h-full flex flex-col justify-between group relative overflow-hidden",
        isMain ? "p-10" : "p-7",
        className
      )}
    >
      {/* Subtle Background pattern for main card */}
      {isMain && (
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
            className: "w-48 h-48 -rotate-12"
          })}
        </div>
      )}

      <div className={cn(
        "flex items-center gap-6",
        isMain ? "flex-col sm:flex-row items-start sm:items-center" : "flex-row"
      )}>
        <div className={cn(
          "flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-125",
          theme.iconColor,
          isMain ? "w-24 h-24" : "w-16 h-16"
        )}>
          {React.cloneElement(icon as React.ReactElement<{ className?: string; strokeWidth?: number }>, {
            className: cn(isMain ? "w-14 h-14" : "w-8 h-8"),
            strokeWidth: 1.5
          })}
        </div>

        <div className="flex flex-col">
          <p className={cn(
            "font-black uppercase tracking-[0.2em] text-slate-400 mb-1",
            isMain ? "text-[11px]" : "text-[9px]"
          )}>
            {title}
          </p>
          <h4 className={cn(
            "font-black text-brand-blue tracking-tighter leading-none",
            isMain ? "text-5xl" : "text-3xl"
          )}>
            {value}
          </h4>
        </div>
      </div>

      <div className={cn(
        "flex items-center justify-between mt-6 pt-6 border-t border-slate-50",
        isMain ? "mt-10 pt-10" : ""
      )}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {hint}
        </p>
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-all">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className={cn("block h-full", className)}>
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}

interface ActivityRowProps {
  name: string;
  company: string;
  status: string;
  time: string;
}

function ActivityRow({ name, company, status, time }: ActivityRowProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 flex items-center justify-center text-xs font-black text-[#003366] shrink-0">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-xs font-black text-slate-600 uppercase tracking-tight">{name}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{company}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
          {status}
        </span>
        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">{time}</p>
      </div>
    </div>
  );
}
