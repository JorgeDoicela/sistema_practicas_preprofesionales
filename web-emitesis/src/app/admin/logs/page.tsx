"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  ScrollText,
} from "lucide-react";
import {
  systemLogsService,
  type SystemLogRow,
} from "@/services/system-logs.service";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-EC", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

function levelBadge(level: string) {
  const base =
    "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider";
  if (level === "ERROR")
    return cn(base, "bg-red-100 text-red-800 border border-red-200");
  if (level === "WARN")
    return cn(base, "bg-amber-100 text-amber-900 border border-amber-200");
  return cn(base, "bg-slate-100 text-slate-700 border border-slate-200");
}

export default function AdminSystemLogsPage() {
  const [rows, setRows] = useState<SystemLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(40);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await systemLogsService.findPage({
        page,
        limit,
        level: levelFilter || undefined,
        category: categoryFilter || undefined,
      });
      setRows(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, levelFilter, categoryFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 text-[#003366] mb-2">
              <div className="p-2.5 rounded-2xl bg-[#003366]/10">
                <ScrollText className="w-7 h-7" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Registro de actividad
              </h1>
            </div>
            <p className="text-sm text-slate-600 max-w-xl">
              Historial de peticiones y eventos registrados en el sistema. Solo
              el rol administrador puede consultar esta información.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
              <Filter className="w-4 h-4" />
              Filtros
            </div>
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
            >
              <option value="">Nivel (todos)</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
            >
              <option value="">Categoría (todas)</option>
              <option value="HTTP">HTTP</option>
              <option value="AUTH">AUTH</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </div>
        </motion.div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Entradas
            </p>
            <p className="text-xs font-bold text-slate-600">
              Total: <span className="text-[#003366]">{total}</span>
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-[#003366]" />
              <span className="text-sm font-semibold">Cargando registros…</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm font-medium">
              No hay registros con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-4 py-3 whitespace-nowrap">Fecha</th>
                    <th className="px-4 py-3 whitespace-nowrap">Nivel</th>
                    <th className="px-4 py-3 whitespace-nowrap">Cat.</th>
                    <th className="px-4 py-3 min-w-[200px]">Mensaje</th>
                    <th className="px-4 py-3 whitespace-nowrap">Usuario</th>
                    <th className="px-4 py-3 whitespace-nowrap">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium text-xs">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={levelBadge(row.level)}>
                          {row.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600">
                        {row.category}
                      </td>
                      <td className="px-4 py-3 text-slate-800 text-xs leading-relaxed max-w-xl">
                        <span className="break-all">{row.message}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-[180px]">
                        {row.user?.fullName ? (
                          <span className="block truncate font-semibold text-slate-800">
                            {row.user.fullName}
                          </span>
                        ) : null}
                        <span className="block truncate text-slate-500">
                          {row.actorEmail || row.user?.email || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                        {row.ip || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && rows.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500 font-medium">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
