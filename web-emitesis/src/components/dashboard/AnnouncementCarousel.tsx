"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Announcement } from "@/services/announcements.service";
import { cn } from "@/lib/utils";

interface AnnouncementCarouselProps {
  items: Announcement[];
  onClose: (id: string) => void;
  t: any;
}

export function AnnouncementCarousel({ items, onClose, t }: AnnouncementCarouselProps) {
  const [index, setIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Announcement | null>(null);

  // Auto-rotación cada 8 segundos
  useEffect(() => {
    if (items.length <= 1 || selectedItem) return; // Pausar si hay un modal abierto
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length, selectedItem]);

  const next = () => setIndex((prev) => (prev + 1) % items.length);
  const prev = () => setIndex((prev) => (prev - 1 + items.length) % items.length);

  const current = items[index];
  if (!current) return null;

  return (
    <div className="relative group/carousel mb-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          onClick={() => setSelectedItem(current)}
          className={cn(
            "relative overflow-hidden rounded-[2.5rem] border border-white/40 p-5 md:p-6 flex items-center gap-6 shadow-xl transition-all cursor-pointer hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] h-28 md:h-32 backdrop-blur-md group",
            current.type === 'SUCCESS' ? 'bg-gradient-to-r from-emerald-50/90 to-emerald-100/50 text-emerald-950' :
            current.type === 'WARNING' ? 'bg-gradient-to-r from-amber-50/90 to-amber-100/50 text-amber-950' :
            current.type === 'DANGER' ? 'bg-gradient-to-r from-rose-50/90 to-rose-100/50 text-rose-950' :
            'bg-gradient-to-r from-blue-50/90 to-blue-100/50 text-blue-950'
          )}
        >
          {/* Decorative Gradient Glow */}
          <div className={cn(
            "absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20",
            current.type === 'SUCCESS' ? 'bg-emerald-400' :
            current.type === 'WARNING' ? 'bg-amber-400' :
            current.type === 'DANGER' ? 'bg-rose-400' :
            'bg-blue-400'
          )} />
          <div className={cn(
            "w-12 h-12 flex items-center justify-center shrink-0 transition-transform group-hover:scale-125 duration-500",
            current.type === 'SUCCESS' ? 'text-emerald-600' :
            current.type === 'WARNING' ? 'text-amber-600' :
            current.type === 'DANGER' ? 'text-rose-600' :
            'text-blue-600'
          )}>
             <Megaphone className="w-7 h-7 md:w-8 md:h-8" />
          </div>

          <div className="flex-1 pr-12 min-w-0 z-10">
             <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">
                   {t.dashboard.announcement ?? 'Anuncio'} {index + 1} de {items.length}
                </span>
             </div>
             <h4 className="text-sm md:text-lg font-black tracking-tight leading-tight uppercase truncate mb-1.5">
                {current.title}
             </h4>
             <p className="text-[11px] font-bold opacity-60 line-clamp-2 leading-relaxed tracking-wide">
                {current.content}
             </p>
          </div>

          {/* Botón cerrar */}
          <button 
            onClick={(e) => {
               e.stopPropagation();
               onClose(current.id);
               if (index >= items.length - 1) setIndex(Math.max(0, items.length - 2));
            }}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors"
          >
             <X className="w-4 h-4 opacity-30 hover:opacity-100" />
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Controles de navegación */}
      {items.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute -left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white rounded-full shadow-lg border border-slate-100 opacity-0 group-hover/carousel:opacity-100 transition-all hover:scale-110 z-10"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute -right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white rounded-full shadow-lg border border-slate-100 opacity-0 group-hover/carousel:opacity-100 transition-all hover:scale-110 z-10"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>

          {/* Dots */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {items.map((_, i) => (
                <button 
                   key={i}
                   onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                   className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      i === index ? 'w-10 bg-brand-blue' : 'w-2 bg-slate-300 hover:bg-slate-400'
                   )}
                />
             ))}
          </div>
        </>
      )}

      {/* Modal para ver el anuncio completo */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-100 overflow-hidden"
            >
              {/* Subtle background glow for modal */}
              <div className={cn(
                "absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-10",
                selectedItem.type === 'SUCCESS' ? 'bg-emerald-400' :
                selectedItem.type === 'WARNING' ? 'bg-amber-400' :
                selectedItem.type === 'DANGER' ? 'bg-rose-400' :
                'bg-blue-400'
              )} />

              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-8 right-8 p-3 rounded-full hover:bg-slate-50 transition-all z-20 group"
              >
                <X className="w-5 h-5 text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
              </button>
              
              <div className={cn(
                "inline-flex mb-8 relative z-10",
                selectedItem.type === 'SUCCESS' ? 'text-emerald-500' :
                selectedItem.type === 'WARNING' ? 'text-amber-500' :
                selectedItem.type === 'DANGER' ? 'text-rose-500' :
                'text-blue-500'
              )}>
                <Megaphone className="w-12 h-12" />
              </div>
              
              <div className="relative z-10">
                <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4">
                  {t.dashboard.announcement ?? 'Comunicado Oficial'}
                </span>
                <h3 className="text-3xl font-black text-brand-blue uppercase tracking-tight mb-6 leading-[1.1]">
                  {selectedItem.title}
                </h3>
                
                <div className="max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                  <p className="text-slate-600 text-lg leading-relaxed font-medium">
                    {selectedItem.content}
                  </p>
                </div>
                
                <div className="mt-12 flex justify-end">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-10 py-4 bg-brand-blue text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-blue/90 transition-all shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {t.common.close ?? 'Cerrar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

