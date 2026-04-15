"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, ChevronRight, Sparkles, X } from "lucide-react";
import { normalizeApiRoleToAppRole, type Role } from "@/constants/roles";
import { getDashboardTourSteps } from "@/lib/dashboard-tour-config";

type Rect = { top: number; left: number; width: number; height: number };

type Placement = "top" | "bottom" | "left" | "right";

type PopoverLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
  placement: Placement;
  lineFrom: { x: number; y: number };
  lineTo: { x: number; y: number };
};

const CARD_W_MAX = 400;
const CARD_H = 300;
const GAP = 28;
const VIEW_PAD = 16;
const HOLE_PAD = 4;

function readRole(): Role {
  if (typeof window === "undefined") return "ESTUDIANTE";
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return normalizeApiRoleToAppRole(String(u?.role ?? ""));
  } catch {
    return "ESTUDIANTE";
  }
}

function measure(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el || !(el instanceof HTMLElement)) return null;
  el.scrollIntoView({ block: "nearest", behavior: "instant" as ScrollBehavior });
  const r = el.getBoundingClientRect();
  const pad = 10;
  return {
    top: r.top - pad,
    left: r.left - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** AABB: la tarjeta `a` toca o solapa el foco `b` (margen de seguridad) */
function rectsOverlap(
  a: { left: number; top: number; width: number; height: number },
  b: Rect,
  pad: number,
): boolean {
  const ax1 = a.left - pad;
  const ay1 = a.top - pad;
  const ax2 = a.left + a.width + pad;
  const ay2 = a.top + a.height + pad;
  const bx1 = b.left;
  const by1 = b.top;
  const bx2 = b.left + b.width;
  const by2 = b.top + b.height;
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

function buildLayout(
  placement: Placement,
  left: number,
  top: number,
  cardW: number,
  cardH: number,
  rect: Rect,
): PopoverLayout {
  const rcx = rect.left + rect.width / 2;
  const rcy = rect.top + rect.height / 2;
  let lineFrom = { x: 0, y: 0 };
  let lineTo = { x: rcx, y: rcy };
  switch (placement) {
    case "right":
      lineFrom = { x: left, y: top + cardH / 2 };
      lineTo = { x: rect.left + rect.width, y: rcy };
      break;
    case "left":
      lineFrom = { x: left + cardW, y: top + cardH / 2 };
      lineTo = { x: rect.left, y: rcy };
      break;
    case "bottom":
      lineFrom = { x: left + cardW / 2, y: top };
      lineTo = { x: rcx, y: rect.top + rect.height };
      break;
    case "top":
      lineFrom = { x: left + cardW / 2, y: top + cardH };
      lineTo = { x: rcx, y: rect.top };
      break;
  }
  return { left, top, width: cardW, height: cardH, placement, lineFrom, lineTo };
}

/**
 * Coloca la tarjeta sin tapar el área resaltada: prueba lados y, si hace falta,
 * desplaza la tarjeta a la derecha del bloque (típico con barra lateral ancha).
 */
function computePopoverLayout(rect: Rect): PopoverLayout {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const cardW = Math.min(CARD_W_MAX, vw - VIEW_PAD * 2);
  const cardH = CARD_H;
  const rcx = rect.left + rect.width / 2;
  const rcy = rect.top + rect.height / 2;
  /* Margen extra: la insignia de flecha sobresale ~24px del borde de la tarjeta */
  const margin = 28;

  const tryPlacement = (placement: Placement): PopoverLayout | null => {
    let left = 0;
    let top = 0;
    switch (placement) {
      case "right": {
        if (vw - (rect.left + rect.width) - VIEW_PAD < cardW + GAP) return null;
        left = rect.left + rect.width + GAP;
        top = clamp(rcy - cardH / 2, VIEW_PAD, vh - cardH - VIEW_PAD);
        break;
      }
      case "left": {
        if (rect.left - VIEW_PAD < cardW + GAP) return null;
        left = rect.left - GAP - cardW;
        top = clamp(rcy - cardH / 2, VIEW_PAD, vh - cardH - VIEW_PAD);
        break;
      }
      case "bottom": {
        if (vh - (rect.top + rect.height) - VIEW_PAD < cardH + GAP) return null;
        top = rect.top + rect.height + GAP;
        left = clamp(rcx - cardW / 2, VIEW_PAD, vw - cardW - VIEW_PAD);
        if (rectsOverlap({ left, top, width: cardW, height: cardH }, rect, margin)) {
          left = rect.left + rect.width + GAP;
          if (left + cardW > vw - VIEW_PAD) return null;
        }
        break;
      }
      case "top": {
        if (rect.top - VIEW_PAD < cardH + GAP) return null;
        top = rect.top - GAP - cardH;
        top = clamp(top, VIEW_PAD, vh - cardH - VIEW_PAD);
        left = clamp(rcx - cardW / 2, VIEW_PAD, vw - cardW - VIEW_PAD);
        if (rectsOverlap({ left, top, width: cardW, height: cardH }, rect, margin)) {
          left = rect.left + rect.width + GAP;
          if (left + cardW > vw - VIEW_PAD) return null;
        }
        break;
      }
    }
    const box = { left, top, width: cardW, height: cardH };
    if (rectsOverlap(box, rect, margin)) return null;
    return buildLayout(placement, left, top, cardW, cardH, rect);
  };

  for (const p of ["right", "left", "bottom", "top"] as const) {
    const L = tryPlacement(p);
    if (L) return L;
  }

  /* Último recurso: a la derecha del foco o, si no cabe, esquina inferior derecha */
  const leftPreferred = rect.left + rect.width + GAP;
  const left = clamp(leftPreferred, VIEW_PAD, Math.max(VIEW_PAD, vw - cardW - VIEW_PAD));
  const top = clamp(vh - cardH - VIEW_PAD, VIEW_PAD, vh - cardH - VIEW_PAD);
  return buildLayout("right", left, top, cardW, cardH, rect);
}

function lineEndTrimmed(
  from: { x: number; y: number },
  to: { x: number; y: number },
  trimPx: number,
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < trimPx + 8) return to;
  const u = (len - trimPx) / len;
  return { x: from.x + dx * u, y: from.y + dy * u };
}

/** Oscurece solo el exterior del rectángulo: el interior queda 100 % transparente al contenido real */
function DimAroundHole({ rect }: { rect: Rect }) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;
  if (!vw || !vh) return null;
  const t = Math.max(0, rect.top - HOLE_PAD);
  const l = Math.max(0, rect.left - HOLE_PAD);
  const w = rect.width + HOLE_PAD * 2;
  const h = rect.height + HOLE_PAD * 2;
  const dim = "fixed z-[200] bg-slate-950/60 pointer-events-auto";

  return (
    <>
      <div className={dim} style={{ top: 0, left: 0, width: vw, height: t }} aria-hidden />
      <div className={dim} style={{ top: t, left: 0, width: l, height: h }} aria-hidden />
      <div className={dim} style={{ top: t, left: l + w, width: Math.max(0, vw - l - w), height: h }} aria-hidden />
      <div
        className={dim}
        style={{
          top: t + h,
          left: 0,
          width: vw,
          height: Math.max(0, vh - t - h),
        }}
        aria-hidden
      />
    </>
  );
}

