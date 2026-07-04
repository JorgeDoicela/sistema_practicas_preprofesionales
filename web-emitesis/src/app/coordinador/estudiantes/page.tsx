"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  Filter,
  FileBadge,
  BrainCircuit,
  History,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  FileCheck,
  FileText,
  ChevronRight,
  Building2,
  Users,
  FileSpreadsheet,
  Zap,
  Clock,
  AlertCircle,
  Loader2,
  PauseCircle,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";
import { documentsService } from "@/services/documents.service";
import { attendancesService } from "@/services/attendances.service";
import { certificationService, EligibilityResponse } from "@/services/certification.service";
import { reportsService } from "@/services/reports.service";
import type { PdfReviewAnnotationsPayload } from "@/lib/pdf-review-annotations";
import { parseReviewAnnotations } from "@/lib/pdf-review-annotations";
import { aiService } from "@/services/ai.service";
import { useLanguage } from "@/providers/LanguageProvider";
import { toast } from "sonner";

const DocumentPdfReviewEditor = dynamic(
  () =>
    import("@/components/documents/DocumentPdfReviewEditor").then((m) => ({
      default: m.DocumentPdfReviewEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Cargando visor...
      </div>
    ),
  },
);

export default function GestionEstudiantesPage() {
  const { t } = useLanguage();
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Review states
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedInternshipId, setExpandedInternshipId] = useState<string | null>(null);

  const [attendanceData, setAttendanceData] = useState<Record<string, { summary: any, history: any[] }>>({});
  const [attendanceFilters, setAttendanceFilters] = useState<Record<string, { startDate: string, endDate: string }>>({});
  const [eligibilityData, setEligibilityData] = useState<Record<string, EligibilityResponse>>({});
  const [generatingCertId, setGeneratingCertId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});
  const [docVersions, setDocVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Estado: modal Suspender / Retirar / Reactivar
  const [statusModal, setStatusModal] = useState<{ internshipId: string; action: 'Suspendida' | 'Retirada' | 'En Proceso' } | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);

  // Estados 2FA y Seguridad
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isTwoFactorRequired, setIsTwoFactorRequired] = useState(false);

  const reviewAnnotationsRef = useRef<PdfReviewAnnotationsPayload>({ version: 1, items: [] });
  const handleReviewAnnotationsChange = useCallback((p: PdfReviewAnnotationsPayload) => {
    reviewAnnotationsRef.current = p;
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Pasar careerId del coordinador para aislamiento de datos (obligatorio en el backend)
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const careerId = user ? user.careerId : undefined;
      
      // Detectar si el usuario coordinador tiene 2FA habilitado
      setIsTwoFactorRequired(!!user?.isTwoFactorEnabled);

      const res: any = await internshipsService.findAll(1, 200, careerId);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
      setInternships(list);
    } catch (error) {
      console.error("Error loading internships:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInternshipDetails = async (id: string, f?: { startDate: string, endDate: string }) => {
    try {
      const [summaryRes, historyRes, eligibilityRes] = await Promise.allSettled([
        attendancesService.getSummary(id),
        attendancesService.findByInternship(id, f?.startDate, f?.endDate),
        certificationService.checkEligibility(id)
      ]);
      
      const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : null;
      const history = historyRes.status === 'fulfilled' ? historyRes.value : [];
      const eligibility = eligibilityRes.status === 'fulfilled' ? eligibilityRes.value : null;

      setAttendanceData(prev => ({ 
        ...prev, 
        [id]: { 
          summary: summary || prev[id]?.summary || { totalHours: 0, requiredHours: 0, progressPercentage: 0 }, 
          history: Array.isArray(history) ? history : [] 
        } 
      }));
      
      if (eligibility) {
        setEligibilityData(prev => ({ ...prev, [id]: eligibility }));
      }
    } catch (error) {
      console.error("Error loading details:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (expandedInternshipId) {
      loadInternshipDetails(expandedInternshipId);
    }
  }, [expandedInternshipId]);

  const filteredInternships = internships.filter(i => {
    const matchesSearch = i.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         i.company.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleReviewClick = async (doc: any, internshipId: string) => {
    setSelectedDoc({ ...doc, internshipId });
    setObservations(doc.observations || "");
    setTwoFactorCode(""); // Reiniciar código 2FA
    reviewAnnotationsRef.current = parseReviewAnnotations(doc.reviewAnnotations);
    setIsReviewDrawerOpen(true);
    
    // Cargar historial de versiones
    try {
      setLoadingVersions(true);
      const versions = await documentsService.getVersions(doc.id);
      setDocVersions(versions);
    } catch (e) {
      console.error("Error loading doc versions", e);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleReviewSubmit = async (status: 'APROBADO_DEFINITIVO' | 'RECHAZADO_COORDINADOR') => {
    if (status === 'RECHAZADO_COORDINADOR' && !observations.trim()) {
      toast.error(t.coordinator.students.drawerReview.errorObs);
      return;
    }

    if (isTwoFactorRequired && !twoFactorCode.trim()) {
      toast.error("El código de doble factor (2FA) es obligatorio para completar esta acción.");
      return;
    }

    setSaving(true);
    try {
      await documentsService.coordinatorReviewDocument(selectedDoc.id, {
        status,
        observations,
        annotations: reviewAnnotationsRef.current,
      }, twoFactorCode);
      toast.success(status === 'APROBADO_DEFINITIVO' ? t.common.success.generic : t.common.success.generic);
      
      // Recargar datos para actualizar elegibilidad
      await loadData();
      if (expandedInternshipId) {
         const eligibility = await certificationService.checkEligibility(expandedInternshipId);
         setEligibilityData(prev => ({ ...prev, [expandedInternshipId]: eligibility }));
      }
      
      setIsReviewDrawerOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || t.common.errors.generic);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCertificate = async (internshipId: string) => {
    if (!confirm(t.coordinator.students.cert.confirm)) {
      return;
    }

    setGeneratingCertId(internshipId);
    try {
      const result = await certificationService.generateCertificate(internshipId);
      toast.success(t.common.success.generic);
      window.open(result.url, '_blank');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t.coordinator.students.errors.cert);
    } finally {
      setGeneratingCertId(null);
    }
  };

  const handleExportAttendance = async (internshipId: string) => {
    try {
      await reportsService.exportAttendanceExcel(internshipId);
    } catch (error) {
      toast.error(t.coordinator.students.errors.exportAttendance);
    }
  };

  const handleChangeStatus = async () => {
    if (!statusModal || !statusReason.trim()) return;
    setChangingStatus(true);
    try {
      await internshipsService.changeStatus(statusModal.internshipId, statusModal.action, statusReason.trim());
      await loadData();
      setStatusModal(null);
      setStatusReason("");
    } catch (error: any) {
      toast.error(error.message || t.coordinator.students.errors.changeStatus);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAIAnalysis = async (i: any, att: any) => {
    setAnalyzingId(i.id);
    try {
      const documents = Array.isArray(i.documents) ? i.documents : [];
      const indicators = {
        healthScore: i.healthScore || 0,
        docsApproved: documents.filter((d: any) => d.status === 'APROBADO_DEFINITIVO').length,
        docsTotal: documents.length,
        hoursDone: att?.summary?.totalHours || 0,
        hoursTotal: i.totalHours || 0,
        daysActive: i.startDate ? Math.max(0, Math.floor((new Date().getTime() - new Date(i.startDate).getTime()) / (1000 * 60 * 60 * 24))) : 0
      };
      
      const res = await aiService.getRiskAssessment(indicators);
      setAiAnalysis(prev => ({ ...prev, [i.id]: res }));
    } catch (e) {
      console.error("AI Analysis error:", e);
      toast.error(t.coordinator.students.errors.aiAnalysis);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-[1600px] mx-auto pb-20">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block animate-in fade-in slide-in-from-left-4 duration-700">{t.coordinator.students.subtitle}</span>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">
              {t.coordinator.students.title.split(" ")[0]} <span className="text-slate-400">{t.coordinator.students.title.split(" ").slice(1).join(" ")}</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">{t.coordinator.students.description}</p>
          </div>
          
          <div className="flex items-center gap-4" data-tour="estudiantes-search">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                <input 
                  type="text"
                  placeholder={t.coordinator.students.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-3 md:py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-[350px] outline-none focus:ring-4 focus:ring-[#003366]/5 focus:border-[#003366] transition-all font-medium text-sm shadow-sm"
                />
             </div>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.students.loading}</p>
          </div>
        ) : (
          <div className="grid gap-6" data-tour="estudiantes-table">
            {filteredInternships.map((internship) => (
              <StudentInternshipCard 
                key={internship.id}
                internship={internship}
                attendance={attendanceData[internship.id]}
                eligibility={eligibilityData[internship.id]}
                attendanceFilters={attendanceFilters[internship.id] || { startDate: "", endDate: "" }}
                setAttendanceFilters={(f: any) => setAttendanceFilters(prev => ({ ...prev, [internship.id]: f }))}
                onApplyAttendanceFilter={() => loadInternshipDetails(internship.id, attendanceFilters[internship.id])}
                isExpanded={expandedInternshipId === internship.id}
                generating={generatingCertId === internship.id}
                onToggle={() => setExpandedInternshipId(expandedInternshipId === internship.id ? null : internship.id)}
                onReviewClick={handleReviewClick}
                onGenerateCertificate={() => handleGenerateCertificate(internship.id)}
                onExportAttendance={handleExportAttendance}
                onChangeStatus={(action: 'Suspendida' | 'Retirada' | 'En Proceso') => { setStatusModal({ internshipId: internship.id, action }); setStatusReason(""); }}
                onAIAnalyze={() => handleAIAnalysis(internship, attendanceData[internship.id])}
                analyzing={analyzingId === internship.id}
                analysis={aiAnalysis[internship.id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Coordinator Review Drawer */}
      <AnimatePresence>
        {isReviewDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewDrawerOpen(false)}
              className="fixed inset-0 bg-[#003366]/40 backdrop-blur-[2px] z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="fixed top-0 right-0 z-[101] flex h-full min-h-0 w-full max-w-[min(100vw,1180px)] flex-col bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-emerald-50/30 p-6 lg:p-10">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-[#003366] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10">
                      <FileCheck className="text-[#C5A059] w-6 h-6" />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-[#003366] tracking-tight">{t.coordinator.students.drawerReview.title}</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t.coordinator.students.drawerReview.subtitle}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsReviewDrawerOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-6 lg:flex-row lg:p-8">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                  <div className="mb-3 shrink-0">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#C5A059]">{t.coordinator.students.drawerReview.doc}</h4>
                    <p className="font-bold text-[#003366]">{selectedDoc?.name}</p>
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto">
                    {selectedDoc && (
                      <DocumentPdfReviewEditor
                        key={selectedDoc.id}
                        fileUrl={selectedDoc.filePath}
                        initialItems={parseReviewAnnotations(selectedDoc.reviewAnnotations).items}
                        onItemsChange={handleReviewAnnotationsChange}
                      />
                    )}
                  </div>
                  {selectedDoc?.filePath && (
                    <a
                      href={selectedDoc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-[10px] font-black uppercase tracking-widest text-[#003366] shadow-sm hover:bg-slate-50"
                    >
                      <FileText className="h-4 w-4" />
                      {t.coordinator.students.drawerReview.openPdf}
                    </a>
                  )}
                </div>

                <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[360px] lg:border-l lg:border-slate-100 lg:pl-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {t.coordinator.students.drawerReview.observations}
                  </label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder={t.coordinator.students.drawerReview.placeholderObs}
                    className="min-h-[140px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none transition-all hover:bg-white focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/5"
                  />
                  <div className="rounded-2xl border border-amber-100/50 bg-amber-50 p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <p className="text-[10px] font-bold leading-relaxed text-amber-800">
                        {t.coordinator.students.drawerReview.warning}
                      </p>
                    </div>
                  </div>

                  {isTwoFactorRequired && (
                    <div className="space-y-2 mt-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#003366] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#C5A059] animate-pulse" />
                        Código de Seguridad 2FA <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ej. 123456"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-center tracking-[0.3em] outline-none focus:border-[#003366] transition-all"
                      />
                    </div>
                  )}

                  {/* Historial de Versiones */}
                  <div className="mt-4 flex flex-col gap-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#003366] flex items-center gap-2">
                       <History className="w-3.5 h-3.5 text-[#C5A059]" />
                       {t.coordinator.students.drawerReview.history}
                    </h4>
                    
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                       {loadingVersions ? (
                         <div className="py-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-slate-300" /></div>
                       ) : docVersions.length === 0 ? (
                         <p className="text-[10px] text-slate-400 italic">{t.coordinator.students.drawerReview.noHistory}</p>
                       ) : (
                         docVersions.map((v: any, idx: number) => (
                           <div key={v.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group">
                              <div className="flex-1 min-w-0">
                                 <p className="text-[9px] font-black text-[#003366] uppercase">{t.coordinator.students.drawerReview.version} {docVersions.length - idx}</p>
                                 <p className="text-[10px] text-slate-400 font-medium truncate">{new Date(v.createdAt).toLocaleString()}</p>
                              </div>
                              <a 
                                href={v.filePath} 
                                target="_blank" 
                                className="p-2 bg-white text-slate-400 rounded-lg hover:text-emerald-600 border border-slate-100 transition-colors shadow-sm"
                                title="Ver esta versión"
                              >
                                 <Download className="w-3.5 h-3.5" />
                              </a>
                           </div>
                         ))
                       )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-10 border-t border-slate-100 bg-white grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleReviewSubmit('RECHAZADO_COORDINADOR')}
                  disabled={saving || !observations.trim()}
                  className="h-14 bg-white border-2 border-rose-100 text-rose-600 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  {t.coordinator.students.drawerReview.reject}
                </button>
                <button 
                  onClick={() => handleReviewSubmit('APROBADO_DEFINITIVO')}
                  disabled={saving}
                  className="h-14 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#003366]/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {t.coordinator.students.drawerReview.approve}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Modal Suspender / Retirar práctica */}
      <AnimatePresence>
        {statusModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStatusModal(null)}
              className="fixed inset-0 bg-[#003366]/50 backdrop-blur-[2px] z-[200]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed z-[201] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100vw-2rem,28rem)] max-w-md bg-white rounded-[2rem] shadow-2xl p-5 sm:p-8 max-h-[min(90vh,40rem)] overflow-y-auto"
            >
                <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-5",
                statusModal.action === 'Suspendida' ? "bg-amber-50 text-amber-600" :
                statusModal.action === 'En Proceso' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {statusModal.action === 'Suspendida' ? <PauseCircle className="w-6 h-6" /> :
                 statusModal.action === 'En Proceso' ? <CheckCircle2 className="w-6 h-6" /> :
                 <LogOut className="w-6 h-6" />}
              </div>
              <h3 className="text-xl font-black text-[#003366] mb-1">
                {statusModal.action === 'Suspendida' ? t.coordinator.students.modalStatus.suspend.title :
                 statusModal.action === 'En Proceso' ? t.coordinator.students.modalStatus.reactivate.title : t.coordinator.students.modalStatus.withdraw.title}
              </h3>
              <p className="text-sm text-slate-500 font-medium mb-6">
                {statusModal.action === 'Suspendida'
                  ? t.coordinator.students.modalStatus.suspend.desc
                  : statusModal.action === 'En Proceso'
                  ? t.coordinator.students.modalStatus.reactivate.desc
                  : t.coordinator.students.modalStatus.withdraw.desc}
              </p>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                {t.coordinator.students.modalStatus.reason} <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder={t.coordinator.students.modalStatus.placeholder}
                className="w-full min-h-[100px] p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#003366] transition-all text-sm font-medium mb-6"
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStatusModal(null)}
                  className="h-12 bg-slate-100 text-[#003366] rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  {t.coordinator.students.modalStatus.cancel}
                </button>
                <button
                  onClick={handleChangeStatus}
                  disabled={changingStatus || !statusReason.trim()}
                  className={cn(
                    "h-12 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50",
                    statusModal.action === 'Suspendida' ? "bg-amber-500 text-white hover:bg-amber-600" :
                    statusModal.action === 'En Proceso' ? "bg-emerald-500 text-white hover:bg-emerald-600" :
                    "bg-rose-500 text-white hover:bg-rose-600"
                  )}
                >
                  {changingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {t.coordinator.students.modalStatus.confirm}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function StudentInternshipCard({ 
  internship, 
  attendance, 
  eligibility, 
  attendanceFilters,
  setAttendanceFilters,
  onApplyAttendanceFilter,
  isExpanded, 
  generating, 
  onToggle, 
  onReviewClick, 
  onGenerateCertificate,
  onExportAttendance,
  onChangeStatus,
  onAIAnalyze,
  analyzing,
  analysis
}: any) {
  const { t } = useLanguage();
  const documents = Array.isArray(internship.documents) ? internship.documents : [];
  const pendingDocs = documents.filter((d: any) => d.status === 'APROBADO_TUTOR').length;

  return (
    <div className={cn(
      "bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden",
      isExpanded ? "border-[#C5A059] shadow-2xl shadow-amber-900/10 ring-1 ring-[#C5A059]/20" : "border-slate-200 shadow-sm hover:shadow-md"
    )}>
      <div 
        onClick={onToggle}
        className="p-5 md:p-8 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-4 md:gap-8">
           <div className={cn(
             "w-12 h-12 md:w-16 md:h-16 rounded-[1.25rem] md:rounded-[1.75rem] flex items-center justify-center text-lg md:text-xl font-black transition-all duration-500 shrink-0",
             isExpanded ? "bg-[#003366] text-white scale-110 rotate-3 shadow-lg shadow-blue-900/20" : "bg-slate-50 text-[#003366] group-hover:bg-slate-100 group-hover:scale-105"
           )}>
             {internship.student.fullName.charAt(0)}
           </div>
           
           <div className="min-w-0">
              <h3 className="text-base md:text-xl font-black text-[#003366] mb-1 group-hover:text-[#C5A059] transition-colors truncate">{internship.student.fullName}</h3>
              <div className="flex flex-wrap gap-2 md:gap-6 items-center">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                    {internship.company.name}
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#C5A059]">
                    <Users className="w-3.5 h-3.5" />
                    {t.coordinator.students.card.tutor}: <span className="text-[#003366]">{internship.tutor.fullName}</span>
                 </div>
                 {internship.career && (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#003366]">
                       <Building2 className="w-3.5 h-3.5 text-[#C5A059]" />
                       {t.coordinator.students.card.career}: {internship.career.name}
                    </div>
                  )}
                  {internship.finalGrade > 0 && (
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#003366]">
                        <FileBadge className="w-3.5 h-3.5 text-[#C5A059]" />
                        {t.coordinator.students.card.finalGrade}: {internship.finalGrade.toFixed(2)}
                     </div>
                  )}
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    <Clock className="w-3.5 h-3.5" />
                    {t.coordinator.students.card.progress}: {attendance?.summary?.progressPercentage || 0}%
                 </div>
                 {internship.status === 'Finalizado' && (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t.coordinator.students.card.completed}
                    </div>
                 )}
                 {internship.status === 'Suspendida' && (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-700">
                        <PauseCircle className="w-3.5 h-3.5" />
                        {t.coordinator.students.card.suspended}
                    </div>
                 )}
                 {internship.status === 'Retirada' && (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-700">
                        <LogOut className="w-3.5 h-3.5" />
                        {t.coordinator.students.card.withdrawn}
                    </div>
                 )}
              </div>
           </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end shrink-0">
           {pendingDocs > 0 && internship.status !== 'Finalizado' && (
             <div className="flex items-center gap-3 animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-900/20" />
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                  {t.coordinator.students.card.pendingReview.replace("{count}", pendingDocs.toString())}
                </span>
             </div>
           )}
           <div className={cn(
             "w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 transition-transform duration-500",
             isExpanded && "bg-[#C5A059] text-white rotate-180"
           )}>
              <ChevronRight className="w-5 h-5" />
           </div>
           <button 
              onClick={(e) => { e.stopPropagation(); onExportAttendance(internship.id); }}
              className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all flex items-center justify-center group/btn"
              title="Exportar Asistencia (Excel)"
            >
               <FileSpreadsheet className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </button>
            {internship.status === 'En Proceso' && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onChangeStatus('Suspendida'); }}
                  className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all flex items-center justify-center group/btn"
                  title="Suspender práctica"
                >
                  <PauseCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onChangeStatus('Retirada'); }}
                  className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center group/btn"
                  title="Retirar estudiante"
                >
                  <LogOut className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                </button>
              </>
            )}
            {internship.status === 'Suspendida' && (
              <button
                onClick={(e) => { e.stopPropagation(); onChangeStatus('En Proceso'); }}
                className="p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center justify-center group/btn"
                title="Reactivar práctica"
              >
                <CheckCircle2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              </button>
            )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
          >
            <div className="p-4 md:p-8 space-y-8 md:space-y-10">
               {/* Sección de IA Predictiva */}
               <div className="bg-gradient-to-br from-[#003366] to-[#001122] rounded-[2rem] p-5 sm:p-6 md:p-8 text-white relative overflow-hidden group/ia" data-tour="student-ai-risk">
                  <div className="absolute top-0 right-0 p-4 md:p-8 lg:p-10 opacity-5 rotate-12 group-hover/ia:rotate-0 transition-transform duration-1000">
                     <BrainCircuit className="w-24 h-24 sm:w-32 sm:h-32" />
                  </div>
                  <div className="relative z-10">
                     <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                           <div className="p-2 bg-[#C5A059] rounded-xl text-white shrink-0">
                              <Zap className="w-4 h-4" />
                           </div>
                           <h4 className="text-sm font-black uppercase tracking-widest text-[#C5A059]">{t.coordinator.students.ai.title}</h4>
                        </div>
                        <button 
                           onClick={(e) => { e.stopPropagation(); onAIAnalyze(); }}
                           disabled={analyzing}
                           className="w-full sm:w-auto shrink-0 px-4 sm:px-6 py-2.5 sm:py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-sm border border-white/10 disabled:opacity-50"
                        >
                           {analyzing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                           ) : (
                              t.coordinator.students.ai.button
                           )}
                        </button>
                     </div>
                     <AnimatePresence mode="wait">
                        {analysis ? (
                           <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white/5 rounded-2xl p-6 border border-white/5"
                           >
                              <p className="text-xs font-medium leading-relaxed italic text-blue-100/90 tracking-wide">
                                 “{analysis}”
                              </p>
                           </motion.div>
                        ) : (
                           <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest pl-1">
                              {t.coordinator.students.ai.description}
                           </p>
                        )}
                     </AnimatePresence>
                  </div>
               </div>

               {/* Dashboard de Requisitos */}
               {eligibility && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-4 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm" data-tour="student-eligibility">
                    <div className="space-y-4 md:border-r border-slate-100 md:pr-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.coordinator.students.kpi.docs}</h4>
                       <div className="flex items-end gap-3">
                          <span className="text-2xl md:text-3xl font-black text-[#003366]">{eligibility.details.approvedDocsCount < (eligibility.details.totalRequiredDocs || 7) ? (
                             <span className="text-rose-500">{eligibility.details.approvedDocsCount}</span>
                          ) : (
                             <span className="text-emerald-500">{eligibility.details.totalRequiredDocs || 7}</span>
                          )}/{eligibility.details.totalRequiredDocs || 7}</span>
                          <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase">{t.coordinator.students.kpi.approved}</span>
                       </div>
                       <p className="text-[11px] font-medium text-slate-500 leading-tight">
                          {eligibility.details.missingDocs.length > 0 
                            ? t.coordinator.students.kpi.pending.replace("{list}", eligibility.details.missingDocs.join(', '))
                            : t.coordinator.students.kpi.allApproved}
                       </p>
                       <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Evaluaciones Obligatorias</h5>
                          <div className="flex gap-4">
                            <span className={cn(
                              "text-[10px] font-bold flex items-center gap-1",
                              eligibility.details.hasAcademica ? "text-emerald-600" : "text-rose-500"
                            )}>
                              {eligibility.details.hasAcademica ? "✓ Académica" : "✗ Académica"}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold flex items-center gap-1",
                              eligibility.details.hasEmpresarial ? "text-emerald-600" : "text-rose-500"
                            )}>
                              {eligibility.details.hasEmpresarial ? "✓ Empresarial" : "✗ Empresarial"}
                            </span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 md:border-r border-slate-100 md:pr-4 md:pl-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.coordinator.students.kpi.attendance}</h4>
                       <div className="flex items-end gap-3">
                          <span className={cn(
                             "text-2xl md:text-3xl font-black",
                             eligibility.details.hoursMet ? "text-emerald-500" : "text-rose-500"
                          )}>{eligibility.details.totalHours}h</span>
                          <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase">{t.coordinator.students.kpi.of} {eligibility.details.requiredHours}h</span>
                       </div>
                       <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                             className={cn(
                                "h-full transition-all duration-1000",
                                eligibility.details.hoursMet ? "bg-emerald-500" : "bg-rose-500"
                             )}
                             style={{ width: `${Math.min(100, (eligibility.details.totalHours / eligibility.details.requiredHours) * 100)}%` }}
                          />
                       </div>
                    </div>

                    <div className="flex flex-col justify-center pl-4" data-tour="student-certification">
                       {internship.status === 'Finalizado' ? (
                          <div className="text-center p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                             <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                             <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{t.coordinator.students.cert.finished}</p>
                             <button 
                                onClick={(e) => { e.stopPropagation(); const doc = documents.find((d:any) => d.name === 'Certificado de culminación'); if(doc?.filePath) window.open(doc.filePath, '_blank') }}
                                className="mt-2 text-[10px] font-bold text-[#003366] hover:underline"
                             >
                                {t.coordinator.students.cert.download}
                             </button>
                          </div>
                       ) : (
                          <button 
                            disabled={!eligibility.eligible || generating}
                            onClick={(e) => { e.stopPropagation(); onGenerateCertificate(); }}
                            className={cn(
                               "w-full h-16 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl",
                               eligibility.eligible 
                                 ? "bg-[#003366] text-white hover:bg-[#003366]/90 shadow-blue-900/20" 
                                 : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                            )}
                          >
                             {generating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                             ) : (
                                <FileBadge className="w-6 h-6 text-[#C5A059]" />
                             )}
                             <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t.coordinator.students.cert.generate}</span>
                          </button>
                       )}
                       {!eligibility.eligible && internship.status !== 'Finalizado' && (
                          <p className="text-[9px] text-center mt-3 text-rose-500 font-bold uppercase tracking-widest animate-pulse">
                             {t.coordinator.students.cert.incomplete}
                          </p>
                       )}
                    </div>
                 </div>
               )}

               <div className="grid lg:grid-cols-2 gap-6 md:gap-10 opacity-80 filter grayscale-[0.3]">
                  {/* Columna Izquierda: Documentos */}
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 pl-2 flex items-center gap-3">
                       <FileText className="w-4 h-4" />
                       {t.coordinator.students.expediente.title}
                     </h4>
                     <div className="grid gap-3">
                        {documents.map((doc: any) => (
                          <div 
                            key={doc.id}
                            className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group"
                          >
                             <div className="flex items-center gap-4">
                                <div className={cn(
                                  "flex items-center justify-center",
                                  doc.status === 'APROBADO_DEFINITIVO' ? "text-emerald-600" :
                                  doc.status === 'APROBADO_TUTOR' ? "text-blue-600" : "text-slate-400"
                                )}>
                                   {doc.status === 'APROBADO_DEFINITIVO' ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <div>
                                   <p className="text-[11px] font-bold text-[#003366] line-clamp-1">{doc.name}</p>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                       {(t.tutor.documentStatus as any)[doc.status] || doc.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                {doc.status === 'APROBADO_TUTOR' && internship.status !== 'Finalizado' && (
                                   <button onClick={() => onReviewClick(doc, internship.id)} className="p-2 bg-amber-50 text-[#C5A059] rounded-lg hover:bg-amber-500 hover:text-white transition-all"><FileCheck className="w-4 h-4" /></button>
                                )}
                                {doc.filePath && <a href={doc.filePath} target="_blank" className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-[#003366] hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></a>}
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Columna Derecha: Asistencia */}
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 pl-2 flex items-center gap-3">
                       <Clock className="w-4 h-4" />
                       {t.coordinator.students.expediente.history}
                     </h4>

                     <div className="flex items-end gap-3 bg-white p-4 rounded-2xl border border-slate-100 mb-4 shadow-sm">
                        <div className="space-y-1 flex-1">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.coordinator.students.expediente.since}</label>
                           <input 
                              type="date" 
                              value={attendanceFilters.startDate}
                              onChange={(e) => setAttendanceFilters({...attendanceFilters, startDate: e.target.value})}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-blue-500"
                           />
                        </div>
                        <div className="space-y-1 flex-1">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.coordinator.students.expediente.until}</label>
                           <input 
                              type="date" 
                              value={attendanceFilters.endDate}
                              onChange={(e) => setAttendanceFilters({...attendanceFilters, endDate: e.target.value})}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-blue-500"
                           />
                        </div>
                        <button 
                           onClick={onApplyAttendanceFilter}
                           className="px-4 py-2 bg-[#003366] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#004488] transition-colors h-[33px]"
                        >
                           <Search className="w-3 h-3" />
                        </button>
                     </div>
                     
                     {/* Historial de estados */}
                     {internship.statusHistory && internship.statusHistory.length > 0 && (
                       <div className="mb-5">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{t.coordinator.students.expediente.statusHistory}</p>
                         <div className="space-y-2">
                           {internship.statusHistory.slice(0, 5).map((s: any) => (
                             <div key={s.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                               <div className={cn(
                                 "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                 s.newStatus === 'Finalizado' ? "bg-green-500" :
                                 s.newStatus === 'Suspendida' ? "bg-amber-500" :
                                 s.newStatus === 'Retirada' ? "bg-red-500" : "bg-blue-500"
                               )} />
                               <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 flex-wrap">
                                   <span className="text-[10px] font-black text-[#003366]">{s.newStatus}</span>
                                   {s.oldStatus && <span className="text-[10px] text-slate-400">← {s.oldStatus}</span>}
                                   <span className="text-[10px] text-slate-300">{new Date(s.createdAt).toLocaleDateString()}</span>
                                 </div>
                                 {s.reason && <p className="text-xs text-slate-500 mt-0.5 truncate">{t.coordinator.students.expediente.reason}: {s.reason}</p>}
                                 {s.changedBy && <p className="text-[10px] text-slate-400">{t.coordinator.students.expediente.by}: {s.changedBy.fullName}</p>}
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     {!attendance ? (
                        <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" /></div>
                     ) : (
                       <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden overflow-x-auto">
                          <table className="w-full text-[10px] min-w-[500px]">
                             <thead className="bg-slate-50 border-b">
                                <tr>
                                   <th className="px-4 py-3 text-left font-black uppercase text-slate-400">{t.coordinator.students.expediente.table.date}</th>
                                   <th className="px-4 py-3 text-left font-black uppercase text-slate-400">{t.coordinator.students.expediente.table.checkIn}</th>
                                   <th className="px-4 py-3 text-left font-black uppercase text-slate-400">{t.coordinator.students.expediente.table.checkOut}</th>
                                   <th className="px-4 py-3 text-left font-black uppercase text-slate-400">{t.coordinator.students.expediente.table.activities}</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y text-slate-400">
                                {attendance.history.slice(0, 5).map((h: any) => (
                                   <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-4 py-3 font-bold">{new Date(h.checkIn).toLocaleDateString()}</td>
                                      <td className="px-4 py-3 font-bold">{new Date(h.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                      <td className="px-4 py-3 font-bold">{h.checkOut ? new Date(h.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                      <td className="px-4 py-3 max-w-[180px]">
                                        {h.activityDescription
                                          ? <span className="text-slate-600 line-clamp-2">{h.activityDescription}</span>
                                          : <span className="text-slate-300">—</span>}
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                     )}
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
