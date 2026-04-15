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
  Upload,
} from "lucide-react";
import {
  documentTemplatesService,
  type DocumentTemplate,
} from "@/services/document-templates.service";
import { cn } from "@/lib/utils";
import { labelForDocxKey } from "@/lib/docx-template-labels";

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

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const handleUploadBlank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setError(null);
    try {
      const { key } = await documentTemplatesService.uploadBlankDocx(uploadFile);
      setUploadFile(null);
      await load();
      alert(
        `Archivo guardado como «${key}». Ya puede elegirlo en el desplegable «Formato .docx» de cada plantilla o al crear una nueva.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
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

  const formatSelectOptions = (
    <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold">
      <option value="">— Sin formato descargable —</option>
      {knownKeys.map((k) => (
        <option key={k} value={k}>
          {labelForDocxKey(k)} ({k})
        </option>
      ))}
    </select>
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="mb-2 flex items-center gap-3 text-[#003366]">
              <div className="rounded-2xl bg-[#003366]/10 p-2.5">
                <FileText className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">Plantillas de documentos</h1>
            </div>
            <p className="max-w-2xl text-sm text-slate-600">
              Aquí define <strong>qué documentos</strong> se generan en cada práctica, el <strong>orden</strong>, si son{" "}
              <strong>obligatorios</strong> y qué <strong>archivo Word en blanco</strong> descarga el estudiante (si
              aplica). Debe haber exactamente <strong>una</strong> plantilla activa marcada como{" "}
              <strong>ranura de certificado de culminación</strong> (el PDF oficial lo genera el sistema al finalizar).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
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
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Actualizar
            </button>
          </div>
        </motion.div>

        <div className="rounded-3xl border border-sky-200 bg-sky-50/80 px-5 py-4 text-sm text-sky-950">
          <p className="font-bold text-sky-900">¿Dónde se suben los formatos .docx?</p>
          <p className="mt-2 leading-relaxed text-sky-900/90">
            Use el recuadro <strong>«Subir formato Word (.docx)»</strong> de abajo. El archivo queda registrado con un{" "}
            <strong>nombre técnico</strong> (letras minúsculas y guiones bajos) y aparecerá en los desplegables para
            vincularlo a cada ítem del catálogo. Si solo elige entre los que ya vienen en el sistema, no hace falta
            subir nada nuevo.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleUploadBlank}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#003366]">
            <Upload className="h-4 w-4" />
            Subir formato Word (.docx)
          </h2>
          <p className="text-xs leading-relaxed text-slate-600">
            Máximo 20 MB. El nombre del archivo se normaliza (ej. <code className="rounded bg-slate-100 px-1">Mi Plan.docx</code> →{" "}
            <code className="rounded bg-slate-100 px-1">mi_plan.docx</code>). Después de subir, elija esa clave en la
            tabla o al crear una plantilla nueva.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Archivo
              </label>
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#003366] file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-wider file:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={uploading || !uploadFile}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C5A059] px-6 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Subir a formatos
            </button>
          </div>
        </motion.form>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleCreate}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#003366]">
            <Plus className="h-4 w-4" />
            Nueva plantilla
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
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
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
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
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Formato .docx descargable por el estudiante
              </label>
              <select
                value={newBlank}
                onChange={(e) => setNewBlank(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
              >
                <option value="">— Sin formato descargable —</option>
                {knownKeys.map((k) => (
                  <option key={k} value={k}>
                    {labelForDocxKey(k)} ({k})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700">
              <input type="checkbox" checked={newRequired} onChange={(e) => setNewRequired(e.target.checked)} />
              Obligatorio para certificación
            </label>
            <label
              className="flex max-w-md cursor-pointer items-start gap-2 text-xs font-bold text-slate-700"
              title="Una sola plantilla activa puede ser la ranura donde el sistema coloca el certificado generado al culminar la práctica."
            >
              <input type="checkbox" checked={newCert} onChange={(e) => setNewCert(e.target.checked)} className="mt-0.5" />
              <span>
                Es la <strong>ranura del certificado de culminación</strong> (no es un Word que sube el estudiante: el
                sistema genera el PDF al cerrar la práctica)
              </span>
            </label>
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#003366] px-6 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Crear
            </button>
          </div>
        </motion.form>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Catálogo ({items.length})
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Cambie el formato en la columna «Word en blanco» y el valor se guarda al elegir otra opción.
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-[#003366]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-4 py-3">Orden</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="min-w-[220px] px-4 py-3" title="Archivo .docx que el estudiante descarga como guía">
                      Word en blanco
                    </th>
                    <th className="px-4 py-3" title="Si el estudiante debe entregar este documento para poder certificar">
                      Obligatorio
                    </th>
                    <th
                      className="px-4 py-3"
                      title="Marcar solo en la plantilla que representa el certificado generado por el sistema al finalizar la práctica"
                    >
                      Ranura certificado
                    </th>
                    <th className="px-4 py-3">Activo</th>
                    <th className="w-24 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((t) => (
                    <tr
                      key={t.id}
                      className={cn("hover:bg-slate-50/80", !t.isActive && "bg-slate-50/50 opacity-60")}
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
                      <td className="max-w-[220px] px-4 py-3 font-semibold text-slate-800">
                        <span className="break-words">{t.name}</span>
                        {savingId === t.id && (
                          <Loader2 className="ml-2 inline h-3 w-3 animate-spin text-[#003366]" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue={t.blankFileKey ?? ""}
                          key={`${t.id}-blank-${t.blankFileKey ?? ""}-${knownKeys.length}`}
                          disabled={t.isCertificateSlot}
                          title={
                            t.isCertificateSlot
                              ? "El certificado lo genera el sistema; no lleva plantilla Word descargable."
                              : "Elija el .docx de formato o suba uno nuevo arriba"
                          }
                          onChange={(e) => {
                            const v = e.target.value.trim() || null;
                            void patch(t.id, { blankFileKey: v });
                          }}
                          className="max-w-[280px] truncate rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">— Sin formato —</option>
                          {knownKeys.map((k) => (
                            <option key={k} value={k}>
                              {labelForDocxKey(k)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={t.isRequired}
                          disabled={t.isCertificateSlot}
                          onChange={(e) => void patch(t.id, { isRequired: e.target.checked })}
                          className="rounded border-slate-300"
                          title={
                            t.isCertificateSlot
                              ? "El certificado no cuenta como entrega obligatoria previa"
                              : "Documento obligatorio para certificación"
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={t.isCertificateSlot}
                          onChange={(e) => void patch(t.id, { isCertificateSlot: e.target.checked })}
                          className="rounded border-slate-300"
                          title="Ranura del certificado de culminación (PDF generado por el sistema)"
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
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400"
                          title={t.isCertificateSlot ? "Use desactivar en lugar de eliminar" : "Eliminar"}
                        >
                          <Trash2 className="h-4 w-4" />
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
