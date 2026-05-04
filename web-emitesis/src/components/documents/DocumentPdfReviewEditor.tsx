"use client";

import * as React from "react";
import { SpecialZoomLevel, Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import {
  highlightPlugin,
  Trigger,
  type HighlightArea,
  type RenderHighlightContentProps,
  type RenderHighlightTargetProps,
  type RenderHighlightsProps,
} from "@react-pdf-viewer/highlight";
import { Highlighter, Strikethrough, Trash2, MessageSquareText } from "lucide-react";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";

import type {
  PdfReviewAnnotationItem,
  PdfReviewAnnotationsPayload,
} from "@/lib/pdf-review-annotations";

const PDFJS_WORKER = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

function areaStyle(
  kind: "highlight" | "strike",
  base: React.CSSProperties,
): React.CSSProperties {
  if (kind === "strike") {
    return {
      ...base,
      background:
        "linear-gradient(transparent calc(50% - 0.06em), rgba(220, 38, 38, 0.75) calc(50% - 0.06em), rgba(220, 38, 38, 0.75) calc(50% + 0.06em), transparent calc(50% + 0.06em))",
      mixBlendMode: "multiply" as const,
    };
  }
  return {
    ...base,
    background: "rgba(250, 204, 21, 0.38)",
  };
}

function HighlightPopover(props: RenderHighlightContentProps & { onAdd: (item: PdfReviewAnnotationItem) => void }) {
  const [comment, setComment] = React.useState("");
  const [kind, setKind] = React.useState<"highlight" | "strike">("highlight");

  const add = () => {
    const id =
      typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID
        ? globalThis.crypto.randomUUID()
        : `ann-${Date.now()}`;
    props.onAdd({
      id,
      kind,
      comment: comment.trim(),
      quote: props.selectedText,
      highlightAreas: props.highlightAreas.map((a) => ({ ...a })),
    });
    props.cancel();
  };

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
      style={{ maxWidth: 320, zIndex: 50 }}
    >
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#C5A059]">
        Nueva anotación
      </p>
      <p className="mb-3 line-clamp-3 text-xs text-slate-600">&ldquo;{props.selectedText}&rdquo;</p>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setKind("highlight")}
          className={`flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-black uppercase tracking-wide ${
            kind === "highlight"
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          <Highlighter className="h-3.5 w-3.5" />
          Resaltar
        </button>
        <button
          type="button"
          onClick={() => setKind("strike")}
          className={`flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-black uppercase tracking-wide ${
            kind === "strike"
              ? "border-rose-300 bg-rose-50 text-rose-800"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          <Strikethrough className="h-3.5 w-3.5" />
          Tachar
        </button>
      </div>
      <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">
        Comentario (opcional)
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Ej.: corregir redacción, citar norma…"
        className="mb-3 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#003366]"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={props.cancel}
          className="flex-1 rounded-lg border border-slate-200 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={add}
          className="flex-1 rounded-lg bg-[#003366] py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#003366]/90"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

export function DocumentPdfReviewEditor({
  fileUrl,
  initialItems,
  onItemsChange,
  readonly: readonlyProp,
}: {
  fileUrl: string | null | undefined;
  initialItems: PdfReviewAnnotationItem[];
  onItemsChange?: (payload: PdfReviewAnnotationsPayload) => void;
  readonly?: boolean;
}) {
  const readonly = readonlyProp ?? !onItemsChange;
  const [notes, setNotes] = React.useState<PdfReviewAnnotationItem[]>(() =>
    initialItems.map((n) => ({
      ...n,
      highlightAreas: n.highlightAreas.map((a) => ({ ...a })),
    })),
  );

  React.useEffect(() => {
    if (onItemsChange) {
      onItemsChange({ version: 1, items: notes });
    }
  }, [notes, onItemsChange]);

  const renderHighlightTarget = React.useCallback((props: RenderHighlightTargetProps) => {
    if (readonly) return <></>;
    return (
      <div
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-md"
        style={{
          position: "absolute",
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top}%`,
          transform: "translate(0, 8px)",
          zIndex: 40,
        }}
      >
        <button
          type="button"
          onClick={props.toggle}
          className="flex items-center gap-1.5 rounded-md bg-[#C5A059] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white hover:opacity-95"
        >
          <MessageSquareText className="h-3.5 w-3.5" />
          Anotar
        </button>
        <button
          type="button"
          onClick={props.cancel}
          className="px-2 py-1 text-[9px] font-bold uppercase text-slate-400 hover:text-slate-600"
        >
          Cerrar
        </button>
      </div>
    );
  }, [readonly]);

  const renderHighlightContent = React.useCallback((props: RenderHighlightContentProps) => (
    <HighlightPopover
      {...props}
      onAdd={(item) => setNotes((prev) => [...prev, item])}
    />
  ), []);

  const renderHighlights = React.useCallback((props: RenderHighlightsProps) => (
    <div>
      {notes.map((note) => {
        const highlightAreas = note.highlightAreas.filter(
          (area) => area.pageIndex === props.pageIndex && area.width > 0,
        );
        if (!highlightAreas.length) return null;

        return (
          <React.Fragment key={note.id}>
            {highlightAreas.map((area, idx) => (
              <div
                key={`${note.id}-${idx}`}
                style={areaStyle(
                  note.kind,
                  props.getCssProperties(area as HighlightArea, props.rotation),
                )}
              />
            ))}
          </React.Fragment>
        );
      })}
    </div>
  ), [notes]);

  const highlightPluginInstance = highlightPlugin({
    trigger: Trigger.TextSelection,
    renderHighlightTarget,
    renderHighlightContent,
    renderHighlights,
  });

  const { jumpToHighlightArea } = highlightPluginInstance;

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const removeNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  if (!fileUrl) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        No hay archivo PDF cargado para este documento.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {!readonly && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Seleccione texto en el PDF y pulse <span className="text-[#003366]">Anotar</span> para resaltar, tachar o
          añadir un comentario al fragmento.
        </p>
      )}
      {readonly && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
          Modo lectura — correcciones del tutor resaltadas en el documento
        </p>
      )}
      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner">
        <Worker workerUrl={PDFJS_WORKER}>
          <div className="h-[650px]" style={{ "--scale-factor": "1" } as React.CSSProperties}>
            <Viewer
              fileUrl={fileUrl}
              plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
              defaultScale={SpecialZoomLevel.PageFit}
            />
          </div>
        </Worker>
      </div>
      {notes.length > 0 && (
        <div className="max-h-36 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Anotaciones ({notes.length})</p>
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-white bg-white px-3 py-2 text-xs shadow-sm"
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  const first = note.highlightAreas[0];
                  if (first) jumpToHighlightArea(first as HighlightArea);
                }}
              >
                <span className="flex items-center gap-1 font-black text-[#003366]">
                  {note.kind === "strike" ? (
                    <Strikethrough className="h-3 w-3 shrink-0 text-rose-500" />
                  ) : (
                    <Highlighter className="h-3 w-3 shrink-0 text-amber-600" />
                  )}
                  <span className="truncate">{note.quote || "(fragmento)"}</span>
                </span>
                {note.comment ? (
                  <span className="mt-0.5 line-clamp-2 block text-[11px] text-slate-500">{note.comment}</span>
                ) : null}
              </button>
              {!readonly && (
                <button
                  type="button"
                  onClick={() => removeNote(note.id)}
                  className="shrink-0 rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                  aria-label="Eliminar anotación"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
