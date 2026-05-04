"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { analyticsService, AdminStats, HealthSeries } from "@/services/analytics.service";
import { maintenanceService } from "@/services/maintenance.service";
import { 
  Activity, 
  Terminal, 
  Zap, 
  AlertTriangle, 
  Database, 
  Trash2, 
  BarChart3,
  Loader2,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  History
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { motion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";


export default function AdminHealthPage() {
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [series, setSeries] = useState<HealthSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [s, h] = await Promise.all([
        analyticsService.getStats(),
        analyticsService.getHealthSeries(),
      ]);
      setStats(s);
      setSeries(h);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCleanup() {
    try {
      setCleaning(true);
      const res = await maintenanceService.cleanupOrphanedFiles();
      setResult({ 
        type: "success", 
        text: t.admin.health.cleanupSuccess.replace('{count}', String(res.deletedCount)).replace('{size}', String(res.reclaimedMb))
      });
      setTimeout(() => setResult(null), 5000);
    } catch (err) {
      setResult({ type: "error", text: t.admin.health.cleanupError });
    } finally {
      setCleaning(false);
    }
  }

  async function handleBackup() {
    try {
      setBackingUp(true);
      const res = await maintenanceService.backupDatabase();
      setResult({ type: "success", text: res.message });
      setTimeout(() => setResult(null), 5000);
    } catch (err) {
      setResult({ type: "error", text: t.admin.health.backupError });
    } finally {
      setBackingUp(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-12 pb-20">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
              {t.admin.health.monitor}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">
              {t.admin.health.title.split(' ')[0]} <span className="text-slate-400">{t.admin.health.title.split(' ').slice(1).join(' ')}</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              {t.admin.health.subtitle}
            </p>
          </div>
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-sm font-bold text-slate-600"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t.admin.health.refresh}
          </button>
        </section>

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-[2rem] border ${result.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'} text-sm font-bold flex items-center justify-between shadow-lg`}
          >
            <div className="flex items-center gap-3">
              {result.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              {result.text}
            </div>
            <button onClick={() => setResult(null)} className="opacity-50 hover:opacity-100 p-2">✕</button>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-50" data-tour="health-latency">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Zap className="w-5 h-5" />
                   </div>
                   <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight">{t.admin.health.latencyTitle}</h3>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.admin.health.avgLabel}</p>
                   <p className="text-xl font-black text-indigo-600">{stats?.avgResponseTime || 0} ms</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                {isMounted && (
                  <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="avgLatency" name="Latencia (ms)" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLatency)" />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-50">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                      <Terminal className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight">{t.admin.health.trafficTitle}</h3>
               </div>
               <div className="h-[250px] w-full">
                {isMounted && (
                  <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="total" name={t.admin.health.requests} fill="#003366" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="errors" name={t.admin.health.errors} fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                )}
               </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-xl border border-slate-50" data-tour="health-actions">
               <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-6">{t.admin.health.maintenance}</h3>
               <div className="space-y-4">
                  <button 
                    disabled={cleaning}
                    onClick={handleCleanup}
                    className="w-full group flex items-center justify-between p-5 bg-slate-50 hover:bg-rose-50 rounded-3xl border border-slate-100 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-white text-slate-400 group-hover:text-rose-500 rounded-2xl shadow-sm transition-colors">
                          {cleaning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                       </div>
                       <div>
                          <p className="text-xs font-black text-[#003366] uppercase tracking-tight">{t.admin.health.cleanupTitle}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t.admin.health.cleanupDesc}</p>
                       </div>
                    </div>
                  </button>

                  <button 
                    disabled={backingUp}
                    onClick={handleBackup}
                    className="w-full group flex items-center justify-between p-5 bg-slate-50 hover:bg-emerald-50 rounded-3xl border border-slate-100 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-white text-slate-400 group-hover:text-emerald-500 rounded-2xl shadow-sm transition-colors">
                          {backingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                       </div>
                       <div>
                          <p className="text-xs font-black text-[#003366] uppercase tracking-tight">{t.admin.health.backupTitle}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t.admin.health.backupDesc}</p>
                       </div>
                    </div>
                  </button>

                  <div className="p-5 bg-[#003366] text-white rounded-3xl">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-3">{t.admin.health.summaryToday}</p>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <p className="text-2xl font-black">{stats?.counters.logsToday || 0}</p>
                           <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">{t.admin.health.totalLogs}</p>
                        </div>
                        <div>
                           <p className="text-2xl font-black text-rose-400">{stats?.counters.errorsToday || 0}</p>
                           <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">{t.admin.health.errorEvents}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 text-white">
               <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-5 h-5 text-[#C5A059]" />
                  <h3 className="text-xs font-black uppercase tracking-widest">{t.admin.health.rolesTitle}</h3>
               </div>
               <div className="space-y-4">
                  {stats?.rolesDistribution.map(item => (
                    <div key={item.role}>
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5 grayscale opacity-80">
                          <span>{t.sidebar.roles[item.role as keyof typeof t.sidebar.roles] || item.role}</span>
                          <span>{item._count}</span>
                       </div>
                       <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#C5A059]" 
                            style={{ width: `${(item._count / (stats?.counters.totalUsers || 1)) * 100}%` }}
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
