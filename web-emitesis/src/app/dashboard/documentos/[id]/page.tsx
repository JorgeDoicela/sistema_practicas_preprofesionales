"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";
import { documentsService } from "@/services/documents.service";
import { attendancesService } from "@/services/attendances.service";
import { TwoFactorModal } from "@/components/auth/TwoFactorModal";
import type { PdfReviewAnnotationsPayload } from "@/lib/pdf-review-annotations";
import { parseReviewAnnotations } from "@/lib/pdf-review-annotations";

const DocumentPdfReviewEditor = dynamic(
  () =>
    import("@/components/documents/DocumentPdfReviewEditor").then((m) => ({
      default: m.DocumentPdfReviewEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Cargando visor PDF…
      </div>
    ),
  },
);

export default function DocumentDetailPage() {
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
      alert("No se pueden modificar las fechas de un documento aprobado definitivamente.");
      return;
    }
    setSelectedDoc(doc);
    setStartDate(doc.startDate ? new Date(doc.startDate).toISOString().split('T')[0] : "");
    setDueDate(doc.dueDate ? new Date(doc.dueDate).toISOString().split('T')[0] : "");
    setIsDrawerOpen(true);
  };

  const handleSaveDates = async () => {
    if (!startDate || !dueDate) return;
    if (new Date(startDate) > new Date(dueDate)) {
      alert("La fecha de inicio debe ser anterior a la fecha de vencimiento.");
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
      console.error("Error al cargar comentarios");
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
    if (!selectedDoc || !confirm("¿Confirma que desea aplicar la FIRMA ELECTRÓNICA institucional a este documento? Esta acción es definitiva.")) return;
    
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
      alert("Documento firmado con éxito");
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
    window.open(doc.filePath, '_blank');
  };

  const handleReviewSubmit = async (status: 'APROBADO_TUTOR' | 'RECHAZADO_TUTOR') => {
    if (status === 'RECHAZADO_TUTOR' && !observations.trim()) {
      alert("Las observaciones son obligatorias para rechazar el documento.");
      return;
    }

    if (status === 'APROBADO_TUTOR' && !previewedIds.has(selectedDoc.id)) {
      if (!confirm("Se recomienda visualizar el documento antes de aprobarlo. ¿Desea continuar con la aprobación?")) {
        return;
      }
    }

    setSaving(true);
    try {
      if (currentUser?.isTwoFactorEnabled) {
          setPendingAction(async (code: string) => {
            await documentsService.reviewDocument(
              selectedDoc.id,
              { status, observations, annotations: reviewAnnotationsRef.current },
              code,
            );
          });
          setIs2faModalOpen(true);
          setSaving(false);
          return;
      }
      await documentsService.reviewDocument(selectedDoc.id, {
        status,
        observations,
        annotations: reviewAnnotationsRef.current,
      });
      alert(status === 'APROBADO_TUTOR' ? "Documento aprobado con éxito" : "Documento rechazado");
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
          alert("Operación completada con éxito");
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
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#003366] rounded-full animate-spin" />
        <p className="text-slate-500 font-bold">Cargando expediente...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Detail Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2" />
            <div>
              <h1 className="text-xl font-black text-[#003366] tracking-tight truncate max-w-[400px]">
                {internship?.student?.fullName}
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-black uppercase tracking-wider">
                <Building2 className="w-3 h-3" />
                {internship?.company?.name}
              </div>
            </div>
          </div>

            {internship?.status}
          

          {currentUser?.role === 'COORDINADOR' && (
            <button 
              onClick={async () => {
                setIsSyncingSigafi(true);
                try {
                  const res = await internshipsService.syncSigafi(id as string);
                  alert(`Sincronización SIGAFI: ${res.externalData.isEnrolled ? 'Estudiante MATRICULADO' : 'No matriculado'} en ${res.externalData.lastSemester}`);
                } catch (e: any) {
                  alert(e.message);
                } finally {
                  setIsSyncingSigafi(false);
                }
              }}
              disabled={isSyncingSigafi}
              className="flex items-center gap-2 bg-[#C5A059]/10 text-[#C5A059] px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-[#C5A059]/30 hover:bg-[#C5A059]/20 transition-all ml-4"
            >
              {isSyncingSigafi ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
              SIGAFI Sync
            </button>
          )}
        </div>
      

      <div className="max-w-[1400px] mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Quick Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#003366]/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-[#003366] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/10">
                   <User className="text-[#C5A059] w-6 h-6" />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#C5A059] mb-4">Información General</h3>
                
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Horas</p>
                    <p className="font-black text-[#003366]">{internship?.totalHours} Horas</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha Inicio</p>
                    <p className="font-black text-[#003366] flex items-center gap-2">
                       <CalendarDays className="w-4 h-4 text-slate-300" />
                       {new Date(internship?.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                    <p className="font-black text-[#003366]">{internship?.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Progress Section */}
            {attendanceSummary && (
              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#C5A059] mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Progreso Asistencia
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
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Completadas</p>
                      <p className="text-xl font-black text-[#003366]">{attendanceSummary.totalHours}h</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Porcentaje</p>
                      <p className="text-xl font-black text-emerald-600">{attendanceSummary.progressPercentage}%</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold mb-3 uppercase tracking-widest">Últimos Registros</p>
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

            <div className="bg-[#003366] rounded-[2rem] p-8 text-white relative overflow-hidden group">
               <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-0 right-0 w-40 h-40 border-4 border-white rounded-full -mr-20 -mt-20" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 border-2 border-white rounded-full -ml-12 -mb-12" />
               </div>
               
               <div className="relative z-10">
                  <AlertCircle className="w-8 h-8 text-[#C5A059] mb-6" />
                  <h4 className="text-lg font-black tracking-tight mb-2 leading-tight">Configuración de Plazos</h4>
                  <p className="text-sm text-white/60 font-medium mb-8 leading-relaxed">
                    Establezca las fechas de entrega para asegurar que el estudiante cumpla con el cronograma institucional.
                  </p>
               </div>
            </div>
          </div>

          {/* Documents Main List */}
          <div className="lg:col-span-3">
             <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                         <Clock className="w-5 h-5 text-[#003366]" />
                      </div>
                      <h2 className="text-xl font-black text-[#003366] tracking-tight">Expediente de Documentos</h2>
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                      {documents.length} ítem(s) en expediente
                   </div>
                </div>

                <div className="divide-y divide-slate-100">
                   {documents.map((doc, idx) => (
                      <motion.div 
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all group"
                      >
                         <div className="flex items-center gap-6 flex-1">
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
                                   <span className="text-[8px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 font-black tracking-wider">Certificado</span>
                                 )}
                                 {doc.isRequired === false && !doc.isCertificateSlot && (
                                   <span className="text-[8px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-black tracking-wider">Opcional</span>
                                 )}
                               </h4>
                               <div className="flex flex-wrap gap-4 items-center">
                                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                     <Calendar className="w-3 h-3" />
                                     Inicio: <span className="text-slate-600 font-black">{doc.startDate ? new Date(doc.startDate).toLocaleDateString() : 'No definido'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                     <XCircle className="w-3 h-3" />
                                     Vence: <span className="text-slate-600 font-black">{doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : 'No definido'}</span>
                                  </div>
                                  {doc.status.replace(/_/g, ' ')}
                                  </div>
                                  {doc.isDigitallySigned && (
                                    <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] bg-emerald-600 text-white shadow-lg flex items-center gap-1.5 animate-pulse">
                                       <Stamp size={10} /> Sello Veracidad
                                    </div>
                                  )}
                                  {doc.filePath && (
                                    <button 
                                      onClick={() => handlePreviewFile(doc)}
                                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#C5A059] hover:underline"
                                    >
                                      <FileText className="w-3 h-3" />
                                      Ver Entrega
                                    </button>
                                  )}
                            </div>
                         </div>

                         <div className="flex items-center gap-3">
                           {doc.status === 'EN_REVISION_TUTOR' && (
                             <button 
                               onClick={() => handleReviewClick(doc)}
                               className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-[#C5A059] text-white hover:bg-[#C5A059]/90 shadow-lg shadow-amber-900/10 active:scale-95 transition-all"
                             >
                                <FileCheck className="w-4 h-4" />
                                Revisar
                             </button>
                           )}
                           
                           <button 
                            onClick={() => handleEditClick(doc)}
                            disabled={doc.status === 'APROBADO_DEFINITIVO'}
                            className={cn(
                              "flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                              doc.status === 'APROBADO_DEFINITIVO' 
                                ? "opacity-50 cursor-not-allowed text-slate-400" 
                                : "bg-[#003366] text-white hover:bg-[#003366]/90 shadow-lg shadow-blue-900/10 active:scale-95"
                            )}
                           >
                              <Edit3 className="w-4 h-4" />
                              Fechas
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
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-[#003366] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10">
                      <Clock className="text-[#C5A059] w-6 h-6" />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-[#003366] tracking-tight">Ventanilla de Entrega</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Definir cronograma</p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-10 space-y-8 overflow-y-auto">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-[#C5A059] mb-3">Documento</h4>
                   <p className="font-bold text-[#003366] text-lg leading-tight">{selectedDoc?.name}</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fecha de Apertura</label>
                      <div className="relative group">
                         <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                         <input 
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#003366]/5 focus:border-[#003366] outline-none transition-all font-semibold text-slate-700 hover:bg-white"
                         />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium px-2">El estudiante podrá cargar el documento desde este día.</p>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fecha de Vencimiento</label>
                      <div className="relative group">
                         <XCircle className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                         <input 
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#003366]/5 focus:border-[#003366] outline-none transition-all font-semibold text-slate-700 hover:bg-white"
                         />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium px-2 text-rose-400">Plazo final para la subida del archivo por el estudiante.</p>
                   </div>
                </div>

                <div className="pt-6">
                   <div className="bg-[#003366]/5 rounded-2xl p-6 flex gap-4">
                      <AlertCircle className="w-5 h-5 text-[#003366] flex-shrink-0 mt-1" />
                      <p className="text-[11px] text-[#003366]/70 leading-relaxed font-semibold">
                         Asegúrese de que las fechas concuerden con las fases del plan de rotación aprobado para esta empresa.
                      </p>
                   </div>
                </div>
              </div>

              <div className="p-10 border-t border-slate-100 bg-white">
                <button 
                  onClick={handleSaveDates}
                  disabled={saving || !startDate || !dueDate}
                  className="w-full h-14 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#003366]/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Guardar Cambios
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
              className="fixed top-0 right-0 z-[101] flex h-full min-h-0 w-full max-w-[min(100vw,1180px)] flex-col bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-emerald-50/30 p-6 lg:p-10">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-[#003366] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10">
                      <FileCheck className="text-[#C5A059] w-6 h-6" />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-[#003366] tracking-tight">Revisión Documental</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Evaluar entrega</p>
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
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#C5A059]">Documento a revisar</h4>
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
                    <button
                      type="button"
                      onClick={() => handlePreviewFile(selectedDoc)}
                      className="mt-3 shrink-0 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-[10px] font-black uppercase tracking-widest text-[#003366] shadow-sm hover:bg-slate-50"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4" />
                        Abrir PDF en pestaña nueva
                      </span>
                    </button>
                  )}
                </div>

                {/* FEEDBACK THREADS v5.0 */}
                <div className="lg:col-span-1 lg:border-l border-slate-100 flex flex-col min-h-0 pl-8">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] mb-4 flex items-center gap-2">
                     <MessageSquare size={14} /> Hilo de Retroalimentación
                  </h4>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-hide">
                      {loadingComments ? (
                        <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-300" /></div>
                      ) : comments.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-medium italic">No hay comentarios registrados fuera de las observaciones generales.</p>
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
                        placeholder="Escribir al estudiante..."
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

              <div className="p-10 border-t border-slate-100 bg-white grid grid-cols-3 gap-4">
                <button 
                  onClick={() => handleReviewSubmit('RECHAZADO_TUTOR')}
                  disabled={saving || !observations.trim()}
                  className="h-14 bg-white border-2 border-rose-100 text-rose-600 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  Rechazar
                </button>

                {currentUser?.role === 'COORDINADOR' && (
                   <button 
                    onClick={handleSignDocument}
                    disabled={isSigning || selectedDoc?.status !== 'APROBADO_TUTOR'}
                    className="h-14 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/20"
                  >
                    {isSigning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Stamp className="w-5 h-5" />}
                    Firma Electrónica
                  </button>
                )}

                <button 
                  onClick={() => handleReviewSubmit('APROBADO_TUTOR')}
                  disabled={saving}
                  className={cn(
                    "h-14 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20",
                    currentUser?.role === 'COORDINADOR' ? "bg-slate-100 text-[#003366]" : "bg-[#003366] text-white"
                  )}
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {currentUser?.role === 'COORDINADOR' ? 'Aprobar Sin Firmar' : 'Aprobar'}
                </button>
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
  </div>
);
}
