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
} from "lucide-react";
import { motion } from "framer-motion";
import { User as UserType } from "@/types/user";
import { ROLES, normalizeApiRoleToAppRole, type Role } from "@/constants/roles";
import { internshipsService } from "@/services/internships.service";
import { agreementsService } from "@/services/agreements.service";
import { reportsService, GlobalStats } from "@/services/reports.service";

type InternshipRow = {
  id: string;
  status?: string;
  totalHours?: number;
  student?: { fullName?: string };
  company?: { name?: string };
  documents?: Array<{ status?: string }>;
  attendances?: Array<{ id: string; checkIn: string; checkOut?: string | null }>;
};

function isActiveInternship(status: string | undefined) {
  const s = (status ?? "").trim();
  if (!s) return true;
  return s !== "Completado" && s !== "Finalizado";
}

function countDocsByStatus(docs: Array<{ status?: string }> | undefined, st: string) {
  return (docs ?? []).filter((d) => d.status === st).length;
}

function flattenRecentAttendances(internships: InternshipRow[], limit: number) {
  const rows: {
    key: string;
    studentName: string;
    companyName: string;
    status: string;
    time: string;
    sort: number;
  }[] = [];

  for (const i of internships) {
    const stu = i.student?.fullName ?? "Estudiante";
    const comp = i.company?.name ?? "—";
    for (const a of i.attendances ?? []) {
      const t = a.checkOut ? new Date(a.checkOut) : new Date(a.checkIn);
      rows.push({
        key: a.id,
        studentName: stu,
        companyName: comp,
        status: a.checkOut ? "Entrada y salida" : "Registro de entrada",
        time: t.toLocaleString("es-EC", {
          dateStyle: "short",
          timeStyle: "short",
        }),
        sort: t.getTime(),
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

  const loadDashboard = useCallback(async (u: UserType & { role: string }) => {
    const role = normalizeApiRoleToAppRole(u.role);
    setAppRole(role);
    setLoading(true);
    setError(null);

    try {
      if (role === ROLES.ADMIN || role === ROLES.COORDINADOR) {
        const [all, agr, stats] = await Promise.all([
          internshipsService.findAll() as Promise<InternshipRow[]>,
          agreementsService.findAll() as Promise<Array<{ status?: string }>>,
          reportsService.getGlobalStats(),
        ]);
        setInternships(Array.isArray(all) ? all : []);
        setAgreementsCount((agr ?? []).filter((a) => (a.status ?? "Activo") === "Activo").length);
        setGlobalStats(stats);
        return;
      }

      if (role === ROLES.ESTUDIANTE) {
        const list = (await internshipsService.findByStudent(u.id)) as InternshipRow[];
        setInternships(Array.isArray(list) ? list : []);
        setAgreementsCount(null);
        return;
      }

      if (role === ROLES.TUTOR_ACADEMICO) {
        const list = (await internshipsService.findByTutor(u.id)) as InternshipRow[];
        setInternships(Array.isArray(list) ? list : []);
        setAgreementsCount(null);
        return;
      }

      setInternships([]);
      setAgreementsCount(null);
    } catch (e: unknown) {
      setError((e as Error).message || "No se pudieron cargar los datos del tablero.");
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
      void loadDashboard(merged);
    } catch {
      setLoading(false);
    }
  }, [loadDashboard]);

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
              title: "Pasantías activas",
              value: "0",
              hint: "Sin asignaciones registradas",
              icon: <Users className="w-6 h-6" />,
              color: "bg-blue-500",
            },
            {
              title: "Convenios activos",
              value: String(agrEmpty),
              hint: "Convenios con estado Activo",
              icon: <Building2 className="w-6 h-6" />,
              color: "bg-indigo-500",
            },
            {
              title: "Horas planificadas",
              value: "0",
              hint: "Suma de horas por asignación",
              icon: <Clock className="w-6 h-6" />,
              color: "bg-amber-500",
            },
            {
              title: "Documentación",
              value: "—",
              hint: "Sin documentos en expedientes",
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
            title: "Pasantías activas",
            value: String(active),
            hint: `${internships.length} totales en el sistema`,
            icon: <Users className="w-6 h-6" />,
            color: "bg-blue-500",
          },
          {
            title: "Convenios activos",
            value: String(agr),
            hint: "Convenios con estado Activo",
            icon: <Building2 className="w-6 h-6" />,
            color: "bg-indigo-500",
          },
          {
            title: "Horas cumplidas",
            value: globalStats ? `${globalStats.totalCompletedHours}h` : "—",
            hint: globalStats ? `De ${globalStats.totalPlannedHours}h planificadas` : "Suma de todas las horas",
            icon: <Clock className="w-6 h-6" />,
            color: "bg-amber-500",
          },
          {
            title: "Docs. Pendientes",
            value: globalStats ? String(globalStats.pendingDocs) : "—",
            hint: "Esperando revisión de coordinación",
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
              title: "Mis prácticas",
              value: "0",
              hint: "Aún no tienes una asignación registrada",
              icon: <GraduationCap className="w-6 h-6" />,
              color: "bg-blue-500",
            },
            {
              title: "Horas del programa",
              value: "—",
              hint: "Aparecerán cuando exista tu práctica",
              icon: <Clock className="w-6 h-6" />,
              color: "bg-amber-500",
            },
            {
              title: "Expediente",
              value: "—",
              hint: "Sin documentos que mostrar",
              icon: <FileStack className="w-6 h-6" />,
              color: "bg-emerald-500",
            },
            {
              title: "Asistencia",
              value: "—",
              hint: "Registra entrada desde el módulo de asistencia",
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
      const lastAtt = primary?.attendances?.[0];
      const attLabel = lastAtt
        ? new Date(lastAtt.checkOut ?? lastAtt.checkIn).toLocaleString("es-EC", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "Sin registros";

      return {
        cards: [
          {
            title: "Mis prácticas",
            value: String(internships.length),
            hint: internships.length ? "Asignaciones registradas" : "Sin asignación aún",
            icon: <GraduationCap className="w-6 h-6" />,
            color: "bg-blue-500",
          },
          {
            title: "Horas del programa",
            value: primary ? String(primary.totalHours ?? 0) : "—",
            hint: primary?.company?.name ? `Empresa: ${primary.company.name}` : "Detalle de tu plan",
            icon: <Clock className="w-6 h-6" />,
            color: "bg-amber-500",
          },
          {
            title: "Expediente",
            value: `${pct}%`,
            hint: `${approved} documentos con aprobación definitiva de ${total || 0}`,
            icon: <FileStack className="w-6 h-6" />,
            color: "bg-emerald-500",
          },
          {
            title: "Última asistencia",
            value: lastAtt ? "Registrada" : "—",
            hint: attLabel,
            icon: <CheckCircle2 className="w-6 h-6" />,
            color: "bg-indigo-500",
          },
        ],
      };
    }

    if (appRole === ROLES.TUTOR_ACADEMICO) {
      if (internships.length === 0) {
        return {
          cards: [
            {
              title: "Pasantes a cargo",
              value: "0",
              hint: "No tienes asignaciones como tutor",
              icon: <Users className="w-6 h-6" />,
              color: "bg-blue-500",
            },
            {
              title: "En tu revisión",
              value: "0",
              hint: "Documentos en revisión tutor",
              icon: <FileStack className="w-6 h-6" />,
              color: "bg-amber-500",
            },
            {
              title: "Pend. coordinación",
              value: "0",
              hint: "Aprobados por tutor",
              icon: <FileCheck className="w-6 h-6" />,
              color: "bg-indigo-500",
            },
            {
              title: "Horas planificadas",
              value: "0",
              hint: "Suma de horas de tus pasantías",
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
            title: "Pasantes a cargo",
            value: String(internships.length),
            hint: "Asignaciones donde eres tutor académico",
            icon: <Users className="w-6 h-6" />,
            color: "bg-blue-500",
          },
          {
            title: "En tu revisión",
            value: String(enRevision),
            hint: "Documentos en estado En revisión tutor",
            icon: <FileStack className="w-6 h-6" />,
            color: "bg-amber-500",
          },
          {
            title: "Pend. coordinación",
            value: String(aprobadosTutor),
            hint: "Aprobados por tutor (siguiente paso: coordinación)",
            icon: <FileCheck className="w-6 h-6" />,
            color: "bg-indigo-500",
          },
          {
            title: "Horas planificadas",
            value: hours.toLocaleString("es-EC"),
            hint: `${pendientes} documentos en estado Pendiente (tus pasantes)`,
            icon: <Clock className="w-6 h-6" />,
            color: "bg-emerald-500",
          },
        ],
      };
    }

    return { cards: [] };
  }, [appRole, internships, agreementsCount]);

  const activities = useMemo(
    () => flattenRecentAttendances(internships, 8),
    [internships],
  );

  const activityTitle =
    appRole === ROLES.ESTUDIANTE
      ? "Mis últimos registros de asistencia"
      : "Actividad reciente en el sistema";

  const activityEmpty =
    appRole === ROLES.ESTUDIANTE
      ? "Aún no hay registros de asistencia en tu práctica, o tu asignación no incluye historial."
      : "No hay registros de asistencia recientes para mostrar.";

  const verTodoHref =
    appRole === ROLES.ESTUDIANTE
      ? "/dashboard/asistencia"
      : appRole === ROLES.TUTOR_ACADEMICO
        ? "/tutor-academico/dashboard"
        : "/coordinador/estudiantes";

  return (
    <div className="space-y-12">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
            {appRole === ROLES.ESTUDIANTE
              ? "Tu espacio"
              : appRole === ROLES.TUTOR_ACADEMICO
                ? "Resumen académico"
                : "Resumen institucional"}
          </span>
          <h2 className="text-4xl font-black text-[#003366] tracking-tight">
            Hola,{" "}
            <span className="text-slate-400">
              {user?.fullName?.split(" ")[0] || "Usuario"}
            </span>
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            Datos en vivo desde la plataforma de prácticas preprofesionales ISTPET.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="px-4 py-2 bg-emerald-50 rounded-xl">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              {loading ? "Sincronizando…" : error ? "Revisa la API" : "Datos actualizados"}
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-rose-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
          <Loader2 className="w-10 h-10 text-[#003366] animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest">Cargando métricas…</p>
        </div>
      ) : (
        <>
          <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.cards.map((c) => (
              <StatCard
                key={c.title}
                title={c.title}
                value={c.value}
                hint={c.hint}
                icon={c.icon}
                color={c.color}
              />
            ))}
          </section>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight">
                      {activityTitle}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                      Ordenados por fecha más reciente
                    </p>
                  </div>
                  <Link
                    href={verTodoHref}
                    className="text-xs font-black text-[#C5A059] uppercase tracking-widest hover:text-[#003366] transition-colors"
                  >
                    Ir al detalle
                  </Link>
                </div>
                <div className="p-4 space-y-2">
                  {activities.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500 font-medium">
                      {activityEmpty}
                    </p>
                  ) : (
                    activities.map((a) => (
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

            <div className="space-y-8">
              <div className="bg-gradient-to-br from-[#C5A059] to-[#8E6F36] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
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
      <h4 className="text-3xl font-black text-[#003366] tracking-tighter">{value}</h4>
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
