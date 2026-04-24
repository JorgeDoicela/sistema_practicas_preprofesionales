"use client";

import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Download, 
  FileJson, 
  Trash2, 
  Edit, 
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { privacyService } from "@/services/privacy.service";
import { useLanguage } from "@/providers/LanguageProvider";

export default function PrivacyCenterPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myData, setMyData] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'requests'>('info');
  const [arcoType, setArcoType] = useState<'ACCESO' | 'RECTIFICACION' | 'CANCELACION' | 'OPOSICION'>('ACCESO');
  const [arcoDetails, setArcoDetails] = useState("");

  const loadData = async () => {
    try {
      const [data, reqs] = await Promise.all([
        privacyService.getMyDataSummary(),
        privacyService.getMyRequests()
      ]);
      setMyData(data);
      setRequests(reqs);
    } catch (error) {
      console.error("Error loading privacy data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await privacyService.getMyDataSummary();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Expediente_Privacidad_ISTPET_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(t.common.error);
    } finally {
      setExporting(false);
    }
  };

  const handleSubmitArco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arcoDetails.trim()) return;
    
    setSubmitting(true);
    try {
      await privacyService.requestArcoRights(arcoType, arcoDetails);
      alert(t.privacyDashboard.arcoForm.successMsg);
      setArcoDetails("");
      loadData();
    } catch (error) {
      alert(t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#003366]" />
        <p className="text-slate-500 font-bold">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 mb-8 md:mb-12">
        <div className="flex items-center gap-4 md:gap-6 min-w-0">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-[#003366] rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-900/20 shrink-0">
            <ShieldCheck className="text-[#C5A059] w-7 h-7 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight">{t.privacyDashboard.title}</h1>
            <p className="text-slate-500 font-medium">{t.privacyDashboard.subtitle}</p>
          </div>
        </div>

        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2 w-full md:w-auto">
           <button 
             onClick={() => setActiveTab('info')}
             className={cn(
               "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'info' ? "bg-[#003366] text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
             )}
           >
             {t.privacyDashboard.tabs.info}
           </button>
           <button 
             onClick={() => setActiveTab('requests')}
             className={cn(
               "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'requests' ? "bg-[#003366] text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
             )}
           >
             {t.privacyDashboard.tabs.requests}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {activeTab === 'info' ? (
            <div className="space-y-8">
              {/* Consent Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-lg font-black text-[#003366] flex items-center gap-3">
                     <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                     {t.privacyDashboard.consent.title}
                   </h3>
                   <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                     {t.privacyDashboard.consent.verified}
                   </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.privacyDashboard.consent.lastAccepted}</p>
                    <p className="font-bold text-[#003366]">{new Date(myData?.personalInfo?.privacyConsent?.acceptedAt).toLocaleString(t.common.language === "es" ? "es-ES" : "en-US")}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.privacyDashboard.consent.policyVersion}</p>
                    <p className="font-bold text-[#003366]">v{myData?.personalInfo?.privacyConsent?.version}</p>
                  </div>
                </div>

                <div className="p-5 md:p-8 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <AlertCircle className="w-5 h-5 text-[#003366]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-[#003366] mb-2 uppercase tracking-tight">{t.privacyDashboard.consent.purposes}</h4>
                    <ul className="text-xs text-[#003366]/60 font-medium space-y-2 list-disc pl-4">
                       {t.privacyDashboard.consent.purposesList.map((p: string, i: number) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Data Portability Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#003366] rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-125 duration-700" />
                 
                 <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1">
                       <h3 className="text-2xl font-black tracking-tight mb-4">{t.privacyDashboard.portability.title}</h3>
                       <p className="text-white/60 font-medium mb-8 leading-relaxed max-w-lg">
                         {t.privacyDashboard.portability.desc}
                       </p>
                       <button 
                         onClick={handleExportData}
                         disabled={exporting}
                         className="px-10 h-16 bg-[#C5A059] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-[#D4B376] transition-all flex items-center gap-3 active:scale-[0.98] disabled:opacity-50"
                       >
                         {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileJson className="w-5 h-5" />}
                         {t.privacyDashboard.portability.download}
                       </button>
                    </div>
                    <div className="w-48 h-48 bg-white/10 rounded-[3rem] flex items-center justify-center backdrop-blur-md rotate-12 group-hover:rotate-0 transition-transform duration-700 border border-white/10 shadow-2xl">
                       <Download className="w-20 h-20 text-[#C5A059]" />
                    </div>
                 </div>
              </motion.div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Form to request ARCO */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
                 <h3 className="text-xl font-black text-[#003366] mb-8">{t.privacyDashboard.arcoForm.title}</h3>
                 
                 <form onSubmit={handleSubmitArco} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <button 
                         type="button"
                         onClick={() => setArcoType('RECTIFICACION')}
                         className={cn(
                           "p-5 md:p-8 rounded-3xl border-2 transition-all text-left flex flex-col gap-4",
                           arcoType === 'RECTIFICACION' ? "bg-[#003366] border-[#003366] text-white shadow-xl shadow-blue-900/10" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-[#003366]/20"
                         )}
                       >
                          <Edit className={cn("w-6 h-6", arcoType === 'RECTIFICACION' ? "text-[#C5A059]" : "text-slate-300")} />
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest block mb-1">{t.privacyDashboard.arcoForm.rectification}</span>
                            <p className={cn("text-xs font-medium", arcoType === 'RECTIFICACION' ? "text-white/60" : "text-slate-400")}>{t.privacyDashboard.arcoForm.rectificationDesc}</p>
                          </div>
                       </button>
                       <button 
                         type="button"
                         onClick={() => setArcoType('CANCELACION')}
                         className={cn(
                           "p-5 md:p-8 rounded-3xl border-2 transition-all text-left flex flex-col gap-4",
                           arcoType === 'CANCELACION' ? "bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-900/10" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-[#003366]/20"
                         )}
                       >
                          <Trash2 className={cn("w-6 h-6", arcoType === 'CANCELACION' ? "text-white" : "text-slate-300")} />
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest block mb-1">{t.privacyDashboard.arcoForm.cancellation}</span>
                            <p className={cn("text-xs font-medium", arcoType === 'CANCELACION' ? "text-white/60" : "text-slate-400")}>{t.privacyDashboard.arcoForm.cancellationDesc}</p>
                          </div>
                       </button>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-[#003366] uppercase tracking-widest flex items-center gap-2">
                         <HelpCircle className="w-4 h-4 text-[#C5A059]" />
                         {t.privacyDashboard.arcoForm.question}
                       </label>
                       <textarea 
                        required
                        value={arcoDetails}
                        onChange={(e) => setArcoDetails(e.target.value)}
                        placeholder={t.privacyDashboard.arcoForm.placeholder}
                        className="w-full min-h-[150px] bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-[#003366] font-medium outline-none focus:ring-2 focus:ring-[#003366]/5 focus:border-[#003366] transition-all resize-none"
                       />
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-6 rounded-2xl">
                       {t.privacyDashboard.arcoForm.notice}
                    </p>

                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full h-16 bg-[#003366] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                       {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                       {t.privacyDashboard.arcoForm.submit}
                    </button>
                 </form>
              </motion.div>

              {/* History of requests */}
              <div className="space-y-6">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">{t.privacyDashboard.history.title}</h3>
                 {requests.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                       <p className="text-slate-400 font-medium italic">{t.privacyDashboard.history.empty}</p>
                    </div>
                 ) : (
                    requests.map((req, idx) => (
                       <motion.div 
                        key={req.id} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-4 sm:p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                       >
                          <div className="flex items-center gap-6">
                             <div className={cn(
                               "w-12 h-12 rounded-2xl flex items-center justify-center",
                               req.status === 'COMPLETADA' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                             )}>
                                <Clock className="w-6 h-6" />
                             </div>
                             <div>
                                <h4 className="font-black text-[#003366] text-sm uppercase tracking-tight">{req.type}</h4>
                                <p className="text-xs text-slate-400 font-medium">{new Date(req.createdAt).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <div className={cn(
                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                            req.status === 'PENDIENTE' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                             {req.status === 'COMPLETADA' ? t.privacyDashboard.history.completed : t.privacyDashboard.history.pending}
                          </div>
                       </motion.div>
                    ))
                 )}
              </div>
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-8">
           <div className="bg-white rounded-3xl p-5 md:p-8 border border-slate-200 shadow-sm transition-all hover:bg-[#FDFDFD]">
              <Lock className="w-10 h-10 text-[#C5A059] mb-6" />
              <h3 className="text-lg font-black text-[#003366] mb-4">{t.privacyDashboard.sidebar.transferTitle}</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                {t.privacyDashboard.sidebar.transferDesc}
              </p>
              <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-3">
                 <ShieldCheck className="w-5 h-5 text-emerald-500" />
                 <span className="text-[10px] font-black text-[#003366] uppercase">{t.privacyDashboard.sidebar.protectedInfra}</span>
              </div>
           </div>

           <div className="bg-[#C5A059]/10 rounded-3xl p-5 md:p-8 border border-[#C5A059]/10">
              <h3 className="text-[11px] font-black text-[#003366] uppercase tracking-widest mb-4">{t.privacyDashboard.sidebar.doubts}</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-8">
                {t.privacyDashboard.sidebar.dpoDesc}
              </p>
              <a href="mailto:dpo@istpet.edu.ec" className="block w-full py-4 bg-white rounded-2xl text-center text-[11px] font-black text-[#003366] uppercase tracking-widest shadow-sm hover:shadow-md transition-shadow">
                dpo@istpet.edu.ec
              </a>
           </div>
        </div>
      </div>
    </div>
  );
}
