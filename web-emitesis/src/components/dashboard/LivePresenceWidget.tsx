"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, MapPin, Clock, Radar } from "lucide-react";
import { cn } from "@/lib/utils";

interface LivePresenceWidgetProps {
  internships: any[];
}

export function LivePresenceWidget({ internships }: LivePresenceWidgetProps) {
  // Filtrar estudiantes con check-in hoy sin check-out
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeNow = internships.filter((i) => {
    const todayAttendance = i.attendances?.find((a: any) => {
      const checkDate = new Date(a.checkIn);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate.getTime() === today.getTime() && !a.checkOut;
    });
    return !!todayAttendance;
  }).map(i => {
    const attendance = i.attendances.find((a: any) => !a.checkOut);
    return {
      id: i.id,
      name: i.student.fullName,
      checkIn: attendance.checkIn,
      locationLabel: attendance.locationLabel || "Ubicación verificada",
    };
  });

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col h-full">
      <div className="p-8 bg-[#003366] text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Radar className="w-5 h-5 text-[#C5A059] animate-pulse" />
             </div>
             <div>
               <h3 className="text-lg font-black tracking-tight">Presencia en Vivo</h3>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Control de planta actual</p>
             </div>
          </div>
          <div className="px-3 py-1 bg-white/10 rounded-lg">
             <span className="text-xl font-black">{activeNow.length}</span>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto max-h-[400px]">
        {activeNow.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-10 opacity-40">
            <User className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nadie en instalaciones</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeNow.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 group hover:bg-white hover:shadow-lg transition-all"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#003366] font-black border border-slate-100">
                  {p.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#003366] truncate">{p.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <Clock className="w-2.5 h-2.5" /> {new Date(p.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                      <MapPin className="w-2.5 h-2.5" /> {p.locationLabel}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-6 bg-slate-50 border-t border-slate-100">
         <p className="text-[9px] font-medium text-slate-400 leading-tight">
           * Estudiantes con check-in activo verificado mediante biometría y GPS en la sede asignada.
         </p>
      </div>
    </div>
  );
}
