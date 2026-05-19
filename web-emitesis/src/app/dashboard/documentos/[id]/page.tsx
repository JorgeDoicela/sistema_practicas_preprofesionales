"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Edit3,
  ChevronRight,
  User,
  Building2,
  CalendarDays,
  Save,
  Loader2,
  FileCheck,
  FileText,
  MessageSquare,
  PenTool,
  Stamp,
  Activity,
  FileStack
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/api-base";
import { internshipsService } from "@/services/internships.service";
import { documentsService } from "@/services/documents.service";
import { attendancesService } from "@/services/attendances.service";
import { TwoFactorModal } from "@/components/auth/TwoFactorModal";
import type { PdfReviewAnnotationsPayload } from "@/lib/pdf-review-annotations";
import { parseReviewAnnotations } from "@/lib/pdf-review-annotations";
import { useLanguage } from "@/providers/LanguageProvider";

const PdfLoading = () => {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
      {t.documents.detail.pdfViewerLoading}
    </div>
  );
};

const DocumentPdfReviewEditor = dynamic(
  () =>
    import("@/components/documents/DocumentPdfReviewEditor").then((m) => ({
      default: m.DocumentPdfReviewEditor,
    })),
  {
    ssr: false,
    loading: () => <PdfLoading />,
  },
);