function CardArrowBadge({ placement }: { placement: Placement }) {
  const base =
    "absolute flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C5A059] to-amber-700 text-white shadow-lg shadow-amber-900/30";
  const pos =
    placement === "right"
      ? "left-0 top-1/2 -translate-x-[calc(50%+6px)] -translate-y-1/2"
      : placement === "left"
        ? "right-0 top-1/2 translate-x-[calc(50%+6px)] -translate-y-1/2"
        : placement === "bottom"
          ? "left-1/2 top-0 -translate-x-1/2 -translate-y-[calc(50%+6px)]"
          : "bottom-0 left-1/2 -translate-x-1/2 translate-y-[calc(50%+6px)]";

  const rotate =
    placement === "right"
      ? "rotate-180"
      : placement === "left"
        ? ""
        : placement === "bottom"
          ? "-rotate-90"
          : "rotate-90";

  return (
    <div className={`${base} ${pos} z-10`}>
      <ChevronRight className={`h-6 w-6 ${rotate}`} strokeWidth={2.5} />
    </div>
  );
}

export function DashboardTour() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>("ESTUDIANTE");
  const [rect, setRect] = useState<Rect | null>(null);
  const [layout, setLayout] = useState<PopoverLayout | null>(null);

  const steps = useMemo(() => getDashboardTourSteps(role), [role]);

  useEffect(() => {
    setMounted(true);
    setRole(readRole());
    const onStorage = () => setRole(readRole());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const updateRect = useCallback(() => {
    if (!open || step >= steps.length) {
      setRect(null);
      setLayout(null);
      return;
    }
    const s = steps[step];
    const r = measure(s.selector);
    setRect(r);
  }, [open, step, steps]);

  useLayoutEffect(() => {
    updateRect();
  }, [updateRect]);

  useLayoutEffect(() => {
    if (!open || !rect || rect.width <= 0 || rect.height <= 0) {
      setLayout(null);
      return;
    }
    setLayout(computePopoverLayout(rect));
  }, [open, rect, step]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => updateRect(), 100);
    const onResize = () => updateRect();
    const onScroll = () => updateRect();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, updateRect]);

  const start = () => {
    setRole(readRole());
    setStep(0);
    setOpen(true);
  };

  const skip = () => {
    setOpen(false);
    setStep(0);
    setRect(null);
    setLayout(null);
  };

  const next = () => {
    if (step >= steps.length - 1) {
      skip();
      return;
    }
    setStep((s) => s + 1);
  };

  if (!mounted) return null;

  const current = open ? steps[step] : null;
  const isLast = step === steps.length - 1;

  const tourUi =
    open &&
    current &&
    createPortal(
      <div
        className="pointer-events-auto fixed inset-0 z-[200]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-desc"
      >
        {rect && rect.width > 0 && rect.height > 0 ? (
          <DimAroundHole rect={rect} />
        ) : (
          <div className="fixed inset-0 z-[200] bg-slate-950/55" aria-hidden />
        )}

        {rect && rect.width > 0 && rect.height > 0 && (
          <motion.div
            key={`spot-${step}-${current.id}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="pointer-events-none fixed z-[201] rounded-2xl border-[3px] border-[#C5A059] shadow-[0_0_0_1px_rgba(254,243,199,0.5),0_12px_40px_-8px_rgba(197,160,89,0.45)]"
            style={{
              top: rect.top - HOLE_PAD,
              left: rect.left - HOLE_PAD,
              width: rect.width + HOLE_PAD * 2,
              height: rect.height + HOLE_PAD * 2,
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-2xl border border-white/50"
              animate={{ opacity: [0.4, 0.95, 0.4] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -inset-px rounded-[15px] border-2 border-amber-200/70"
              animate={{ opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}

        {layout && rect && (() => {
          const end = lineEndTrimmed(layout.lineFrom, layout.lineTo, 16);
          return (
            <svg className="pointer-events-none fixed inset-0 z-[201] h-full w-full" aria-hidden>
              <defs>
                <linearGradient id="tour-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f4e4bc" />
                  <stop offset="50%" stopColor="#C5A059" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
                <filter id="tour-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <marker
                  id="tour-arrowhead"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="6"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L12,6 L0,12 L3,6 z" fill="#C5A059" stroke="#fef3c7" strokeWidth="0.5" />
                </marker>
              </defs>
              <motion.line
                key={`ln-${step}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                x1={layout.lineFrom.x}
                y1={layout.lineFrom.y}
                x2={end.x}
                y2={end.y}
                stroke="url(#tour-line-grad)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray="10 6"
                filter="url(#tour-glow)"
                markerEnd="url(#tour-arrowhead)"
              />
            </svg>
          );
        })()}

        {!rect && (
          <p className="fixed left-1/2 top-24 z-[203] max-w-md -translate-x-1/2 rounded-2xl border border-amber-200/80 bg-amber-50/95 px-5 py-3 text-center text-xs text-amber-950 shadow-lg">
            No se encontró el elemento de esta ayuda. Use <strong>Siguiente</strong> u <strong>Omitir</strong>.
          </p>
        )}

        {layout && (
          <motion.div
            key={`card-${step}`}
            layout
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="fixed z-[203] max-h-[min(58vh,360px)] overflow-visible"
            style={{
              left: layout.left,
              top: layout.top,
              width: layout.width,
            }}
          >
            <CardArrowBadge placement={layout.placement} />

            <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-gradient-to-br from-white via-white to-slate-50/95 p-0.5 shadow-[0_25px_60px_-12px_rgba(0,51,102,0.35)]">
              <div className="flex max-h-[min(58vh,360px)] flex-col rounded-[22px] bg-gradient-to-br from-[#003366]/5 via-transparent to-[#C5A059]/10 px-6 pb-6 pt-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#003366] to-[#0a4d8c] text-[#f4e4bc] shadow-inner">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#C5A059]">
                          Recorrido guiado
                        </p>
                        <span className="rounded-full bg-[#003366]/10 px-2 py-0.5 text-[9px] font-black text-[#003366]">
                          {step + 1} / {steps.length}
                        </span>
                      </div>
                      <h2 id="tour-title" className="mt-1 text-xl font-black tracking-tight text-[#003366]">
                        {current.title}
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={skip}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Cerrar ayuda"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    id="tour-desc"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-[4rem] flex-1 overflow-y-auto border-l-4 border-[#C5A059]/80 pl-4 pr-1 text-sm leading-relaxed text-slate-600"
                  >
                    {current.getDescription(role).split("**").map((chunk, i) =>
                      i % 2 === 1 ? (
                        <strong key={i} className="font-bold text-[#003366]">
                          {chunk}
                        </strong>
                      ) : (
                        <span key={i}>{chunk}</span>
                      ),
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100/80 pt-5">
                  <div className="flex items-center gap-2" aria-hidden>
                    {steps.map((s, i) => (
                      <motion.span
                        key={s.id}
                        layout
                        className="h-2 rounded-full shadow-sm"
                        initial={false}
                        animate={{
                          width: i === step ? 24 : 8,
                          scale: i === step ? 1 : 0.92,
                          backgroundColor: i === step ? "#003366" : i < step ? "#C5A059" : "#e2e8f0",
                        }}
                        transition={{ type: "spring", stiffness: 450, damping: 28 }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={skip}
                      className="rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-100"
                    >
                      Omitir
                    </button>
                    <button
                      type="button"
                      onClick={next}
                      className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#003366] to-[#0a4d8c] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-[#003366]/25 transition hover:brightness-110"
                    >
                      {isLast ? "Finalizar" : "Siguiente"}
                      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>,
      document.body,
    );

  return (
    <>
      {!open && (
        <motion.button
          type="button"
          onClick={start}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          className="fixed bottom-6 right-6 z-[90] flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-2xl bg-gradient-to-br from-[#003366] via-[#0a4d8c] to-[#003366] text-white shadow-[0_12px_40px_-8px_rgba(0,51,102,0.55)] ring-2 ring-[#C5A059]/50 ring-offset-2 ring-offset-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C5A059]"
          aria-label="Abrir recorrido de ayuda del panel"
          title="Ayuda: recorrido con flechas"
        >
          <HelpCircle className="h-7 w-7" strokeWidth={2} />
          <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#C5A059] text-[9px] font-black text-[#003366] shadow-md">
            ?
          </span>
        </motion.button>
      )}
      {tourUi}
    </>
  );
}
