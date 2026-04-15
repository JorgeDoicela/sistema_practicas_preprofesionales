"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  AlertCircle,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  documentTemplatesService,
  type DocumentTemplate,
} from "@/services/document-templates.service";
import { cn } from "@/lib/utils";

export default function PlantillasDocumentosPage() {
  const [items, setItems] = useState<DocumentTemplate[]>([]);
  const [knownKeys, setKnownKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(true);

  const [newName, setNewName] = useState("");
  const [newSort, setNewSort] = useState("100");
  const [newBlank, setNewBlank] = useState("");
  const [newRequired, setNewRequired] = useState(true);
  const [newCert, setNewCert] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [list, keys] = await Promise.all([
        documentTemplatesService.findAll(showInactive),
        documentTemplatesService.knownFormatKeys(),
      ]);
      setItems(list);
      setKnownKeys(keys);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (id: string, body: Partial<DocumentTemplate>) => {
    setSavingId(id);
    setError(null);
    try {
      await documentTemplatesService.update(id, body);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSavingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await documentTemplatesService.create({
        name: newName.trim(),
        sortOrder: Number(newSort) || 0,
        isActive: true,
        isRequired: newRequired,
        isCertificateSlot: newCert,
        blankFileKey: newBlank.trim() || null,
      });
      setNewName("");
      setNewSort("100");
      setNewBlank("");
      setNewRequired(true);
      setNewCert(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (t: DocumentTemplate) => {
    if (t.isCertificateSlot) {
      alert(
        "La ranura de certificado no se elimina. Desactívela o cree otra plantilla marcada como certificado y luego elimine esta si ya no tiene prácticas vinculadas.",
      );
      return;
    }
    if (!confirm(`¿Eliminar la plantilla «${t.name}»? Solo se permite si ninguna práctica antigua la referencia.`)) {
      return;
    }
    try {
      await documentTemplatesService.remove(t.id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 text-[#003366] mb-2">
              <div className="p-2.5 rounded-2xl bg-[#003366]/10">
                <FileText className="w-7 h-7" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Plantillas de documentos
              </h1>
            </div>
            <p className="text-sm text-slate-600 max-w-xl">
              Define qué documentos se crean en cada nueva práctica, si son obligatorios u opcionales,
              el orden y qué archivo .docx sirve de formato (si aplica). Debe existir exactamente{" "}
              <strong>una</strong> plantilla activa marcada como certificado de cierre.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-slate-300"
              />
              Ver inactivas
            </label>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Actualizar
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleCreate}
          className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4"
        >
          <h2 className="text-sm font-black text-[#003366] uppercase tracking-widest flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva plantilla
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Nombre del documento
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
                placeholder="Ej. Carta de aceptación"
                maxLength={200}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Orden (menor = primero)
              </label>
              <input
                type="number"
                min={0}
                value={newSort}
                onChange={(e) => setNewSort(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Archivo .docx de formato (opcional)
              </label>
              <select
                value={newBlank}
                onChange={(e) => setNewBlank(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold bg-white"
              >
                <option value="">— Sin formato descargable —</option>
                {knownKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 items-center">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
              />
              Obligatorio para certificación
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newCert}
                onChange={(e) => setNewCert(e.target.checked)}
              />
              Es ranura de certificado (PDF generado al culminar)
            </label>
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="ml-auto inline-flex items-center gap-2 bg-[#003366] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear
            </button>
          </div>
        </motion.form>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Catálogo ({items.length})
            </h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[#003366]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-4 py-3">Ord.</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">.docx</th>
                    <th className="px-4 py-3">Oblig.</th>
                    <th className="px-4 py-3">Cert.</th>
                    <th className="px-4 py-3">Activo</th>
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((t) => (
                    <tr
                      key={t.id}
                      className={cn(
                        "hover:bg-slate-50/80",
                        !t.isActive && "opacity-60 bg-slate-50/50",
                      )}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          defaultValue={t.sortOrder}
                          key={`${t.id}-${t.sortOrder}`}
                          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold"
                          onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (!Number.isFinite(v) || v === t.sortOrder) return;
                            void patch(t.id, { sortOrder: v });
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 max-w-[220px]">
                        <span className="break-words">{t.name}</span>
                        {savingId === t.id && (
                          <Loader2 className="inline w-3 h-3 animate-spin ml-2 text-[#003366]" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-[160px] truncate">
                        {t.blankFileKey || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={t.isRequired}
                          disabled={t.isCertificateSlot}
                          onChange={(e) => void patch(t.id, { isRequired: e.target.checked })}
                          className="rounded border-slate-300"
                          title={t.isCertificateSlot ? "El certificado no cuenta como entrega obligatoria previa" : ""}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={t.isCertificateSlot}
                          onChange={(e) => void patch(t.id, { isCertificateSlot: e.target.checked })}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={t.isActive}
                          onChange={(e) => void patch(t.id, { isActive: e.target.checked })}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void handleDelete(t)}
                          disabled={t.isCertificateSlot}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:text-slate-400"
                          title={t.isCertificateSlot ? "Use desactivar en lugar de eliminar" : "Eliminar"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
