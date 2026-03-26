"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Building2, 
  FileCheck, 
  Clock, 
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { User as UserType } from "@/types/user";

export function DashboardMain() {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setTimeout(() => setUser(JSON.parse(savedUser)), 0);
    }
  }, []);

  return (
    <div className="space-y-12">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">Resumen del Ecosistema</span>
          <h2 className="text-4xl font-black text-[#003366] tracking-tight">
            Bienvenido, <span className="text-slate-400">{user?.fullName?.split(' ')[0] || "Usuario"}</span> 👋
          </h2>
          <p className="text-slate-500 font-medium mt-2">Monitoreo activo de prácticas preprofesionales ISTPET.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <div className="px-4 py-2 bg-emerald-50 rounded-xl">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sistema: Operativo</span>
           </div>
           <div className="px-4 py-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">v2.0.4</span>
           </div>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pasantes Activos" 
          value="124" 
          trend="+12%" 
          trendUp={true} 
          icon={<Users className="w-6 h-6" />}
          color="bg-blue-500" 
        />
        <StatCard 
          title="Convenios" 
          value="48" 
          trend="+4" 
          trendUp={true} 
          icon={<Building2 className="w-6 h-6" />}
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Horas Totales" 
          value="12,450" 
          trend="-2%" 
          trendUp={false} 
          icon={<Clock className="w-6 h-6" />}
          color="bg-amber-500" 
        />
        <StatCard 
          title="Aprobación" 
          value="94%" 
          trend="+0.5%" 
          trendUp={true} 
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="bg-emerald-500" 
        />
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-8 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight">Actividad en tiempo real</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Últimos registros de asistencia</p>
              </div>
              <button className="text-xs font-black text-[#C5A059] uppercase tracking-widest hover:text-[#003366] transition-colors">
                Ver todo
              </button>
            </div>
            <div className="p-4 space-y-2">
                <ActivityRow name="Ismael Rivera" company="Tech Solutions" status="Check-in" time="08:15 AM" />
                <ActivityRow name="Marcos Galindo" company="Global Industry" status="Documento" time="09:30 AM" />
                <ActivityRow name="Ana Belén" company="Logistic Plus" status="Check-out" time="10:05 AM" />
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-gradient-to-br from-[#C5A059] to-[#8E6F36] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
               <FileCheck className="w-12 h-12 mb-6" />
               <h3 className="text-3xl font-black tracking-tighter leading-none mb-4">Validar <br />Certificados</h3>
               <button className="w-full py-4 bg-white text-[#003366] rounded-2xl text-[10px] font-black uppercase tracking-widest">Iniciar Revisión</button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ReactElement;
  color: string;
}

function StatCard({ title, value, trend, trendUp, icon, color }: StatCardProps) {
  return (
    <motion.div whileHover={{ y: -8 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden">
      <div className="flex items-start justify-between mb-8">
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-slate-800`}>
          {React.cloneElement(icon as React.ReactElement<any>, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` })}
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          <span className="text-[10px] font-black">{trend}</span>
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-3xl font-black text-[#003366] tracking-tighter">{value}</h4>
    </motion.div>
  );
}

interface ActivityRowProps {
  name: string;
  company: string;
  status: string;
  time: string;
}

function ActivityRow({ name, company, status, time }: ActivityRowProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-[#003366]">{name.charAt(0)}</div>
        <div>
          <p className="text-xs font-black text-slate-600 uppercase tracking-tight">{name}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{company}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg">{status}</span>
        <p className="text-[9px] font-bold text-slate-300 uppercase mt-1.5">{time}</p>
      </div>
    </div>
  );
}
