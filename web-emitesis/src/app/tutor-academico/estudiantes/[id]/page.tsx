"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Calendar, Clock, CheckCircle2, AlertCircle, 
  MapPin, Plus, FileText, User, Building2, TrendingUp,
  MessageSquare, Trash2, ShieldCheck, Star, Save, Loader2,
  CalendarDays, Video, Users, ClipboardCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { internshipsService } from "@/services/internships.service";
import { attendancesService } from "@/services/attendances.service";
import { documentsService } from "@/services/documents.service";
import { monitoringService, MonitoringVisitPayload } from "@/services/monitoring.service";
import { evaluationsService, EvaluationPayload } from "@/services/evaluations.service";
import { useLanguage } from "@/providers/LanguageProvider";

export default function StudentDetailPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const router = useRouter();
  
  const [internship, setInternship] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [newVisit, setNewVisit] = useState<Partial<MonitoringVisitPayload>>({
    type: 'PRESENCIAL',
    date: new Date().toISOString().split('T')[0],
    location: '',
    observations: '',
    recommendations: '',
  });

  // Evaluation form state
  const [evalScores, setEvalScores] = useState({
    punctuality: 1,
    teamwork: 1,
    technicalSkills: 1,
    proactivity: 1,
    attitude: 1,
    observations: ''
  });

  const loadData = useCallback(async () => {
    try {
      const [intData, attData, sumData, docsData, visData, evalData] = await Promise.all([
        internshipsService.findOne(id as string),
        attendancesService.findByInternship(id as string),
        attendancesService.getSummary(id as string),
        documentsService.findByInternship(id as string),
        monitoringService.findVisitsByInternship(id as string),
        evaluationsService.findByInternship(id as string)
      ]);

      const normalizeArray = (val: any) => 
        Array.isArray(val) ? val : (Array.isArray(val?.items) ? val.items : (Array.isArray(val?.data) ? val.data : []));

      setInternship(intData);
      setAttendances(normalizeArray(attData));
      setSummary(sumData);
      setDocuments(normalizeArray(docsData));
      setVisits(normalizeArray(visData));
      
      const normalizedEvals = normalizeArray(evalData);
      setEvaluations(normalizedEvals);

      // If there's an academic evaluation already, load it
      const acadEval = normalizedEvals.find((e: any) => e.type === 'ACADEMICA');
      if (acadEval) {
        setEvalScores({
          punctuality: acadEval.punctuality,
          teamwork: acadEval.teamwork,
          technicalSkills: acadEval.technicalSkills,
          proactivity: acadEval.proactivity,
          attitude: acadEval.attitude,
          observations: acadEval.observations || ''
        });
      }
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

  const handleCreateVisit = async () => {
    if (!newVisit.observations || !newVisit.date) return;
    setSaving(true);
    try {
      await monitoringService.createVisit({
        internshipId: id as string,
        date: newVisit.date,
        type: newVisit.type as 'PRESENCIAL' | 'VIRTUAL',
        location: newVisit.location || undefined,
        observations: newVisit.observations,
        recommendations: newVisit.recommendations || undefined,
      });
      await loadData();
      setIsVisitModalOpen(false);
      setNewVisit({ type: 'PRESENCIAL', date: new Date().toISOString().split('T')[0], location: '', observations: '', recommendations: '' });
    } catch (error: any) {
      alert(error.message || t.common.errors.generic);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (!confirm(t.tutor.studentDetail.visits.confirmDelete)) return;
    try {
      await monitoringService.deleteVisit(visitId);
      await loadData();
    } catch (error: any) {
      alert(error.message || t.common.errors.generic);
    }
  };

  const handleSaveEvaluation = async () => {
    // Validar que todos los campos tengan al menos 1 punto
    const scores = [evalScores.punctuality, evalScores.teamwork, evalScores.technicalSkills, evalScores.proactivity, evalScores.attitude];
    if (scores.some(s => s < 1)) {
      alert(t.tutor.studentDetail.evaluation.errorEmpty);
      return;
    }

    setSaving(true);
    try {
      await evaluationsService.createOrUpdate({
        internshipId: id as string,
        type: 'ACADEMICA',
        ...evalScores
      });
      await loadData();
      alert(t.tutor.studentDetail.evaluation.successMsg);
    } catch (error: any) {
      // Manejar errores de validación que pueden venir como array
      const msg = Array.isArray(error.message) ? error.message.join(', ') : error.message;
      alert("Error: " + (msg || t.common.errors.generic));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.common.loading}</p>
      </div>
    );
  }

  const businessEval = evaluations?.find((e: any) => e.type === 'EMPRESARIAL');

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto space-y-10 pb-20">
        
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em]">{t.tutor.studentDetail.title}</span>
                <div className="h-1 w-1 rounded-full bg-slate-300" />
                <span className={cn(
                   "text-[10px] font-black uppercase tracking-widest",
                   internship?.status === 'Finalizado' ? "text-emerald-600" : "text-blue-600"
                )}>
                  {(t.tutor.internshipStatus as any)[internship?.status] || internship?.status}
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tighter">
                {internship?.student?.fullName}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tutor.studentDetail.assignedCompany}</p>
              <p className="font-bold text-[#003366]">{internship?.company?.name}</p>
            </div>
            <div className="w-14 h-14 flex items-center justify-center text-[#003366]">
              <Building2 className="w-8 h-8" />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Left Column: Stats & Progress */}
          <div className="space-y-8">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5">
                <TrendingUp className="w-24 h-24 text-[#003366]" />
              </div>
              
              <h3 className="text-[11px] font-black text-[#C5A059] uppercase tracking-widest mb-8 flex items-center gap-2">
                <Clock className="w-4 h-4" /> {t.tutor.studentDetail.attendanceProgress}
              </h3>
              
              <div className="space-y-8">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-2xl md:text-3xl font-black text-[#003366]">{summary?.progressPercentage}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-400">{summary?.totalHours}h / {summary?.requiredHours}h</span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${summary?.progressPercentage}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#003366]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.tutor.studentDetail.registeredDays}</p>
                    <p className="text-xl font-black text-[#003366]">{summary?.totalRecords}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.tutor.studentDetail.missingHours}</p>
                    <p className="text-xl font-black text-[#C5A059]">{summary?.remainingHours}h</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-[#003366] rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 text-white shadow-xl shadow-blue-900/10"
            >
              <h3 className="text-[11px] font-black text-[#C5A059] uppercase tracking-widest mb-6">{t.tutor.studentDetail.documentation}</h3>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        doc.status === 'APROBADO_DEFINITIVO' ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/60"
                      )}>
                        {doc.status === 'APROBADO_DEFINITIVO' ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate max-w-[150px]">{doc.name}</p>
                        <p className="text-[9px] opacity-40 font-black uppercase">{(t.tutor.documentStatus as any)[doc.status] || doc.status.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    {doc.status === 'EN_REVISION_TUTOR' && (
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Center Column: Monitoring Visits */}
          <div className="lg:col-span-2 space-y-8">
            
            <section className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#003366]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#003366]">{t.tutor.studentDetail.visits.title}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.tutor.studentDetail.visits.subtitle}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsVisitModalOpen(true)}
                  className="px-6 py-3 bg-[#003366] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#004488] shadow-lg shadow-blue-900/10 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {t.tutor.studentDetail.visits.newVisit}
                </button>
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                {visits.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                      <CalendarDays className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold text-sm">{t.tutor.studentDetail.visits.noVisits}</p>
                  </div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    {visits.map((visit, idx) => (
                      <motion.div 
                        key={visit.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative pl-12 group"
                      >
                        <div className={cn(
                          "absolute left-0 w-10 h-10 rounded-xl border-4 border-white shadow-sm flex items-center justify-center z-10",
                          visit.type === 'PRESENCIAL' ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                        )}>
                          {visit.type === 'PRESENCIAL' ? <MapPin className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        </div>
                        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 group-hover:bg-white group-hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">
                              {new Date(visit.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <button 
                              onClick={() => handleDeleteVisit(visit.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {visit.location && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{visit.location}
                            </p>
                          )}
                          <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                            "{visit.observations}"
                          </p>
                          {visit.recommendations && (
                            <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 font-medium border border-amber-100">
                              <span className="font-black uppercase tracking-wide text-[9px]">Recomendaciones: </span>
                              {visit.recommendations}
                            </p>
                          )}
                          <div className="mt-4 flex items-center gap-2">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-tighter",
                              visit.type === 'PRESENCIAL' ? "text-emerald-700" : "text-blue-700"
                            )}>
                              {visit.type === 'PRESENCIAL' ? t.tutor.studentDetail.visits.presencial : t.tutor.studentDetail.visits.virtual}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Academic Evaluation Section */}
            <section className="bg-gradient-to-br from-white to-slate-50 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center text-emerald-600">
                      <ClipboardCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#003366]">{t.tutor.studentDetail.evaluation.title}</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.tutor.studentDetail.evaluation.subtitle}</p>
                    </div>
                  </div>
               </div>

               <div className="p-5 md:p-10 space-y-6 md:space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <EvaluationMetric 
                      label={t.tutor.studentDetail.evaluation.metrics.technical.label}
                      description={t.tutor.studentDetail.evaluation.metrics.technical.desc}
                      value={evalScores.technicalSkills} 
                      onChange={(v) => setEvalScores(prev => ({ ...prev, technicalSkills: v }))} 
                    />
                    <EvaluationMetric 
                      label={t.tutor.studentDetail.evaluation.metrics.attitude.label}
                      description={t.tutor.studentDetail.evaluation.metrics.attitude.desc}
                      value={evalScores.attitude} 
                      onChange={(v) => setEvalScores(prev => ({ ...prev, attitude: v }))} 
                    />
                    <EvaluationMetric 
                      label={t.tutor.studentDetail.evaluation.metrics.proactivity.label}
                      description={t.tutor.studentDetail.evaluation.metrics.proactivity.desc}
                      value={evalScores.proactivity} 
                      onChange={(v) => setEvalScores(prev => ({ ...prev, proactivity: v }))} 
                    />
                    <EvaluationMetric 
                      label={t.tutor.studentDetail.evaluation.metrics.punctuality.label}
                      description={t.tutor.studentDetail.evaluation.metrics.punctuality.desc}
                      value={evalScores.punctuality} 
                      onChange={(v) => setEvalScores(prev => ({ ...prev, punctuality: v }))} 
                    />
                    <EvaluationMetric 
                      label={t.tutor.studentDetail.evaluation.metrics.teamwork.label}
                      description={t.tutor.studentDetail.evaluation.metrics.teamwork.desc}
                      value={evalScores.teamwork} 
                      onChange={(v) => setEvalScores(prev => ({ ...prev, teamwork: v }))} 
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <MessageSquare className="w-3 h-3" /> {t.tutor.studentDetail.evaluation.observationsLabel}
                    </label>
                    <textarea 
                      value={evalScores.observations}
                      onChange={(e) => setEvalScores(prev => ({ ...prev, observations: e.target.value }))}
                      placeholder={t.tutor.studentDetail.evaluation.observationsPlaceholder}
                      className="w-full min-h-[150px] p-6 rounded-[2rem] bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-[#003366]/5 focus:border-[#003366] transition-all text-sm font-medium italic shadow-inner"
                    />
                  </div>

                  {businessEval && (
                    <div className="p-6 bg-slate-100 rounded-[2rem] border border-dashed border-slate-300 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-200">
                        <Building2 className="w-5 h-5 text-[#C5A059]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tutor.studentDetail.evaluation.referenceIndustrial}</p>
                        <p className="text-sm font-bold text-[#003366] mt-0.5">{t.tutor.studentDetail.evaluation.referenceIndustrialText}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button 
                      onClick={handleSaveEvaluation}
                      disabled={saving}
                      className="px-10 py-5 bg-[#003366] text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#004488] shadow-2xl shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {t.tutor.studentDetail.evaluation.finishBtn}
                    </button>
                  </div>
               </div>
            </section>
          </div>
        </div>
      </div>

      {/* Visit Modal */}
      <AnimatePresence>
        {isVisitModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsVisitModalOpen(false)}
               className="absolute inset-0 bg-[#003366]/40 backdrop-blur-sm"
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-5 md:p-10 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xl md:text-2xl font-black text-[#003366] tracking-tight">{t.tutor.studentDetail.visits.modalTitle}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t.tutor.studentDetail.visits.modalSubtitle}</p>
              </div>
              <div className="p-5 md:p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.tutor.studentDetail.visits.type}</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setNewVisit(prev => ({ ...prev, type: 'PRESENCIAL' }))}
                      className={cn(
                        "p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2",
                        newVisit.type === 'PRESENCIAL' ? "bg-blue-50 border-[#003366] text-[#003366]" : "bg-white border-slate-100 text-slate-400"
                      )}
                    >
                      <MapPin className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase">{t.tutor.studentDetail.visits.presencial}</span>
                    </button>
                    <button 
                      onClick={() => setNewVisit(prev => ({ ...prev, type: 'VIRTUAL' }))}
                      className={cn(
                        "p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2",
                        newVisit.type === 'VIRTUAL' ? "bg-blue-50 border-[#003366] text-[#003366]" : "bg-white border-slate-100 text-slate-400"
                      )}
                    >
                      <Video className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase">{t.tutor.studentDetail.visits.virtual}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.tutor.studentDetail.visits.date}</label>
                  <input 
                    type="date"
                    value={newVisit.date}
                    onChange={(e) => setNewVisit(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#003366] transition-all font-bold text-[#003366]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.tutor.studentDetail.visits.location}</label>
                  <input
                    type="text"
                    value={newVisit.location ?? ''}
                    onChange={(e) => setNewVisit(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={t.tutor.studentDetail.visits.locationPlaceholder}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#003366] transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.tutor.studentDetail.visits.observations}</label>
                  <textarea 
                    value={newVisit.observations}
                    onChange={(e) => setNewVisit(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder={t.tutor.studentDetail.visits.observationsPlaceholder}
                    className="w-full min-h-[120px] p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#003366] transition-all text-sm font-medium italic"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.tutor.studentDetail.visits.recommendations}</label>
                  <textarea
                    value={newVisit.recommendations ?? ''}
                    onChange={(e) => setNewVisit(prev => ({ ...prev, recommendations: e.target.value }))}
                    placeholder={t.tutor.studentDetail.visits.recommendationsPlaceholder}
                    className="w-full min-h-[80px] p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#003366] transition-all text-sm font-medium italic"
                  />
                </div>

                <div className="pt-6 grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsVisitModalOpen(false)}
                    className="p-5 bg-slate-100 text-[#003366] rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    {t.tutor.studentDetail.visits.cancel}
                  </button>
                  <button 
                    onClick={handleCreateVisit}
                    disabled={saving || !newVisit.observations}
                    className="p-5 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#004488] shadow-lg shadow-blue-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t.tutor.studentDetail.visits.save}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function EvaluationMetric({ label, description, value, onChange }: { 
  label: string; 
  description: string;
  value: number; 
  onChange: (v: number) => void 
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-black text-[#003366] tracking-tight">{label}</span>
        <span className="text-[10px] text-slate-400 font-medium leading-tight">{description}</span>
      </div>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className="group relative"
          >
            <Star 
              className={cn(
                "w-7 h-7 transition-all duration-300",
                star <= value ? "fill-amber-400 text-amber-400 scale-110" : "text-slate-200 hover:text-amber-200"
              )} 
            />
            {star <= value && (
              <motion.div 
                layoutId="star-glow"
                className="absolute inset-0 bg-amber-400/20 blur-lg rounded-full"
              />
            )}
          </button>
        ))}
        <span className="ml-4 text-lg font-black text-[#003366]">{value}/5</span>
      </div>
    </div>
  );
}
