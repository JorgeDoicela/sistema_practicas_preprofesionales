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
import { useLanguage } from "@/providers/LanguageProvider";

interface AnalyticsProps {
  stats: GlobalStats;
}

export function AnalyticsOverview({ stats }: AnalyticsProps) {
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const docData = [
    { name: t.common.approved, value: stats.approvedDocs, color: "#10b981" },
    { name: t.common.pending, value: stats.pendingDocs, color: "#f59e0b" },
  ];

  const internshipData = [
    { name: t.common.active, value: stats.activeInternships, color: "#003366" },
    { name: t.common.completed, value: stats.completedInternships, color: "#C5A059" },
  ];

  if (!isMounted) return <div className="h-96 w-full animate-pulse bg-slate-50 rounded-[2.5rem] mt-12" />;

  return (
    <div className="grid md:grid-cols-2 gap-8 mt-12">
      {/* Gráfico de Documentación */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{t.dashboard.analytics.docsProgress}</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={docData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: "var(--muted-foreground)" }}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'var(--accent)' }}
                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', color: 'var(--foreground)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}
                itemStyle={{ color: 'var(--foreground)', fontSize: '12px', fontWeight: 600 }}
                labelStyle={{ color: 'var(--muted-foreground)', fontSize: '10px', fontWeight: 700 }}
              />
              <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
                {docData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[9px] text-slate-400 font-medium mt-4 text-center">{t.dashboard.analytics.docsHint}</p>
      </div>

      {/* Gráfico de Pasantías */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{t.dashboard.analytics.hoursProgress}</h4>
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height={256}>
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
                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', color: 'var(--foreground)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}
                itemStyle={{ color: 'var(--foreground)', fontSize: '12px', fontWeight: 600 }}
                labelStyle={{ color: 'var(--muted-foreground)', fontSize: '10px', fontWeight: 700 }}
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
