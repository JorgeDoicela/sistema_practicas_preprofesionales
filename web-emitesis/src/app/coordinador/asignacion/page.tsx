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
} from 'lucide-react';
import { usersService } from '@/services/users.service';
import { agreementsService } from '@/services/agreements.service';
import { internshipsService } from '@/services/internships.service';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import { Agreement } from '@/types/agreement';

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
    totalHours: 240,
    location: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allUsers, allAgreements] = await Promise.all([
          usersService.findAll(),
          agreementsService.findAll()
        ]);

        setStudents(allUsers.filter((u: User) => u.role === 'ESTUDIANTE' && u.isActive));
        setTutors(allUsers.filter((u: User) => u.role === 'TUTOR' && u.isActive));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBtnLoading(true);
    setError(null);

    try {
      await internshipsService.create(form);
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

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#003366]/5 text-[#003366] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#003366]/10">
            <UserPlus size={12} /> Gestión de Prácticas
          </div>
          <h1 className="text-3xl font-black text-[#003366] tracking-tight">Vincular Estudiante</h1>
          <p className="text-slate-500 mt-2">Asigna un pasante a una empresa y define su tutor académico responsable.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
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

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
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

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ubicación / Lugar de Prácticas</label>
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
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Info */}
          <div className="space-y-6">
            <div className="bg-[#003366] text-white rounded-3xl p-8 shadow-xl">
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

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Resumen</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Estado</span>
                  <span className="font-bold text-blue-600">PENDIENTE</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Horas Totales</span>
                  <span className="font-bold text-[#003366]">{form.totalHours}h</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
