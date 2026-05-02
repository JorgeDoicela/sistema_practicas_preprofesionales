"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Announcement } from "@/services/announcements.service";

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
          className={`relative overflow-hidden rounded-[2rem] border-l-4 p-4 md:p-5 flex items-center gap-4 md:gap-6 shadow-xl transition-all cursor-pointer hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] h-24 md:h-28 ${
            current.type === 'SUCCESS' ? 'bg-emerald-50/80 border-emerald-500 text-emerald-900' :
            current.type === 'WARNING' ? 'bg-amber-50/80 border-amber-500 text-amber-900' :
            current.type === 'DANGER' ? 'bg-rose-50/80 border-rose-500 text-rose-900' :
            'bg-blue-50/80 border-blue-500 text-blue-900'
          }`}
        >
          {/* Icono */}
          <div className={`p-3 rounded-2xl bg-white shadow-sm flex-shrink-0 ${
            current.type === 'SUCCESS' ? 'text-emerald-500' :
            current.type === 'WARNING' ? 'text-amber-500' :
            current.type === 'DANGER' ? 'text-rose-500' :
            'text-blue-500'
          }`}>
             <Megaphone className="w-5 h-5 md:w-6 md:h-6" />
          </div>

          <div className="flex-1 pr-12 min-w-0">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                   {t.dashboard.announcement ?? 'Anuncio'} {index + 1}/{items.length}
                </span>
             </div>
             <h4 className="text-sm md:text-base font-black tracking-tight leading-tight uppercase truncate mb-1">
                {current.title}
             </h4>
             <p className="text-xs font-medium opacity-70 line-clamp-2 leading-relaxed">
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
                   className={`h-1.5 rounded-full transition-all ${
                      i === index ? 'w-6 bg-[#003366]' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                   }`}
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
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
              
              <div className={`inline-flex p-4 rounded-2xl bg-slate-50 mb-6 ${
                selectedItem.type === 'SUCCESS' ? 'text-emerald-500' :
                selectedItem.type === 'WARNING' ? 'text-amber-500' :
                selectedItem.type === 'DANGER' ? 'text-rose-500' :
                'text-blue-500'
              }`}>
                <Megaphone className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-black text-[#003366] uppercase tracking-tight mb-4 leading-tight">
                {selectedItem.title}
              </h3>
              
              <div className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-slate-600 text-base leading-relaxed font-medium">
                  {selectedItem.content}
                </p>
              </div>
              
              <div className="mt-10 flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-8 py-3 bg-[#003366] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#004488] transition-all shadow-lg shadow-blue-900/20"
                >
                  {t.common.close ?? 'Cerrar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

