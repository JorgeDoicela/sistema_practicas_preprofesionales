"use client";

import { useEffect, useState, Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  FileStack, 
  Search, 
  GraduationCap, 
  Building2, 
  Calendar,
  ChevronRight,
  Clock,
  LayoutGrid,
  List as ListIcon,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  Lock,
  FileText,
  FileCheck,
  Loader2,
  XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { internshipsService } from "@/services/internships.service";
import { documentsService } from "@/services/documents.service";
import { ROLES, normalizeApiRoleToAppRole } from "@/constants/roles";
import { TwoFactorModal } from "@/components/auth/TwoFactorModal";
import { DoubleConfirmationModal } from "@/components/shared/DoubleConfirmationModal";
import { api } from "@/services/auth.service";
import { Trash2, Sparkles, Wand2 } from "lucide-react";
import { aiService } from "@/services/ai.service";
import * as pdfjs from "pdfjs-dist";
import { useLanguage } from "@/providers/LanguageProvider";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { parseReviewAnnotations } from "@/lib/pdf-review-annotations";

const DocumentPdfReviewViewer = dynamic(
  () =>
    import("@/components/documents/DocumentPdfReviewEditor").then((m) => ({
      default: m.DocumentPdfReviewEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Cargando visor de correcciones...
      </div>
    ),
  },
);

function DocumentosContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("id");
  
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  // Efecto para scroll automático al resaltar un documento desde notificación
  useEffect(() => {
    if (!loading && highlightId) {
      setTimeout(() => {
        const element = document.getElementById(`doc-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-[#C5A059]', 'ring-offset-4', 'transition-all', 'duration-500');
        }
      }, 800);
    }
  }, [loading, highlightId]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState(t.documents.filters.all);
  const [userRole, setUserRole] = useState<string>("");
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{id: string, file: File} | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ isValid: boolean, feedback: string } | null>(null);

  useEffect(() => {
    loadInternships();
  }, []);

  const loadInternships = async () => {
    try {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!userStr || !token) return;
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      setUserRole(user.role);
      const role = normalizeApiRoleToAppRole(user.role);
      let res;
      if (role === ROLES.TUTOR) {
        res = await internshipsService.findByTutor(user.id);
      } else if (user.role === ROLES.ESTUDIANTE) {
        res = await internshipsService.findByStudent(user.id);
      } else {
        res = await internshipsService.findAll();
      }

      const list = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
      setInternships(list);

      // RF-DOC-001: Para estudiantes, cargar sus documentos vinculados a la pasantía más reciente
      if (role === ROLES.ESTUDIANTE && list.length > 0) {
        const activeInternship = list[0];
        // Si la pasantía ya trae los documentos (que debería por el include de la API), los usamos directamente
        if (activeInternship.documents && activeInternship.documents.length > 0) {
          setUserDocuments(activeInternship.documents);
        } else {
          // Fallback: Si no vienen, hacemos la llamada por separado
          const docsRes: any = await documentsService.findByInternship(activeInternship.id);
          const docsData = Array.isArray(docsRes) ? docsRes : (Array.isArray(docsRes?.items) ? docsRes.items : []);
          setUserDocuments(docsData);
        }
      }
    } catch (error) {
      console.error("Error loading internships:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async (doc: any) => {
    setDownloadingId(doc.id);
    try {
      await documentsService.downloadTemplate(doc.id, doc.name);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewDocument = (doc: any) => {
    if (!doc.filePath) {
      alert("El archivo no está disponible.");
      return;
    }
    setViewingDoc(doc);
  };

  const handleUpload = async (docId: string, event: React.ChangeEvent<HTMLInputElement>, skipAi = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const doc = userDocuments.find(d => d.id === docId);
    const docName = doc?.name || "Documento de Prácticas";

    // Regla de Negocio: Solo PDF
    if (file.type !== "application/pdf") {
      alert(t.common.errors.invalidFormat || "Solo se permiten archivos en formato PDF");
      return;
    }

    // Regla de Negocio: Máximo 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert(t.common.errors.maxSize);
      return;
    }

    // --- ESCANEO POR IA (Opcional pero sugerido) ---
    if (!skipAi && !isApproved(docId)) {
      setIsAiScanning(true);
      try {
        const base64 = await getFirstPageAsBase64(file);
        
        // Obtener horas del sistema y nombre del estudiante para validación cruzada (IA v4)
        const internship = internships[0];
        const systemHours = internship?.totalHours;
        const userStr = localStorage.getItem("user");
        const studentName = userStr ? (JSON.parse(userStr) as { fullName?: string }).fullName : undefined;

        const result = await aiService.preVerifyDocument(docName, base64, systemHours, studentName);
        
        if (!result.isValid) {
          setAiFeedback(result);
          setPendingUpload({ id: docId, file });
          setIsAiScanning(false);
          return; // Detenemos para mostrar advertencia
        }
      } catch (error) {
        console.error("AI Scan failed:", error);
      } finally {
        setIsAiScanning(false);
      }
    }

    setUploadingId(docId);
    try {
      if (currentUser?.isTwoFactorEnabled) {
          setPendingUpload({ id: docId, file });
          setIs2faModalOpen(true);
          setUploadingId(null);
          return;
      }

      await documentsService.uploadDocument(docId, file);
      alert(t.common.success.generic);
      loadInternships();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploadingId(null);
      setAiFeedback(null);
    }
  };

  const confirmUploadWith2fa = async (code: string) => {
    if (!pendingUpload) return;
    setUploadingId(pendingUpload.id);
    try {
      await documentsService.uploadDocument(pendingUpload.id, pendingUpload.file, code);
      alert(t.common.success.generic);
      setIs2faModalOpen(false);
      setPendingUpload(null);
      loadInternships();
    } catch (error: any) {
      throw error;
    } finally {
      setUploadingId(null);
    }
  };

  const isApproved = (id: string) => {
    return userDocuments.find(d => d.id === id)?.status === 'APROBADO_DEFINITIVO';
  };

  const getFirstPageAsBase64 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context!, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    return dataUrl.split(",")[1];
  };

  const confirmUploadAfterAi = async () => {
    setAiFeedback(null);
    if (pendingUpload) {
      // Proceder con la lógica normal
      const { id, file } = pendingUpload;
      setUploadingId(id);
      try {
        if (currentUser?.isTwoFactorEnabled) {
          setIs2faModalOpen(true);
          setUploadingId(null);
          return;
        }
        await documentsService.uploadDocument(id, file);
        alert(t.common.success.generic);
        loadInternships();
      } catch (error: any) {
        alert(error.message);
      } finally {
        setUploadingId(null);
        setPendingUpload(null);
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteFile = async () => {
    if (!deletingId) return;
    try {
      if (currentUser?.isTwoFactorEnabled) {
          setPendingAction(() => async (code: string) => {
              await documentsService.deleteDocumentFile(deletingId, code);
          });
          setIsConfirmModalOpen(false);
          setIs2faModalOpen(true);
          return;
      }
      await documentsService.deleteDocumentFile(deletingId);
      alert(t.common.success.deleted);
      loadInternships();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handle2faConfirmAction = async (code: string) => {
      if (!pendingAction) return;
      try {
          const action = pendingAction();
          await action(code);
          alert(t.common.success.generic);
          setIs2faModalOpen(false);
          setPendingAction(null);
          loadInternships();
      } catch (error) {
          throw error;
      }
  };

  const [pendingAction, setPendingAction] = useState<(() => (code: string) => Promise<void>) | null>(null);

  const filteredInternships = internships.filter(item => {
    const matchesSearch = 
      item.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === t.documents.filters.all) return matchesSearch;
    return matchesSearch && item.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'text-slate-500';
      case 'EN_REVISION_TUTOR': return 'text-blue-700';
      case 'APROBADO_TUTOR': 
      case 'APROBADO_DEFINITIVO': return 'text-emerald-700';
      case 'RECHAZADO_TUTOR':
      case 'RECHAZADO_COORDINADOR': return 'text-red-700';
      case 'INCUMPLIDO': return 'text-rose-700';
      default: return 'text-slate-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return (t.tutor.documentStatus as any)[status] || status.replace(/_/g, ' ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-3 md:gap-5 min-w-0">
            <div className="flex items-center justify-center text-[#003366] w-9 h-9 shrink-0">
              <FileStack className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block">
                {userRole === ROLES.ESTUDIANTE ? t.sidebar.menu.myDocuments : t.sidebar.menu.documents}
              </span>
              <h1 className="text-xl md:text-4xl font-black text-[#003366] tracking-tight truncate">
                {t.documents.title}
              </h1>
              <p className="text-xs md:text-base text-slate-500 font-medium mt-1">
                {t.documents.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
             <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    viewMode === 'grid' ? "bg-[#003366] text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    viewMode === 'list' ? "bg-[#003366] text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <ListIcon className="w-5 h-5" />
                </button>
             </div>
          </div>
        </section>

        {/* Search and Filters */}
        {userRole !== ROLES.ESTUDIANTE && (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-[#003366] transition-colors" />
              <input 
                type="text" 
                placeholder={t.documents.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm focus:ring-4 focus:ring-[#003366]/5 focus:border-[#003366] transition-all outline-none font-medium text-slate-700"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="relative group">
                <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-[#003366] transition-colors" />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm focus:ring-4 focus:ring-[#003366]/5 focus:border-[#003366] outline-none appearance-none font-black text-[10px] uppercase tracking-widest text-[#003366] cursor-pointer"
                >
                  <option value={t.documents.filters.all}>{t.documents.filters.all}</option>
                  <option value={t.documents.filters.inProgress}>{t.documents.filters.inProgress}</option>
                  <option value={t.documents.filters.active}>{t.documents.filters.active}</option>
                  <option value={t.documents.filters.finished}>{t.documents.filters.finished}</option>
                </select>
                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">{t.documents.loading}</p>
          </div>
        ) : (
          <div className="mt-2">
            {userRole === ROLES.ESTUDIANTE ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="documents-list">
            {userDocuments.map((doc, idx) => {
              const now = new Date();
              const isCertSlot = Boolean(doc.isCertificateSlot);
              const isOptional = doc.isRequired === false;
              const isLocked = !doc.startDate || now < new Date(doc.startDate);
              const isExpired = doc.dueDate && now > new Date(doc.dueDate);
              const isApproved = doc.status === 'APROBADO_DEFINITIVO';
              const isUnderReview = doc.status === 'EN_REVISION_TUTOR' || doc.status === 'APROBADO_TUTOR';
              
              return (
                <motion.div
                  key={doc.id}
                  id={`doc-${doc.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-6 md:p-8 border border-slate-200 shadow-sm transition-all relative overflow-hidden group",
                    isLocked ? "bg-slate-50 opacity-80" : "hover:shadow-xl hover:shadow-[#003366]/5"
                  )}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={cn(
                      "w-14 h-14 flex items-center justify-center transition-transform group-hover:scale-110",
                      isApproved ? "text-emerald-600" : 
                      isLocked ? "text-slate-400" : "text-blue-600"
                    )}>
                      {isApproved ? <CheckCircle2 className="w-7 h-7" /> : 
                       isLocked ? <Lock className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                    </div>
                    <div className={cn(
                       "text-[10px] font-black uppercase tracking-widest",
                       getStatusColor(doc.status)
                    )}>
                      {getStatusLabel(doc.status)}
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-[#003366] mb-2 leading-tight group-hover:text-[#C5A059] transition-colors line-clamp-2 min-h-[3rem]">{doc.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {isCertSlot && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-violet-800">
                        {t.documents.student.system}
                      </span>
                    )}
                    {isOptional && !isCertSlot && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                        {t.documents.student.optional}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 mb-8">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      {t.documents.student.since}: <span className="text-slate-600 font-black">{doc.startDate ? new Date(doc.startDate).toLocaleDateString() : t.documents.student.byDefine}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5" />
                      {t.documents.student.limit}: <span className={cn("font-black", isExpired ? "text-red-500" : "text-slate-600")}>
                        {doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : t.documents.student.byDefine}
                      </span>
                    </div>
                  </div>

                  {isCertSlot ? (
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mb-2">
                      {t.documents.student.certificateNote}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {!isApproved && (
                        <button
                          onClick={() => handleDownloadTemplate(doc)}
                          disabled={isLocked || downloadingId === doc.id}
                          className={cn(
                            "py-4 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all active:scale-[0.98]",
                            isLocked 
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                              : "bg-slate-100 text-[#003366] hover:bg-slate-200"
                          )}
                        >
                          {downloadingId === doc.id ? (
                            <div className="w-3 h-3 border-2 border-[#003366]/30 border-t-[#003366] rounded-full animate-spin"></div>
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          {t.documents.student.format}
                        </button>
                      )}

                      {!isApproved && (
                        <div className="relative" data-tour="documents-upload">
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleUpload(doc.id, e)}
                            disabled={isLocked || isExpired || isUnderReview || uploadingId === doc.id}
                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <button
                            disabled={isLocked || isExpired || isUnderReview || uploadingId === doc.id}
                            className={cn(
                              "w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-blue-900/10",
                              isLocked || isExpired || isUnderReview
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                                : "bg-[#003366] text-white hover:bg-[#003366]/90"
                            )}
                          >
                            {uploadingId === doc.id ? (
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              <FileCheck className="w-3.5 h-3.5" />
                            )}
                            {t.documents.student.upload}
                          </button>
                        </div>
                      )}

                      {doc.filePath && (
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="col-span-2 py-4 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest bg-blue-50 text-[#003366] hover:bg-blue-100 transition-all active:scale-[0.98] border border-blue-100 mt-2"
                        >
                           <Search className="w-3.5 h-3.5" />
                           Visualizar con correcciones
                        </button>
                      )}

                      {!isApproved && doc.filePath && (
                        <button
                          onClick={() => handleDeleteClick(doc.id)}
                          disabled={isExpired}
                          className="col-span-2 py-4 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all active:scale-[0.98] border border-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           <Trash2 className="w-3.5 h-3.5" />
                           {t.documents.student.delete}
                        </button>
                      )}

                    </div>
                  )}

                  {isAiScanning && uploadingId === null && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-3">
                      <Sparkles className="w-8 h-8 text-[#C5A059] animate-pulse" />
                      <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest">{t.documents.student.scanning}</p>
                    </div>
                  )}

                  {isLocked && doc.startDate && (
                    <div className="mt-4 p-4 bg-orange-50 rounded-xl flex gap-3">
                      <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-orange-700 font-bold leading-relaxed uppercase">
                        {t.documents.student.availableOn.replace("{date}", new Date(doc.startDate).toLocaleDateString())}
                      </p>
                    </div>
                  )}

                  {/* Retroalimentación del Tutor (Feedback) */}
                  {(doc.status === 'RECHAZADO_TUTOR' || doc.status === 'RECHAZADO_COORDINADOR') && doc.observations && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-5 bg-rose-50 rounded-[1.5rem] border border-rose-100 relative group/feedback"
                    >
                      <div className="absolute -top-3 left-6 px-3 py-1 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                        Retroalimentación
                      </div>
                      <p className="text-xs text-rose-800 font-medium leading-relaxed italic">
                        "{doc.observations}"
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                         <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Corregir para re-envío</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : filteredInternships.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="documents-list">
              <AnimatePresence mode='popLayout'>
                {filteredInternships.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link 
                      href={`/dashboard/documentos/${item.id}`}
                      className="group bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all hover:-translate-y-1 block relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-6">
                        <div className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          item.status === 'Activo' ? "text-emerald-700" : "text-orange-700"
                        )}>
                          {item.status}
                        </div>
                      </div>

                      <div className="flex flex-col h-full">
                        <div className="w-14 h-14 flex items-center justify-center mb-6 text-[#003366]">
                          <GraduationCap className="w-8 h-8" />
                        </div>

                        <h3 className="text-lg font-black text-[#003366] mb-1 line-clamp-1">{item.student.fullName}</h3>
                        <p className="text-slate-500 text-sm font-medium mb-6 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {item.company.name}
                        </p>

                        <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                              {[1,2,3].map(i => (
                                <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                </div>
                              ))}
                            </div>
                            <span className="text-[11px] font-bold text-slate-400">8 {t.documents.table.title}</span>
                          </div>
                          
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#003366] group-hover:text-white transition-all transform group-hover:translate-x-1">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden" data-tour="documents-list">
               <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">{t.documents.table.student}</th>
                      <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">{t.documents.table.company}</th>
                      <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">{t.documents.table.status}</th>
                      <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">{t.documents.table.start}</th>
                      <th className="px-8 py-5 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">{t.documents.table.action}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInternships.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex items-center justify-center text-[#003366]">
                              <GraduationCap className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-[#003366]">{item.student.fullName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-slate-600 font-medium">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              {item.company.name}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={cn(
                             "text-[10px] font-black uppercase tracking-wider",
                             item.status === 'Activo' ? "text-emerald-700" : "text-orange-700"
                           )}>
                             {item.status}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {new Date(item.startDate).toLocaleDateString()}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <Link 
                            href={`/dashboard/documentos/${item.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#003366]/90 transition-all active:scale-95"
                           >
                             {t.documents.table.manage}
                             <ChevronRight className="w-3 h-3" />
                           </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
               </div>
            </div>
          )
        ) : (
          <div className="bg-white rounded-[2rem] border border-dashed border-slate-300 p-20 text-center">
            <div className="flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Search className="w-16 h-16" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t.documents.empty.title}</h3>
            <p className="text-slate-500 max-w-sm mx-auto">{t.documents.empty.desc}</p>
          </div>
            )}
          </div>
        )}
      </div>

      <TwoFactorModal 
        isOpen={is2faModalOpen}
        onClose={() => {
            setIs2faModalOpen(false);
            setPendingUpload(null);
            setPendingAction(null);
        }}
        onConfirm={pendingUpload ? confirmUploadWith2fa : handle2faConfirmAction}
        title={pendingUpload ? t.documents.modal2fa.titleUpload : t.documents.modal2fa.titleDefault}
        description={pendingUpload 
          ? t.documents.modal2fa.descUpload
          : t.documents.modal2fa.descDefault
        }
      />
      <DoubleConfirmationModal 
        isOpen={isConfirmModalOpen}
        onClose={() => {
            setIsConfirmModalOpen(false);
            setDeletingId(null);
        }}
        onConfirm={confirmDeleteFile}
        title={t.documents.modalDelete.title}
        description={t.documents.modalDelete.desc}
      />

      {/* AI Feedback Warning Modal */}
      <AnimatePresence>
        {aiFeedback && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#003366]/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-rose-100"
            >
              <div className="flex items-center justify-center mb-6 text-rose-500">
                <Wand2 className="w-14 h-14" />
              </div>
              <h3 className="text-xl font-black text-[#003366] mb-4 uppercase tracking-tight">{t.documents.ai.warning}</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                 {t.documents.ai.detected}
                 <br /><br />
                 <span className="text-rose-600 font-bold">"{aiFeedback.feedback}"</span>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setAiFeedback(null); setPendingUpload(null); }}
                  className="py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  {t.documents.ai.correct}
                </button>
                <button
                  onClick={confirmUploadAfterAi}
                  className="py-4 bg-[#003366] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#003366]/90 transition-all shadow-lg shadow-blue-900/10"
                >
                  {t.documents.ai.forceUpload}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10 bg-[#003366]/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100"
            >
               <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                     <div className="flex items-center justify-center text-[#003366] w-9 h-9">
                        <FileText className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-[#003366] tracking-tight">{viewingDoc.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Visor de correcciones de auditoría</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setViewingDoc(null)}
                    className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-white hover:shadow-md transition-all text-slate-400 hover:text-rose-500"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
               </div>

               <div className="flex-1 overflow-hidden p-4 md:p-8 bg-slate-100/30">
                  <DocumentPdfReviewViewer 
                    fileUrl={viewingDoc.filePath}
                    initialItems={parseReviewAnnotations(viewingDoc.reviewAnnotations).items}
                    readonly={true}
                  />
               </div>

               <div className="p-6 border-t border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Revisa los elementos resaltados en el documento
                     </p>
                  </div>
                  <a 
                    href={viewingDoc.filePath}
                    target="_blank"
                    className="px-8 py-4 bg-[#003366] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#003366]/90 transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                  >
                     <Download className="w-4 h-4" />
                     Descargar original
                  </a>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

export default function DocumentosPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
      </div>
    }>
      <DocumentosContent />
    </Suspense>
  );
}
