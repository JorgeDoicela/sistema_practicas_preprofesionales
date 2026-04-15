export type PdfHighlightArea = {
  pageIndex: number;
  top: number;
  left: number;
  height: number;
  width: number;
};

export type PdfReviewAnnotationItem = {
  id: string;
  kind: "highlight" | "strike";
  comment: string;
  quote: string;
  highlightAreas: PdfHighlightArea[];
};

export type PdfReviewAnnotationsPayload = { version: 1; items: PdfReviewAnnotationItem[] };

function isArea(a: unknown): a is PdfHighlightArea {
  if (!a || typeof a !== "object") return false;
  const x = a as Record<string, unknown>;
  return (
    typeof x.pageIndex === "number" &&
    typeof x.top === "number" &&
    typeof x.left === "number" &&
    typeof x.height === "number" &&
    typeof x.width === "number"
  );
}

/** Normaliza lo guardado en BD (JSON) para el visor y el envío de revisiones */
export function parseReviewAnnotations(raw: unknown): PdfReviewAnnotationsPayload {
  if (raw == null || typeof raw !== "object") return { version: 1, items: [] };
  const obj = raw as { items?: unknown };
  if (!Array.isArray(obj.items)) return { version: 1, items: [] };
  const items: PdfReviewAnnotationItem[] = [];
  for (const entry of obj.items) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const id = typeof e.id === "string" ? e.id : globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    const kind = e.kind === "strike" ? "strike" : "highlight";
    const comment = typeof e.comment === "string" ? e.comment : "";
    const quote = typeof e.quote === "string" ? e.quote : "";
    const areas = Array.isArray(e.highlightAreas) ? e.highlightAreas.filter(isArea) : [];
    if (areas.length === 0) continue;
    items.push({ id, kind, comment, quote, highlightAreas: areas });
  }
  return { version: 1, items };
}
