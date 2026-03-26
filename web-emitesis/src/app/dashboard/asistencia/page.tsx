"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  MapPin, 
  Clock, 
  ArrowRightCircle, 
  ArrowLeftCircle, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Calendar,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { attendancesService } from "@/services/attendances.service";
import { internshipsService } from "@/services/internships.service";

export default function AsistenciaPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [internship, setInternship] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ startDate: "", endDate: "" });

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async (f?: typeof filters) => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const internships = await internshipsService.findByStudent(user.id);
      const active = internships.find((i: any) => i.status === 'Activo' || i.status === 'En Proceso');
      
      if (active) {
        setInternship(active);
        const [todayStatus, attendanceHistory, attendanceSummary] = await Promise.all([
          attendancesService.getTodayStatus(),
          attendancesService.findByInternship(active.id, f?.startDate, f?.endDate),
          attendancesService.getSummary(active.id)
        ]);
        setStatus(todayStatus);
        setHistory(attendanceHistory);
        setSummary(attendanceSummary);
      }
    } catch (err: any) {
      console.error(err);
      setError("No se pudo cargar la información de asistencia");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(filters);
  };

  const handleAttendance = async (type: 'IN' | 'OUT') => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización");
      return;
    }

    setRegistering(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          if (type === 'IN') {
            await attendancesService.checkIn(coords);
          } else {
            await attendancesService.checkOut(coords);
          }

          await loadData();
          alert(`${type === 'IN' ? 'Entrada' : 'Salida'} registrada con éxito`);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setRegistering(false);
        }
      },
      (err) => {
        setRegistering(false);
        setError("Error al obtener ubicación. Por favor activa el GPS.");
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-12 pb-20">
        {/* Header section with Dynamic Clock */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-[#003366] rounded-3xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                 <Clock className="w-10 h-10 text-[#C5A059] animate-pulse" />
              </div>
              <div>
                 <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1 block">Registro de Asistencia</span>
                 <h2 className="text-4xl font-black text-[#003366] tracking-tighter">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <span className="text-slate-300 text-2xl ml-2 font-bold">{currentTime.toLocaleTimeString([], { second: '2-digit' })}</span>
                 </h2>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                    {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                 </p>
              </div>
           </div>

           <div className="flex flex-col items-end text-right">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl mb-2">
                 <MapPin className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Validación GPS Activa</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Precisión requerida: &lt; 200m</p>
           </div>
        </section>

        {/* Summary Cards Integration */}
        {summary && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex items-center gap-5">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Horas Totales</p>
                <p className="text-xl font-black text-[#003366]">{summary.totalHours}h / {summary.requiredHours}h</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex items-center gap-5">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progreso</p>
                <p className="text-xl font-black text-[#003366]">{summary.progressPercentage}%</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex items-center gap-5">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registros</p>
                <p className="text-xl font-black text-[#003366]">{summary.totalRecords}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex items-center gap-5">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pendientes</p>
                <p className="text-xl font-black text-[#003366]">{summary.remainingHours}h</p>
              </div>
            </div>
          </section>
        )}

        {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verificando estado...</p>
             </div>
        ) : !internship ? (
            <div className="bg-amber-50 p-12 rounded-[2.5rem] text-center border border-amber-100">
                <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
                <h3 className="text-xl font-black text-amber-900 uppercase">Sin Asignación Activa</h3>
                <p className="text-amber-700 mt-2 font-medium">No puedes registrar asistencia sin una práctica en proceso.</p>
            </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Action Cards */}
            <div className="space-y-6">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
                  <h3 className="text-sm font-black text-[#003366] uppercase tracking-[0.2em] flex items-center gap-3">
                     <MapPin className="w-4 h-4 text-[#C5A059]" />
                     Control Diario
                  </h3>

                  <div className="grid gap-4">
                     {/* Check-in Button */}
                     <button 
                        onClick={() => handleAttendance('IN')}
                        disabled={registering || !!status}
                        className={cn(
                          "group relative flex items-center justify-between p-6 rounded-3xl border-2 transition-all overflow-hidden",
                          status 
                            ? "bg-slate-50 border-slate-100 cursor-not-allowed" 
                            : "bg-white border-emerald-100 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-900/5 active:scale-95"
                        )}
                     >
                        <div className="flex items-center gap-5 relative z-10">
                           <div className={cn(
                             "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                             status ? "bg-emerald-100 text-emerald-600" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white"
                           )}>
                              {status ? <CheckCircle2 className="w-6 h-6" /> : <ArrowRightCircle className="w-6 h-6" />}
                           </div>
                           <div className="text-left">
                              <p className={cn("text-[10px] font-black uppercase tracking-widest", status ? "text-emerald-600" : "text-slate-400")}>REGISTRAR ENTRADA</p>
                              <p className="text-lg font-black text-[#003366]">{status ? new Date(status.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Marcar Ingreso'}</p>
                           </div>
                        </div>
                        {!status && <ChevronRight className="w-5 h-5 text-emerald-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />}
                     </button>

                     {/* Check-out Button */}
                     <button 
                        onClick={() => handleAttendance('OUT')}
                        disabled={registering || !status || !!status.checkOut}
                        className={cn(
                          "group relative flex items-center justify-between p-6 rounded-3xl border-2 transition-all overflow-hidden",
                          (!status || !!status.checkOut)
                            ? "bg-slate-50 border-slate-100 cursor-not-allowed" 
                            : "bg-white border-rose-100 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-900/5 active:scale-95"
                        )}
                     >
                        <div className="flex items-center gap-5 relative z-10">
                           <div className={cn(
                             "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                             status?.checkOut ? "bg-rose-100 text-rose-600" : "bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white"
                           )}>
                              {status?.checkOut ? <CheckCircle2 className="w-6 h-6" /> : <ArrowLeftCircle className="w-6 h-6" />}
                           </div>
                           <div className="text-left">
                              <p className={cn("text-[10px] font-black uppercase tracking-widest", status?.checkOut ? "text-rose-600" : "text-slate-400")}>REGISTRAR SALIDA</p>
                              <p className="text-lg font-black text-[#003366]">{status?.checkOut ? new Date(status.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Marcar Egreso'}</p>
                           </div>
                        </div>
                        {(!status?.checkOut && status) && <ChevronRight className="w-5 h-5 text-rose-200 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />}
                     </button>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">{error}</p>
                    </motion.div>
                  )}
               </div>

               <div className="bg-[#003366] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                  <div className="relative z-10">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] mb-4">Ubicación de Práctica</p>
                     <p className="text-xl font-black mb-2 tracking-tight leading-tight">{internship.company.name}</p>
                     <p className="text-white/60 text-xs font-medium">{internship.location}</p>
                     <div className="mt-8 flex items-center gap-4">
                        <div className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Lat: {internship.lat?.toFixed(5)}</div>
                        <div className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Lng: {internship.lng?.toFixed(5)}</div>
                     </div>
                  </div>
                  <Building2 className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-700" />
               </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
               <div className="p-8 border-b border-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#003366]">
                          <History className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-[#003366] uppercase tracking-[0.2em]">Historial de Asistencia</h3>
                    </div>
                  </div>

                  {/* Filters Form */}
                  <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Desde</label>
                      <input 
                        type="date" 
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                        className="block w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#003366] focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasta</label>
                      <input 
                        type="date" 
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                        className="block w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#003366] focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-[#003366] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#004488] transition-colors h-[38px]"
                    >
                      Filtrar
                    </button>
                    {(filters.startDate || filters.endDate) && (
                      <button 
                        type="button"
                        onClick={() => {
                          setFilters({ startDate: "", endDate: "" });
                          loadData({ startDate: "", endDate: "" });
                        }}
                        className="px-4 py-2 text-slate-400 hover:text-[#003366] text-[10px] font-black uppercase tracking-widest transition-colors h-[38px]"
                      >
                        Limpiar
                      </button>
                    )}
                  </form>
               </div>

               <div className="flex-1 overflow-y-auto max-h-[600px]">
                  {history.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                       <Calendar className="w-12 h-12 text-slate-200 mx-auto" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sin registros previos</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                       {history.map((record) => (
                         <div key={record.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-5">
                               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex flex-col items-center justify-center group-hover:bg-white transition-colors">
                                  <span className="text-[11px] font-black text-[#003366] leading-none">{new Date(record.checkIn).getDate()}</span>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">{new Date(record.checkIn).toLocaleString('es-ES', { month: 'short' })}</span>
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest mb-1">{new Date(record.checkIn).toLocaleDateString('es-ES', { weekday: 'long' })}</p>
                                  <div className="flex items-center gap-6">
                                     <div className="flex items-center gap-2">
                                        <ArrowRightCircle className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-xs font-black text-[#003366]">{new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                     </div>
                                     {record.checkOut ? (
                                        <div className="flex items-center gap-2">
                                           <ArrowLeftCircle className="w-3.5 h-3.5 text-rose-500" />
                                           <span className="text-xs font-black text-[#003366]">{new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                     ) : (
                                        <div className="px-2 py-0.5 bg-amber-50 rounded text-[9px] font-black text-amber-600 uppercase tracking-tighter">— Pendiente</div>
                                     )}
                                  </div>
                               </div>
                            </div>
                            
                            <div className="text-right">
                               <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-slate-400">
                                  <MapPin className="w-3 h-3 text-slate-300" />
                                  {record.distanceKm ? `${(record.distanceKm * 1000).toFixed(0)}m` : 'N/A'}
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Sub-components used in the main page
function ChevronRight(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}

function Building2(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
      </svg>
    );
}
