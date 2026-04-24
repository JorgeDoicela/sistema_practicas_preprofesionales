"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  FileCheck,
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { User as UserType } from "@/types/user";
import { ROLES, normalizeApiRoleToAppRole, type Role } from "@/constants/roles";
import { internshipsService } from "@/services/internships.service";
import { agreementsService } from "@/services/agreements.service";
import { reportsService, GlobalStats } from "@/services/reports.service";
import { announcementsService, Announcement } from "@/services/announcements.service";
import { Megaphone, X } from "lucide-react";
import { StudentRoadmap } from "./StudentRoadmap";
import { AICopilot } from "./AICopilot";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { AnalyticsOverview } from "./AnalyticsOverview";
import { attendancesService } from "@/services/attendances.service";
import { settingsService } from "@/services/settings.service";
import { useLanguage } from "@/providers/LanguageProvider";
import dynamic from "next/dynamic";

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
};

function countDocsByStatus(docs: Array<{ status?: string }> | undefined, st: string) {
  return (docs ?? []).filter((d) => d.status === st).length;
}

function isActiveInternship(status: string | undefined) {
  return status === 'EN_CURSO';
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
      if (role === ROLES.ADMIN || role === ROLES.COORDINADOR) {
        const [allRes, agrRes, stats, careerList]: [any, any, any, any] = await Promise.all([
          internshipsService.findAll(1, 20, cId),
          agreementsService.findAll(),
          reportsService.getGlobalStats(cId),
          settingsService.findAllCareers(),
        ]);

        const allItems = allRes?.items || (Array.isArray(allRes?.data) ? allRes.data : (Array.isArray(allRes) ? allRes : []));
        const agrItems = agrRes?.items || (Array.isArray(agrRes?.data) ? agrRes.data : (Array.isArray(agrRes) ? agrRes : []));

        setInternships(allItems);
        setAgreementsCount(Array.isArray(agrItems) ? agrItems.filter((a: any) => (a.status ?? "Activo") === "Activo").length : 0);
        setGlobalStats(stats?.data || stats || null);
        setCareers(Array.isArray(careerList) ? careerList : (Array.isArray(careerList?.data) ? careerList.data : []));
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

      if (role === ROLES.TUTOR_ACADEMICO) {
        const res: any = await internshipsService.findByTutor(u.id);
        const list = res?.items || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
        setInternships(list);
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
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return;
    try {
      const parsed = JSON.parse(savedUser) as UserType & { role: string };
      const roleNorm = normalizeApiRoleToAppRole(parsed.role);
      const merged = { ...parsed, role: roleNorm };
      if (parsed.role !== roleNorm) {
        localStorage.setItem("user", JSON.stringify(merged));
      }
      setUser(merged);
      void loadDashboard(merged, selectedCareerId);
      void loadAnnouncements();
    } catch {
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

    if (appRole === ROLES.ADMIN || appRole === ROLES.COORDINADOR) {
      const agrEmpty = agreementsCount ?? 0;
      if (internships.length === 0) {
        return {
          cards: [
            {
              title: t.stats.activeInternships,
              value: "0",
              hint: t.stats.noAssignment,
              icon: <Users className="w-6 h-6" />,
              color: "bg-blue-500",
            },
            {
              title: t.stats.activeAgreements,
              value: String(agrEmpty),
              hint: t.stats.noAgreements,
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
              value: "—",
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
          },
          {
            title: t.stats.activeAgreements,
            value: String(agr),
            hint: t.stats.noAgreements,
            icon: <Building2 className="w-6 h-6" />,
            color: "bg-indigo-500",
          },
          {
            title: t.stats.completedHours,
            value: globalStats ? `${globalStats.totalCompletedHours}h` : "—",
            hint: globalStats ? `${t.common.back} ${globalStats.totalPlannedHours}h ${t.dashboard.hours.required}` : "—",
            icon: <Clock className="w-6 h-6" />,
            color: "bg-amber-500",
          },
          {
            title: t.stats.pendingDocs,
            value: globalStats ? String(globalStats.pendingDocs) : "—",
            hint: t.stats.pendingCoord,
            icon: <FileCheck className="w-6 h-6" />,
            color: "bg-rose-500",
          },
        ],
      };
    }

    if (appRole === ROLES.ESTUDIANTE) {
      if (internships.length === 0) {
        return {
          cards: [
            {
              title: t.stats.myPractices,
              value: "0",
              hint: t.stats.noAssignment,
              icon: <GraduationCap className="w-6 h-6" />,
              color: "bg-blue-500",
            },
            {
              title: t.stats.programHours,
              value: "—",
              hint: t.stats.noHours,
              icon: <Clock className="w-6 h-6" />,
              color: "bg-amber-500",
            },
            {
              title: t.dashboard.hours.records,
              value: "—",
              hint: t.stats.noDocs,
              icon: <FileStack className="w-6 h-6" />,
              color: "bg-emerald-500",
            },
            {
              title: t.stats.attendance,
              value: "—",
              hint: t.stats.noAttendance,
              icon: <CheckCircle2 className="w-6 h-6" />,
              color: "bg-indigo-500",
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
        : t.stats.noAttendance;

      return {
        cards: [
          {
            title: t.stats.myPractices,
            value: String(internships.length),
            hint: internships.length ? t.stats.myPractices : t.stats.noAssignment,
            icon: <GraduationCap className="w-6 h-6" />,
            color: "bg-blue-500",
          },
          {
            title: t.stats.programHours,
            value: primary ? String(primary.totalHours ?? 0) : "—",
            hint: primary?.company?.name ? `${t.dashboard.company}: ${primary.company.name}` : t.stats.noHours,
            icon: <Clock className="w-6 h-6" />,
            color: "bg-amber-500",
          },
          {
            title: t.stats.documentation,
            value: `${pct}%`,
            hint: `${approved} ${t.common.approved} ${t.common.back} ${total || 0}`,
            icon: <FileStack className="w-6 h-6" />,
            color: "bg-emerald-500",
          },
          {
            title: t.stats.attendance,
            value: incomplete > 0 ? `${incomplete} ${t.stats.pending}` : t.stats.upToDate,
            hint: incomplete > 0 ? t.stats.openPending : t.stats.allClosed,
            icon: <CheckCircle2 className="w-6 h-6" />,
            color: incomplete > 0 ? "bg-rose-500" : "bg-indigo-500",
          },
        ],
      };
    }

    if (appRole === ROLES.TUTOR_ACADEMICO) {
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
          },
          {
            title: t.stats.inProgress,
            value: String(enRevision),
            hint: t.stats.inProgress,
            icon: <FileStack className="w-6 h-6" />,
            color: "bg-amber-500",
          },
          {
            title: t.stats.pendingCoord,
            value: String(aprobadosTutor),
            hint: t.stats.pendingCoord,
            icon: <FileCheck className="w-6 h-6" />,
            color: "bg-indigo-500",
          },
           {
            title: t.stats.plannedHours,
            value: hours.toLocaleString(t.common.language === 'es' ? 'es-EC' : 'en-US'),
            hint: t.stats.pending,
            icon: <Clock className="w-6 h-6" />,
            color: "bg-emerald-500",
          },
        ],
      };
    }

    return { cards: [] };
  }, [appRole, internships, agreementsCount]);

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
      : appRole === ROLES.TUTOR_ACADEMICO
        ? "/tutor-academico/dashboard"
        : "/coordinador/estudiantes";

  return (
    <div className="space-y-8 md:space-y-12">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
            {appRole === ROLES.ESTUDIANTE
              ? t.dashboard.summaryStudent
              : appRole === ROLES.TUTOR_ACADEMICO
                ? t.dashboard.summaryTutor
                : t.dashboard.summaryAdmin}
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">
            {t.dashboard.greeting}{" "}
            <span className="text-slate-400">
              {user?.fullName?.split(" ")[0] || t.dashboard.defaultUser}
            </span>
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            {t.dashboard.liveData}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          {(appRole === ROLES.ADMIN || appRole === ROLES.COORDINADOR) && (
            <>
              <div className="relative">
                <select
                  value={selectedCareerId}
                  onChange={(e) => setSelectedCareerId(e.target.value)}
                  className="pl-4 pr-10 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-xs font-black text-[#003366] uppercase tracking-widest appearance-none focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20"
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
                className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-sm font-bold text-slate-600 disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 text-[#C5A059]" />
                )}
                <span className="hidden sm:inline">{t.dashboard.masterReport}</span>
              </button>
            </>
          )}
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <div className="px-4 py-2 bg-emerald-50 rounded-xl">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                {loading ? t.dashboard.syncing : error ? t.dashboard.apiError : t.dashboard.dataOk}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Anuncios Globales */}
      <AnimatePresence>
        {announcements
          .filter(a => !closedAnnouncements.includes(a.id))
          .map((a) => (
            <motion.div
              key={a.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`relative overflow-hidden group rounded-[2rem] border-l-8 p-6 flex items-start gap-6 shadow-xl ${
                a.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' :
                a.type === 'WARNING' ? 'bg-amber-50 border-amber-500 text-amber-900' :
                a.type === 'DANGER' ? 'bg-rose-50 border-rose-500 text-rose-900' :
                'bg-blue-50 border-blue-500 text-blue-900'
              }`}
            >
              <div className={`p-4 rounded-2xl bg-white shadow-sm flex-shrink-0 ${
                a.type === 'SUCCESS' ? 'text-emerald-500' :
                a.type === 'WARNING' ? 'text-amber-500' :
                a.type === 'DANGER' ? 'text-rose-500' :
                'text-blue-500'
              }`}>
                 <Megaphone className="w-6 h-6" />
              </div>
              <div className="flex-1 pr-10">
                 <h4 className="text-xl font-black tracking-tight leading-none mb-2 uppercase">{a.title}</h4>
                 <p className="text-sm font-medium opacity-80 leading-relaxed">{a.content}</p>
              </div>
              <button 
                onClick={() => setClosedAnnouncements([...closedAnnouncements, a.id])}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors"
              >
                 <X className="w-4 h-4 opacity-40 hover:opacity-100" />
              </button>
            </motion.div>
          ))}
      </AnimatePresence>

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
              <div className="md:col-span-2 bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-6 md:gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight">{t.dashboard.attendance.title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">
                    {todayAttendance?.checkIn 
                      ? todayAttendance.checkOut 
                        ? t.dashboard.attendance.checkInDone
                        : t.dashboard.attendance.checkInActive
                      : t.dashboard.attendance.checkInPending}
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <Link 
                      href="/dashboard/asistencia"
                      className="px-8 py-4 bg-[#003366] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#003366]/90 transition-all text-center"
                    >
                      {todayAttendance?.checkIn ? t.dashboard.attendance.manageExit : t.dashboard.attendance.registerEntry}
                    </Link>
                  </div>
                </div>

                <div className="w-full md:w-[300px] h-[200px] rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner group">
                   <MiniMap 
                     center={loc || { lat: -0.1807, lng: -78.4678 }} 
                     zoom={15} 
                     points={loc ? [loc] : []}
                     radiusM={(internships[0] as any)?.lat && (internships[0] as any)?.lng ? 200 : undefined}
                   />
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#003366] to-[#002244] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white shadow-xl flex flex-col justify-center">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                    <BarChart3 className="w-6 h-6 text-[#C5A059]" />
                 </div>
                 <h4 className="text-xl font-black tracking-tight mb-2">{t.dashboard.hours.title}</h4>
                 <p className="text-sm text-white/60 font-medium mb-4">{t.dashboard.hours.subtitle}</p>
                 {attendanceSummary ? (
                   <>
                     <div className="flex items-end gap-3 mb-4">
                       <span className="text-2xl md:text-4xl font-black text-[#C5A059]">{attendanceSummary.totalHours.toFixed(1)}</span>
                       <span className="text-xs font-bold text-white/40 uppercase mb-2">
                         / {attendanceSummary.requiredHours} h {t.dashboard.hours.required}
                       </span>
                     </div>
                     <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                       <div
                         className="h-full bg-[#C5A059] rounded-full transition-all"
                         style={{ width: `${attendanceSummary.progressPercentage}%` }}
                       />
                     </div>
                     <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                       <span>{attendanceSummary.progressPercentage.toFixed(1)}% {t.dashboard.hours.completed}</span>
                       <span>{attendanceSummary.remainingHours.toFixed(1)} h {t.dashboard.hours.remaining}</span>
                     </div>
                   </>
                 ) : (
                   <div className="flex items-end gap-3">
                     <span className="text-2xl md:text-4xl font-black text-[#C5A059]">{internships[0]?.attendances?.length || 0}</span>
                     <span className="text-xs font-bold text-white/40 uppercase mb-2">{t.dashboard.hours.records}</span>
                   </div>
                 )}
              </div>
            </section>
          )}

          {(appRole === ROLES.ADMIN || appRole === ROLES.COORDINADOR) && globalStats && (
            <section className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <BarChart3 className="w-32 h-32 text-[#003366]" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-brand-gold/10 text-brand-gold rounded-xl">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight">{t.dashboard.analytics.title}</h3>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
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
                        <span className="text-brand-blue">
                          {Math.round((globalStats.totalCompletedHours / (globalStats.totalPlannedHours || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(globalStats.totalCompletedHours / (globalStats.totalPlannedHours || 1)) * 100}%` }}
                          className="h-full bg-brand-blue rounded-full"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 font-medium">{t.dashboard.analytics.hoursHint}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-2 grid sm:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all cursor-default">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Completadas</p>
                       <p className="text-3xl font-black text-brand-blue">{globalStats.completedInternships}</p>
                       <div className="w-full h-1 bg-emerald-100 rounded-full mt-3 overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[40%]" />
                       </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all cursor-default">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">En ejecución</p>
                       <p className="text-3xl font-black text-brand-blue">{globalStats.activeInternships}</p>
                       <div className="w-full h-1 bg-blue-100 rounded-full mt-3 overflow-hidden">
                          <div className="h-full bg-blue-500 w-[70%]" />
                       </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all cursor-default">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Alumnos</p>
                       <p className="text-3xl font-black text-brand-blue">{globalStats.totalStudents}</p>
                       <div className="w-full h-1 bg-amber-100 rounded-full mt-3 overflow-hidden">
                          <div className="h-full bg-amber-500 w-[100%]" />
                       </div>
                    </div>
                  </div>
                </div>

                <AnalyticsOverview stats={globalStats} />
              </div>
            </section>
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
                    {(appRole === ROLES.ADMIN || appRole === ROLES.COORDINADOR) && (
                      <>
                        <Link
                          href="/coordinador/estudiantes"
                          className="w-full py-3.5 bg-white text-[#003366] rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-white/90"
                        >
                          Gestión de estudiantes
                        </Link>
                        <Link
                          href="/coordinador/convenios"
                          className="w-full py-3.5 bg-white/15 border border-white/30 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-white/25"
                        >
                          Convenios
                        </Link>
                        <Link
                          href="/coordinador/reportes"
                          className="w-full py-3.5 bg-slate-900/40 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-black/40"
                        >
                          Módulo de Reportes
                        </Link>
                      </>
                    )}
                    {appRole === ROLES.TUTOR_ACADEMICO && (
                      <Link
                        href="/tutor-academico/dashboard"
                        className="w-full py-3.5 bg-white text-[#003366] rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-white/90"
                      >
                        Panel tutor académico
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Copilot de IA para Estudiantes */}
      {appRole === ROLES.ESTUDIANTE && (
        <AICopilot user={user} internship={internships.find(i => isActiveInternship(i.status)) ?? internships[0]} />
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactElement;
  color: string;
}

function StatCard({ title, value, hint, icon, color }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-slate-800`}>
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
            className: `w-6 h-6 ${color.replace("bg-", "text-")}`,
          })}
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tighter break-words">{value}</h4>
      <p className="text-[10px] font-semibold text-slate-500 mt-3 leading-relaxed">{hint}</p>
    </motion.div>
  );
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
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-[#003366]">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-xs font-black text-slate-600 uppercase tracking-tight">{name}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{company}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
          {status}
        </span>
        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">{time}</p>
      </div>
    </div>
  );
}
