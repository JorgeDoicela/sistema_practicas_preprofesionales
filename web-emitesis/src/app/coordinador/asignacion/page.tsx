'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  PlusCircle,
  Phone,
  Award,
  FileText,
  Layers,
} from 'lucide-react';
import { usersService } from '@/services/users.service';
import { agreementsService } from '@/services/agreements.service';
import { internshipsService } from '@/services/internships.service';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import { Agreement } from '@/types/agreement';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const LeafletMap = dynamic(() => import('@/components/shared/LeafletMap'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-[10px] font-black uppercase text-slate-400">Cargando Mapa Institucional...</div>
});

interface AllowedLocation {
  label: string;
  lat: number;
  lng: number;
  radiusM: number;
}

export default function AsignacionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Data subsets
  const [students, setStudents] = useState<User[]>([]);
  const [tutors, setTutors] = useState<User[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);

  // Form state
  const [form, setForm] = useState({
    studentId: '',
    companyId: '',
    tutorId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    totalHours: 240,
    modalidad: 'PRESENCIAL',
    location: '',
    activityDescription: '',
    businessTutorName: '',
    businessTutorEmail: '',
    businessTutorPhone: '',
    businessTutorPosition: '',
  });

  const [allowedLocations, setAllowedLocations] = useState<AllowedLocation[]>([
    { label: 'Sede Principal', lat: -0.180653, lng: -78.467838, radiusM: 250 }
  ]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, agreementsRes]: [any, any] = await Promise.all([
          usersService.findAll(),
          agreementsService.findAll()
        ]);

        const allUsers = Array.isArray(usersRes) ? usersRes : (Array.isArray(usersRes?.data) ? usersRes.data : []);
        const allAgreements = Array.isArray(agreementsRes) ? agreementsRes : (Array.isArray(agreementsRes?.items) ? agreementsRes.items : []);

        setStudents(allUsers.filter((u: User) => u.role === 'ESTUDIANTE' && u.isActive));
        setTutors(
          allUsers.filter((u: User) => {
            const r = String(u.role);
            return (r === "TUTOR" || r === "TUTOR_ACADEMICO") && u.isActive;
          }),
        );
        setAgreements(allAgreements.filter((a: Agreement) => a.status === 'Activo'));
      } catch (err: unknown) {
        console.error('Fetch error:', err);
        setError('Error al cargar datos necesarios para la asignación.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addLocation = () => {
    const newLoc: AllowedLocation = { 
      label: `Sede ${allowedLocations.length + 1}`, 
      lat: -0.180653, 
      lng: -78.467838, 
      radiusM: 250 
    };
    setAllowedLocations([...allowedLocations, newLoc]);
    setActiveIndex(allowedLocations.length);
  };

  const removeLocation = (index: number) => {
    if (allowedLocations.length <= 1) return;
    const newLocs = allowedLocations.filter((_, i) => i !== index);
    setAllowedLocations(newLocs);
    if (activeIndex >= newLocs.length) setActiveIndex(newLocs.length - 1);
  };

  const updateActiveLocation = (data: Partial<AllowedLocation>) => {
    const newLocs = [...allowedLocations];
    newLocs[activeIndex] = { ...newLocs[activeIndex], ...data };
    setAllowedLocations(newLocs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBtnLoading(true);
    setError(null);

    try {
      const payload = {
        ...form,
        allowedLocations,
        // Mantener retrocompatibilidad
        initialLat: allowedLocations[0].lat,
        initialLng: allowedLocations[0].lng,
        initialRadius: allowedLocations[0].radiusM
      };
      await internshipsService.create(payload);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-[#003366] animate-spin mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preparando módulo de asignación...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (success) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </motion.div>
          <h2 className="text-2xl font-black text-[#003366] mb-2">¡Asignación Exitosa!</h2>
          <p className="text-slate-500">Se ha enviado un correo de notificación al estudiante.</p>
        </div>
      </DashboardLayout>
    );
  }

  const currentLoc = allowedLocations[activeIndex];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-0 space-y-6 md:space-y-8 pb-20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#003366]/5 text-[#003366] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#003366]/10">
            <UserPlus size={12} /> Gestión de Prácticas
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight">Vincular Estudiante</h1>
          <p className="text-slate-500 mt-2">Asigna un pasante a una empresa y define su tutor académico responsable.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Main Form */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="text-[#C5A059]" size={20} />
                <h3 className="font-bold text-[#003366] uppercase tracking-widest text-sm">Selección de Actores</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estudiante</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none appearance-none"
                    value={form.studentId}
                    onChange={(e) => setForm({...form, studentId: e.target.value})}
                  >
                    <option value="">Seleccionar Estudiante</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tutor Académico</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none appearance-none"
                    value={form.tutorId}
                    onChange={(e) => setForm({...form, tutorId: e.target.value})}
                  >
                    <option value="">Seleccionar Tutor</option>
                    {tutors.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empresa receptora (con convenio activo)</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none appearance-none"
                    value={form.companyId}
                    onChange={(e) => setForm({...form, companyId: e.target.value})}
                  >
                    <option value="">Seleccionar Empresa</option>
                    {agreements.map(a => <option key={a.companyId} value={a.companyId}>{a.company.name} (RUC: {a.company.ruc})</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="text-[#C5A059]" size={20} />
                <h3 className="font-bold text-[#003366] uppercase tracking-widest text-sm">Detalles de la Práctica</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha de Inicio</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="date"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                      value={form.startDate}
                      onChange={(e) => setForm({...form, startDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Horas</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="number"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                      placeholder="Ej: 240"
                      value={form.totalHours}
                      onChange={(e) => setForm({...form, totalHours: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Fin Estimada</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                      value={form.endDate}
                      onChange={(e) => setForm({...form, endDate: e.target.value})}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 ml-1">Opcional — se calculará al completar horas</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modalidad de Práctica</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none appearance-none"
                      value={form.modalidad}
                      onChange={(e) => setForm({...form, modalidad: e.target.value})}
                    >
                      <option value="PRESENCIAL">Presencial</option>
                      <option value="SEMIPRESENCIAL">Semipresencial</option>
                      <option value="EN_LINEA">En Línea</option>
                      <option value="HIBRIDA">Híbrida</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dirección Institucional / Lugar de Prácticas</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text"
                      required
                      placeholder="Dirección o departamento específico"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                      value={form.location}
                      onChange={(e) => setForm({...form, location: e.target.value})}
                    />
                  </div>
                  
                  {/* RF-ATT-LOC: Multi-Geocerca */}
                  <div className="mt-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#003366]">Configuración Multi-Sedes</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Define los puntos geográficos donde el estudiante puede marcar asistencia.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={addLocation}
                        className="px-4 py-2 bg-[#003366]/5 text-[#003366] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#003366] hover:text-white transition-all flex items-center gap-2 border border-[#003366]/10"
                      >
                        <PlusCircle size={14} /> Añadir Sede
                      </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                       {/* Lista de Sedes */}
                       <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                          {allowedLocations.map((loc, idx) => (
                             <div 
                               key={idx}
                               onClick={() => setActiveIndex(idx)}
                               className={cn(
                                 "p-4 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between",
                                 activeIndex === idx 
                                    ? "bg-[#003366] border-[#003366] shadow-lg shadow-blue-900/10" 
                                    : "bg-white border-slate-100 hover:border-slate-300"
                               )}
                             >
                                <div className="min-w-0">
                                   <p className={cn(
                                     "text-[10px] font-black uppercase tracking-widest truncate",
                                     activeIndex === idx ? "text-[#C5A059]" : "text-slate-400 group-hover:text-[#003366]"
                                   )}>
                                     {loc.label || `Sede ${idx + 1}`}
                                   </p>
                                   <p className={cn(
                                     "text-[9px] font-bold",
                                     activeIndex === idx ? "text-white/60" : "text-slate-300"
                                   )}>Radio: {loc.radiusM}m</p>
                                </div>
                                {allowedLocations.length > 1 && (
                                   <button 
                                     type="button" 
                                     onClick={(e) => { e.stopPropagation(); removeLocation(idx); }}
                                     className={cn(
                                       "p-2 rounded-lg transition-colors",
                                       activeIndex === idx ? "text-white/40 hover:text-white" : "text-slate-300 hover:text-rose-500"
                                     )}
                                   >
                                      <Trash2 size={14} />
                                   </button>
                                )}
                             </div>
                          ))}
                       </div>

                       {/* Editor de Sede Activa */}
                       <div className="md:col-span-2 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Etiqueta de Sede</label>
                                <input 
                                  type="text"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:border-[#003366]"
                                  value={currentLoc.label}
                                  onChange={(e) => updateActiveLocation({ label: e.target.value })}
                                />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Radio: {currentLoc.radiusM}m</label>
                                <input 
                                  type="range"
                                  min="100" max="1000" step="50"
                                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#003366] mt-3"
                                  value={currentLoc.radiusM}
                                  onChange={(e) => updateActiveLocation({ radiusM: parseInt(e.target.value) })}
                                />
                             </div>
                          </div>

                          <LeafletMap 
                            key={activeIndex}
                            lat={currentLoc.lat} 
                            lng={currentLoc.lng} 
                            radiusM={currentLoc.radiusM}
                            onChange={(lat, lng) => updateActiveLocation({ lat, lng })}
                          />
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tutor Empresarial (Nombre)</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text"
                      placeholder="Nombre del supervisor en empresa"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-11 pr-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                      value={form.businessTutorName}
                      onChange={(e) => setForm({...form, businessTutorName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tutor Empresarial (Cargo)</label>
                  <div className="relative">
                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text"
                      placeholder="Ej: Jefe de RRHH, Supervisor TI"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-11 pr-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                      value={form.businessTutorPosition}
                      onChange={(e) => setForm({...form, businessTutorPosition: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tutor Empresarial (Email)</label>
                  <input 
                    type="email"
                    placeholder="email@empresa.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                    value={form.businessTutorEmail}
                    onChange={(e) => setForm({...form, businessTutorEmail: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tutor Empresarial (Teléfono)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="tel"
                      placeholder="Ej: 0987654321"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-11 pr-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                      value={form.businessTutorPhone}
                      onChange={(e) => setForm({...form, businessTutorPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción de Actividades a Realizar</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 text-slate-300" size={16} />
                    <textarea 
                      placeholder="Describa las actividades y responsabilidades que tendrá el pasante en la empresa..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-11 pr-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none resize-none"
                      value={form.activityDescription}
                      onChange={(e) => setForm({...form, activityDescription: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Info */}
          <div className="space-y-6">
            <div className="bg-[#003366] text-white rounded-3xl p-5 md:p-8 shadow-xl">
              <ShieldCheck className="text-[#C5A059] mb-4" size={32} />
              <h4 className="font-bold text-lg mb-2 italic">Aviso de Notificación</h4>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                Al guardar esta asignación, el sistema enviará automáticamente un correo electrónico al estudiante con todos los detalles registrados aquí.
              </p>
              
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex gap-3 text-red-200 items-start mb-6">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={btnLoading}
                className="w-full bg-white text-[#003366] rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#C5A059] hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {btnLoading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                Confirmar Vínculo
              </button>
            </div>

            <div className="bg-white rounded-3xl p-5 md:p-8 border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Resumen de Geocercas</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 italic">Sedes Configuradas</span>
                  <span className="font-bold text-[#003366]">{allowedLocations.length}</span>
                </div>
                {allowedLocations.map((l, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] border-l-2 border-[#C5A059] pl-3 py-1">
                    <span className="text-slate-400 truncate max-w-[120px]">{l.label}</span>
                    <span className="font-bold text-[#003366]">{l.radiusM}m</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