export default function DocumentDetailPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const router = useRouter();
  const [internship, setInternship] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form states for dates
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<((code: string) => Promise<void>) | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Review states
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [observations, setObservations] = useState("");
  const [previewedIds, setPreviewedIds] = useState<Set<string>>(new Set());
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);

  const reviewAnnotationsRef = useRef<PdfReviewAnnotationsPayload>({ version: 1, items: [] });
  
  // v5.0 Professional Features
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSyncingSigafi, setIsSyncingSigafi] = useState(false);

  const handleReviewAnnotationsChange = useCallback((p: PdfReviewAnnotationsPayload) => {
    reviewAnnotationsRef.current = p;
  }, []);

  const loadData = useCallback(async () => {
    try {
      const internshipData = await internshipsService.findOne(id as string);
      setInternship(internshipData);
      
      const [docsRes, summary, historyRes]: any[] = await Promise.all([
        documentsService.findByInternship(id as string),
        attendancesService.getSummary(id as string),
        attendancesService.findByInternship(id as string)
      ]);
      
      const docsData = Array.isArray(docsRes) ? docsRes : (Array.isArray(docsRes?.items) ? docsRes.items : []);
      const historyData = Array.isArray(historyRes) ? historyRes : (Array.isArray(historyRes?.items) ? historyRes.items : []);

      setDocuments(docsData);
      setAttendanceSummary(summary);
      setAttendanceHistory(historyData);
      const userStr = localStorage.getItem("user");
      if (userStr) setCurrentUser(JSON.parse(userStr));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, loadData]);

  const handleEditClick = (doc: any) => {
    if (doc.status === 'APROBADO_DEFINITIVO') {
      alert(t.documents.detail.errors.modifiedApproved);
      return;
    }
    setSelectedDoc(doc);
    setStartDate(doc.startDate ? new Date(doc.startDate).toISOString().split('T')[0] : "");
    setDueDate(doc.dueDate ? new Date(doc.dueDate).toISOString().split('T')[0] : "");
    setIsDrawerOpen(true);
  };

  const getStatusLabel = (status: string) => {
    return (t.tutor.documentStatus as any)[status] || status.replace(/_/g, ' ');
  };

  const handleSaveDates = async () => {
    if (!startDate || !dueDate) return;
    if (new Date(startDate) > new Date(dueDate)) {
      alert(t.documents.detail.errors.invalidDateRange);
      return;
    }

    setSaving(true);
    try {
      if (currentUser?.isTwoFactorEnabled) {
          setPendingAction(async (code: string) => {
            await documentsService.updateDates(selectedDoc.id, startDate, dueDate, code);
          });
          setIs2faModalOpen(true);
          setSaving(false);
          return;
      }
      await documentsService.updateDates(selectedDoc.id, startDate, dueDate);
      await loadData();
      setIsDrawerOpen(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReviewClick = async (doc: any) => {
    setSelectedDoc(doc);
    setObservations(doc.observations || "");
    reviewAnnotationsRef.current = parseReviewAnnotations(doc.reviewAnnotations);
    setIsReviewDrawerOpen(true);
    
    // Cargar hilos de comentarios
    setLoadingComments(true);
    try {
      const data = await documentsService.getComments(doc.id);
      setComments(data);
    } catch (e) {
      console.error(t.documents.detail.errors.loadComments);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedDoc) return;
    try {
      const comment = await documentsService.addComment(selectedDoc.id, newComment);
      setComments([...comments, comment]);
      setNewComment("");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSignDocument = async () => {
    if (!selectedDoc || !confirm(t.documents.detail.confirmSign)) return;
    
    setIsSigning(true);
    try {
      if (currentUser?.isTwoFactorEnabled) {
          setPendingAction(async (code: string) => {
            await documentsService.signDocument(selectedDoc.id, "Aprobación institucional", code);
          });
          setIs2faModalOpen(true);
          return;
      }
      await documentsService.signDocument(selectedDoc.id, "Aprobación institucional");
      alert(t.common.success.signed);
      await loadData();
      setIsReviewDrawerOpen(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSigning(false);
    }
  };

  const handlePreviewFile = (doc: any) => {
    setPreviewedIds(prev => new Set(prev).add(doc.id));
    const fullUrl = doc.filePath?.startsWith('http') 
      ? doc.filePath 
      : `${API_URL.replace('/api', '')}${doc.filePath}`;
    window.open(fullUrl, '_blank');
  };

  const handleReviewSubmit = async (type: 'APPROVE' | 'REJECT') => {
    const isCoord = currentUser?.role === 'COORDINADOR';
    const status = isCoord 
      ? (type === 'APPROVE' ? 'APROBADO_DEFINITIVO' : 'RECHAZADO_COORDINADOR')
      : (type === 'APPROVE' ? 'APROBADO_TUTOR' : 'RECHAZADO_TUTOR');

    if (type === 'REJECT' && !observations.trim()) {
      alert(t.documents.detail.errors.observationsRequired);
      return;
    }

    if (type === 'APPROVE' && !previewedIds.has(selectedDoc.id)) {
      if (!confirm(t.documents.detail.errors.previewRecommendation)) {
        return;
      }
    }

    setSaving(true);
    try {
      const reviewPayload = { status, observations, annotations: reviewAnnotationsRef.current };
      
      if (currentUser?.isTwoFactorEnabled) {
          setPendingAction(async (code: string) => {
            if (isCoord) {
              await documentsService.coordinatorReviewDocument(selectedDoc.id, reviewPayload, code);
            } else {
              await documentsService.reviewDocument(selectedDoc.id, reviewPayload, code);
            }
          });
          setIs2faModalOpen(true);
          setSaving(false);
          return;
      }

      if (isCoord) {
        await documentsService.coordinatorReviewDocument(selectedDoc.id, reviewPayload);
      } else {
        await documentsService.reviewDocument(selectedDoc.id, reviewPayload);
      }
      
      alert(t.common.success.generic);
      await loadData();
      setIsReviewDrawerOpen(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handle2faConfirm = async (code: string) => {
      if (!pendingAction) return;
      try {
          const action = (pendingAction as any);
          await action(code);
          alert(t.common.success.generic);
          setIs2faModalOpen(false);
          setPendingAction(null);
          setIsDrawerOpen(false);
          setIsReviewDrawerOpen(false);
          await loadData();
      } catch (error) {
          throw error;
      }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#003366] rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold">{t.documents.detail.loading}</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
        {/* Detail Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-3 md:gap-5 min-w-0">
            <button 
              onClick={() => router.back()}
              className="w-12 h-12 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-all text-[#003366] shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
                {t.documents.detail.documentFile}
              </span>
              <h1 className="text-xl md:text-4xl font-black text-[#003366] tracking-tight truncate">
                {internship?.student?.fullName}
              </h1>
              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 font-medium mt-1">
                <Building2 className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate">{internship?.company?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {internship?.status != null && internship?.status !== "" && (
              <span className="text-[9px] font-black uppercase tracking-widest text-[#003366]">
                {String(internship.status)}
              </span>
            )}
            {currentUser?.role === 'COORDINADOR' && (
              <button 
                onClick={async () => {
                  setIsSyncingSigafi(true);
                  try {
                    const res = await internshipsService.syncSigafi(id as string);
                    alert(`${t.documents.detail.syncSigafi}: ${res.externalData.isEnrolled ? 'Estudiante MATRICULADO' : 'No matriculado'} en ${res.externalData.lastSemester}`);
                  } catch (e: any) {
                    alert(e.message);
                  } finally {
                    setIsSyncingSigafi(false);
                  }
                }}
                disabled={isSyncingSigafi}
                className="flex items-center justify-center gap-2 bg-[#003366] text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#003366]/90 transition-all shadow-lg shadow-blue-900/10"
              >
                {isSyncingSigafi ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                SIGAFI Sync
              </button>
            )}
          </div>
        </section>

        <div className="mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Quick Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] p-5 md:p-8 border border-slate-200 shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#003366]/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-[#003366] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/10">
                   <User className="text-[#C5A059] w-6 h-6" />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#C5A059] mb-4">{t.documents.detail.generalInfo}</h3>
                
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.documents.detail.totalHours}</p>
                    <p className="font-black text-[#003366]">{internship?.totalHours} {t.coordinator.students.kpi.hoursDone ? t.common.date : 'Horas'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.documents.detail.startDate}</p>
                    <p className="font-black text-[#003366] flex items-center gap-2">
                       <CalendarDays className="w-4 h-4 text-slate-300" />
                       {new Date(internship?.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.documents.detail.location}</p>
                    <p className="font-black text-[#003366]">{internship?.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Progress Section */}
            {attendanceSummary && (
              <div className="bg-white rounded-[2rem] p-5 md:p-8 border border-slate-200 shadow-sm">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#C5A059] mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t.documents.detail.attendanceProgress}
                </h3>
                
                <div className="space-y-6">
                  <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${attendanceSummary.progressPercentage}%` }}
                      className="absolute inset-y-0 left-0 bg-emerald-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.documents.detail.completed}</p>
                      <p className="text-xl font-black text-[#003366]">{attendanceSummary.totalHours}h</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.documents.detail.percentage}</p>
                      <p className="text-xl font-black text-emerald-600">{attendanceSummary.progressPercentage}%</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold mb-3 uppercase tracking-widest">{t.documents.detail.latestRecords}</p>
                    <div className="space-y-3">
                      {attendanceHistory.slice(0, 3).map((h: any) => (
                        <div key={h.id} className="flex items-center justify-between text-[11px] font-bold text-[#003366]">
                          <span>{new Date(h.checkIn).toLocaleDateString()}</span>
                          <span className="text-emerald-600">
                            {new Date(h.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#003366] rounded-[2rem] p-5 md:p-8 text-white relative overflow-hidden group">
               <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-0 right-0 w-40 h-40 border-4 border-white rounded-full -mr-20 -mt-20" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 border-2 border-white rounded-full -ml-12 -mb-12" />
               </div>
               
               <div className="relative z-10">
                  <AlertCircle className="w-8 h-8 text-[#C5A059] mb-6" />
                  <h4 className="text-lg font-black tracking-tight mb-2 leading-tight">{t.documents.detail.deadlineConfig}</h4>
                  <p className="text-sm text-white/60 font-medium mb-8 leading-relaxed">
                    {t.documents.detail.deadlineConfigDesc}
                  </p>
               </div>
            </div>
          </div>

          {/* Documents Main List */}
          <div className="lg:col-span-3">
             <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
                   <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                         <Clock className="w-5 h-5 text-[#003366]" />
                      </div>
                      <h2 className="text-base sm:text-xl font-black text-[#003366] tracking-tight">{t.documents.detail.documentFile}</h2>
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                      {documents.length} {t.documents.detail.itemsInFile}
                   </div>
                </div>

                <div className="divide-y divide-slate-100">
                   {documents.map((doc, idx) => (
                      <motion.div 
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50 transition-all group"
                      >
                         <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner",
                              doc.status === 'APROBADO_DEFINITIVO' ? "bg-emerald-50 text-emerald-600" : 
                              doc.status === 'PENDIENTE' ? "bg-slate-50 text-slate-400" : "bg-blue-50 text-blue-600"
                            )}>
                               {doc.status === 'APROBADO_DEFINITIVO' ? <CheckCircle2 className="w-6 h-6" /> : <FileStack className="w-6 h-6" />}
                            </div>

                            <div className="flex-1">
                               <h4 className="font-black text-[#003366] mb-1 group-hover:text-[#C5A059] transition-colors flex flex-wrap items-center gap-2">
                                 {doc.name}
                                 {doc.isCertificateSlot && (
                                   <span className="text-[8px] text-violet-800 font-black tracking-wider">{t.documents.detail.certificate}</span>
                                 )}
                                 {doc.isRequired === false && !doc.isCertificateSlot && (
                                   <span className="text-[8px] text-slate-600 font-black tracking-wider">{t.documents.detail.optional}</span>
                                 )}
                               </h4>
                               <div className="flex flex-wrap gap-4 items-center">
                                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                     <Calendar className="w-3 h-3" />
                                     {t.documents.detail.startLabel} <span className="text-slate-600 font-black">{doc.startDate ? new Date(doc.startDate).toLocaleDateString() : t.documents.detail.notDefined}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                     <XCircle className="w-3 h-3" />
                                     {t.documents.detail.dueLabel} <span className="text-slate-600 font-black">{doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : t.documents.detail.notDefined}</span>
                                  </div>
                                  </div>
                                  {doc.isDigitallySigned && (
                                    <div className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600 flex items-center gap-1.5 animate-pulse">
                                       <Stamp size={10} /> {t.documents.detail.veracitySeal}
                                    </div>
                                  )}
                                  {doc.filePath && (
                                    <button 
                                      onClick={() => handlePreviewFile(doc)}
                                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#C5A059] hover:underline"
                                    >
                                      <FileText className="w-3 h-3" />
                                      {t.documents.detail.viewDelivery}
                                    </button>
                                  )}
                            </div>
                         </div>

                         <div className="flex flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto sm:shrink-0 sm:ml-auto">
                           {doc.status === 'EN_REVISION_TUTOR' && (
                             <button 
                               onClick={() => handleReviewClick(doc)}
                               className="flex flex-1 sm:flex-initial min-w-0 items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-[#C5A059] text-white hover:bg-[#C5A059]/90 shadow-lg shadow-amber-900/10 active:scale-95 transition-all"
                             >
                                <FileCheck className="w-4 h-4 shrink-0" />
                                {t.documents.detail.review}
                             </button>
                           )}
                           
                           <button 
                            onClick={() => handleEditClick(doc)}
                            disabled={doc.status === 'APROBADO_DEFINITIVO'}
                            className={cn(
                              "flex flex-1 sm:flex-initial min-w-0 items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                              doc.status === 'APROBADO_DEFINITIVO' 
                                ? "opacity-50 cursor-not-allowed text-slate-400" 
                                : "bg-[#003366] text-white hover:bg-[#003366]/90 shadow-lg shadow-blue-900/10 active:scale-95"
                            )}
                           >
                              <Edit3 className="w-4 h-4 shrink-0" />
                              {t.documents.detail.dates}
                           </button>
                         </div>
                      </motion.div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Side Drawer for Date Configuration */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-[#003366]/40 backdrop-blur-[2px] z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-[101] flex flex-col"
            >
              <div className="p-4 sm:p-6 md:p-8 lg:p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 gap-3">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-[#003366] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10">
                      <Clock className="text-[#C5A059] w-6 h-6" />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-[#003366] tracking-tight">{t.documents.detail.deliveryWindow}</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t.documents.detail.defineSchedule}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8 overflow-y-auto">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-[#C5A059] mb-3">{t.documents.detail.document}</h4>
                   <p className="font-bold text-[#003366] text-lg leading-tight">{selectedDoc?.name}</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{t.documents.detail.openingDate}</label>
                      <div className="relative group">
                         <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                         <input 
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#003366]/5 focus:border-[#003366] outline-none transition-all font-semibold text-slate-700 hover:bg-white"
                         />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium px-2">{t.documents.detail.openingDateDesc}</p>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{t.documents.detail.dueDate}</label>
                      <div className="relative group">
                         <XCircle className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                         <input 
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#003366]/5 focus:border-[#003366] outline-none transition-all font-semibold text-slate-700 hover:bg-white"
                         />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium px-2 text-rose-400">{t.documents.detail.dueDateDesc}</p>
                   </div>
                </div>

                <div className="pt-6">
                   <div className="bg-[#003366]/5 rounded-2xl p-6 flex gap-4">
                      <AlertCircle className="w-5 h-5 text-[#003366] flex-shrink-0 mt-1" />
                      <p className="text-[11px] text-[#003366]/70 leading-relaxed font-semibold">
                         {t.documents.detail.dateMatchWarning}
                      </p>
                   </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 md:p-8 border-t border-slate-100 bg-white">
                <button 
                  onClick={handleSaveDates}
                  disabled={saving || !startDate || !dueDate}
                  className="w-full h-14 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#003366]/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.documents.detail.processing}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {t.documents.detail.saveChanges}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Review Drawer */}
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
              className="fixed top-0 right-0 z-[101] flex h-full min-h-0 w-full max-w-[min(100vw,1200px)] flex-col bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-emerald-50/30 p-6 lg:p-10">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-[#003366] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10">
                      <FileCheck className="text-[#C5A059] w-6 h-6" />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-[#003366] tracking-tight">{t.documents.detail.reviewTitle}</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t.documents.detail.evaluateDelivery}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsReviewDrawerOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto lg:overflow-hidden p-6 lg:flex-row lg:p-8">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                  <div className="mb-3 shrink-0">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#C5A059]">{t.documents.detail.docToReview}</h4>
                    <p className="font-bold text-[#003366]">{selectedDoc?.name}</p>
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto">
                    {selectedDoc && (
                      <DocumentPdfReviewEditor
                        key={selectedDoc.id}
                        fileUrl={selectedDoc.filePath ? (selectedDoc.filePath.startsWith('http') ? selectedDoc.filePath : `${API_URL.replace('/api', '')}${selectedDoc.filePath}`) : null}
                        initialItems={parseReviewAnnotations(selectedDoc.reviewAnnotations).items}
                        onItemsChange={handleReviewAnnotationsChange}
                      />
                    )}
                  </div>
                  {selectedDoc?.filePath && (
                    <button
                      type="button"
                      onClick={() => handlePreviewFile(selectedDoc)}
                      className="mt-3 shrink-0 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-[10px] font-black uppercase tracking-widest text-[#003366] shadow-sm hover:bg-slate-50"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4" />
                        {t.documents.detail.openPdfNewTab}
                      </span>
                    </button>
                  )}
                </div>

                {/* FEEDBACK THREADS v5.0 */}
                <div className="lg:w-[350px] border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col min-h-0 overflow-y-auto pt-6 lg:pt-0 lg:pl-8">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] mb-4 flex items-center gap-2">
                     <MessageSquare size={14} /> {t.documents.detail.feedbackThread}
                  </h4>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-hide">
                      {loadingComments ? (
                        <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-300" /></div>
                      ) : comments.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-medium italic">{t.documents.detail.noComments}</p>
                      ) : (
                        comments.map((c: any) => (
                          <div key={c.id} className={cn(
                            "p-3 rounded-2xl text-xs",
                            c.userId === currentUser?.id ? "bg-[#003366] text-white ml-4" : "bg-slate-100 text-slate-700 mr-4"
                          )}>
                            <p className="font-black text-[9px] uppercase tracking-widest mb-1 opacity-70">
                              {c.user?.fullName} • {c.user?.role}
                            </p>
                            <p className="leading-relaxed font-medium">{c.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="relative">
                      <input 
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        placeholder={t.documents.detail.writeStudent}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 pr-10 text-[11px] font-bold outline-none focus:ring-2 focus:ring-[#003366]/5"
                      />
                      <button 
                        onClick={handleAddComment}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#003366] hover:scale-110 transition-transform"
                      >
                        <Save size={16} />
                      </button>
                    </div>
                  </div>
                </div>

              <div className="p-4 sm:p-6 md:p-8 border-t border-slate-100 bg-white flex flex-col gap-4">
                <div className="w-full">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] mb-3 flex items-center gap-2">
                      <Edit3 size={14} /> {t.documents.detail.observationsLabel}
                   </h4>
                   <textarea 
                     value={observations}
                     onChange={(e) => setObservations(e.target.value)}
                     placeholder={t.documents.detail.observationsPlaceholder}
                     rows={1}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-[#003366]/5 transition-all resize-none shadow-inner"
                   />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <button 
                  onClick={() => handleReviewSubmit('REJECT')}
                  disabled={saving || (currentUser?.role === 'COORDINADOR' && selectedDoc?.status !== 'APROBADO_TUTOR')}
                  className="h-14 bg-white border-2 border-rose-100 text-rose-600 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  {t.documents.detail.reject}
                </button>

                {currentUser?.role === 'COORDINADOR' && (
                   <button 
                    onClick={handleSignDocument}
                    disabled={isSigning || selectedDoc?.status !== 'APROBADO_TUTOR'}
                    className="h-14 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/20"
                  >
                    {isSigning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Stamp className="w-5 h-5" />}
                    {t.documents.detail.electronicSignature}
                  </button>
                )}

                <button 
                  onClick={() => handleReviewSubmit('APPROVE')}
                  disabled={saving || (currentUser?.role === 'COORDINADOR' && selectedDoc?.status !== 'APROBADO_TUTOR')}
                  className={cn(
                    "h-14 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20",
                    currentUser?.role === 'COORDINADOR' ? "bg-slate-100 text-[#003366]" : "bg-[#003366] text-white"
                  )}
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {currentUser?.role === 'COORDINADOR' ? t.documents.detail.approveWithoutSigning : t.documents.detail.approve}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
      <TwoFactorModal 
        isOpen={is2faModalOpen}
        onClose={() => {
            setIs2faModalOpen(false);
            setPendingAction(null);
        }}
        onConfirm={handle2faConfirm}
      />
      </div>
    </DashboardLayout>
  );
}
