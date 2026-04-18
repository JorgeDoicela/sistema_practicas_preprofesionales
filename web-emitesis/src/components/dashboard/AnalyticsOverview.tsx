"use client";

import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { GlobalStats } from "@/services/reports.service";

interface AnalyticsProps {
  stats: GlobalStats;
}

export function AnalyticsOverview({ stats }: AnalyticsProps) {
  const docData = [
    { name: "Aprobados", value: stats.approvedDocs, color: "#10b981" },
    { name: "Pendientes", value: stats.pendingDocs, color: "#f59e0b" },
  ];

  const internshipData = [
    { name: "Activas", value: stats.activeInternships, color: "#003366" },
    { name: "Completadas", value: stats.completedInternships, color: "#C5A059" },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-8 mt-12">
      {/* Gráfico de Documentación */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Eficiencia Documental</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={docData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
                {docData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[9px] text-slate-400 font-medium mt-4 text-center">Distribución de revisiones en toda la plataforma.</p>
      </div>

      {/* Gráfico de Pasantías */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Estado del Programa</h4>
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={internshipData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {internshipData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
           {internshipData.map(item => (
             <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{item.name}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
