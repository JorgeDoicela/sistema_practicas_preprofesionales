"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileType, 
  Clock, 
  Users, 
  Building2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { reportsService, GlobalStats } from "@/services/reports.service";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { toast } from "sonner";

export default function ReportesPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem("user");
      let careerId = undefined;
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          careerId = userObj.careerId;
        } catch (e) {
          console.error("Error parsing user from localStorage", e);
        }
      }
      const res: any = await reportsService.getGlobalStats(careerId);
      const data = res?.data || res || null;
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error(t.common.error || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: "excel" | "pdf") => {
    try {
      setExporting(type);
      if (type === "excel") await reportsService.exportGlobalExcel();
      else await reportsService.exportGlobalPdf();
      toast.success(t.common.success.generic);
    } catch (error) {
      toast.error(t.coordinator.reports.errorExport);
    } finally {
      setExporting(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-12 max-w-[1400px] mx-auto pb-20">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">{t.coordinator.reports.subtitle}</span>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">
              {t.coordinator.reports.title}
            </h2>
            <p className="text-slate-500 font-medium mt-2">{t.coordinator.reports.description}</p>
          </div>
          
          <div className="flex items-center gap-3" data-tour="reportes-export-actions">
             <button 
                onClick={() => handleExport("excel")}
                disabled={exporting !== null}
                className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm"
             >
                {exporting === "excel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                {t.coordinator.reports.exportExcel}
             </button>
             <button 
                onClick={() => handleExport("pdf")}
                disabled={exporting !== null}
                className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 text-[#003366] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
             >
                {exporting === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileType className="w-4 h-4" />}
                {t.coordinator.reports.generatePdf}
             </button>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.reports.loading}</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
             <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="reportes-stats-grid">
              <ReportStatCard 
                title={t.coordinator.reports.stats.activeInternships}
                value={String(stats?.assignmentsCount || 0)} 
                hint={t.coordinator.reports.stats.activeInternshipsHint}
                icon={<Users className="w-6 h-6" />}
                color="blue"
                href="/coordinador/estudiantes"
              />
              <ReportStatCard 
                title={t.coordinator.reports.stats.pendingReviews}
                value={String(stats?.pendingDocs || 0)} 
                hint={t.coordinator.reports.stats.pendingReviewsHint}
                icon={<BarChart3 className="w-6 h-6" />}
                color="rose"
                href="/coordinador/estudiantes"
              />
              <ReportStatCard 
                title={t.coordinator.reports.stats.hoursCompletion}
                value={`${stats?.totalCompletedHours || 0}h`} 
                hint={t.coordinator.reports.stats.hoursCompletionHint.replace("{total}", String(stats?.totalPlannedHours || 0))}
                icon={<TrendingUp className="w-6 h-6" />}
                color="amber"
              />
              <ReportStatCard 
                title={t.coordinator.reports.stats.alerts}
                value={String(stats?.activeBlocks || 0)} 
                hint={t.coordinator.reports.stats.alertsHint}
                icon={<ShieldAlert className="w-6 h-6" />}
                color="indigo"
              />
            </section>

            {/* Main Content Areas */}
            <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 space-y-8">
                 <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden" data-tour="reportes-efficiency-metrics">
                    <div className="p-4 sm:p-6 md:p-8 border-b border-slate-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                       <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight">{t.coordinator.reports.summary.title}</h3>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t.coordinator.reports.summary.status}</span>
                       </div>
                    </div>
                    <div className="p-5 md:p-10 space-y-6 md:space-y-8">
                       <div className="space-y-4">
                          <div className="flex justify-between items-end">
                             <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.coordinator.reports.summary.progressLabel}</span>
                             <span className="text-2xl font-black text-[#003366]">{stats?.progressPercentage}%</span>
                          </div>
                          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${stats?.progressPercentage}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-[#003366] to-[#C5A059]"
                             />
                          </div>
                          <p className="text-[10px] font-medium text-slate-400">{t.coordinator.reports.summary.progressHint}</p>
                       </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 pt-4">
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{t.coordinator.reports.summary.efficiencyTitle}</h4>
                             <p className="text-2xl font-black text-[#003366]">{t.coordinator.reports.summary.efficiencyValue}</p>
                             <p className="text-[10px] text-slate-500 mt-2 font-medium">{t.coordinator.reports.summary.efficiencyDesc}</p>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{t.coordinator.reports.summary.approvalTitle}</h4>
                             <p className="text-2xl font-black text-[#003366]">88%</p>
                             <p className="text-[10px] text-slate-500 mt-2 font-medium">{t.coordinator.reports.summary.approvalDesc}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-[#003366] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group" data-tour="reportes-master">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-colors" />
                    <div className="relative z-10 space-y-6">
                       <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                          <Download className="text-[#C5A059]" />
                       </div>
                       <h3 className="text-2xl font-black tracking-tighter leading-tight">{t.coordinator.reports.exportCard.title}</h3>
                       <p className="text-sm text-white/60 font-medium leading-relaxed">{t.coordinator.reports.exportCard.desc}</p>
                        <div className="space-y-3 pt-4">
                          <button 
                            onClick={() => handleExport("excel")}
                            className="w-full py-4 bg-white text-[#003366] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3"
                          >
                             <FileSpreadsheet className="w-4 h-4" />
                             {t.coordinator.reports.exportCard.excelBtn}
                          </button>
                          <button 
                            onClick={() => handleExport("pdf")}
                            className="w-full py-4 bg-white/10 border border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-3"
                          >
                             <FileType className="w-4 h-4" />
                             {t.coordinator.reports.exportCard.pdfBtn}
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="bg-amber-50 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-amber-100">
                     <div className="flex items-center gap-4 mb-4">
                       <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                          <AlertCircle className="text-white w-5 h-5" />
                       </div>
                       <h4 className="text-sm font-black text-amber-900 uppercase">{t.coordinator.reports.alertsCard.title}</h4>
                    </div>
                    <ul className="space-y-3">
                       <li className="flex items-center gap-3 text-xs text-amber-800 font-bold">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                          {t.coordinator.reports.alertsCard.pendingReviews.replace("{count}", String(stats?.pendingDocs || 0))}
                       </li>
                       <li className="flex items-center gap-3 text-xs text-amber-800 font-bold">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                          {t.coordinator.reports.alertsCard.restrictions.replace("{count}", String(stats?.activeBlocks || 0))}
                       </li>
                    </ul>
                 </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

interface ReportStatCardProps {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactElement;
  color: 'blue' | 'rose' | 'amber' | 'indigo';
  href?: string;
}

function ReportStatCard({ title, value, hint, icon, color, href }: ReportStatCardProps) {
  const router = useRouter();
  const colorMap: Record<string, string> = {
    blue: "from-blue-600 to-blue-400 text-blue-600 shadow-blue-200",
    rose: "from-rose-600 to-rose-400 text-rose-600 shadow-rose-200",
    amber: "from-amber-600 to-amber-400 text-amber-600 shadow-amber-200",
    indigo: "from-indigo-600 to-indigo-400 text-indigo-600 shadow-indigo-200",
  };

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (href) {
      return (
        <Link href={href} className="block group">
          {children}
        </Link>
      );
    }
    return <div className="group">{children}</div>;
  };

  return (
    <CardWrapper>
      <motion.div 
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden transition-all duration-300",
          href && "cursor-pointer hover:border-[#C5A059]/30"
        )}
      >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
           {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-32 h-32 rotate-12" })}
        </div>

        <div className="flex items-start justify-between mb-8">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg",
            colorMap[color].split(" ").slice(0, 2).join(" "),
            "text-white"
          )}>
            {icon}
          </div>
          {href && (
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#003366] group-hover:text-white transition-all">
               <ChevronRight className="w-5 h-5" />
            </div>
          )}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tighter">{value}</h4>
        <p className="text-[11px] font-semibold text-slate-500 mt-3 flex items-center gap-2">
           <div className={cn("w-1.5 h-1.5 rounded-full", colorMap[color].split(" ")[0].replace('from-', 'bg-'))} />
           {hint}
        </p>
      </motion.div>
    </CardWrapper>
  );
}
