"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  Users, 
  Search, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileCheck,
  Loader2,
  Building2,
  Calendar,
  Filter,
  FileBadge
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";
import { documentsService } from "@/services/documents.service";
import { attendancesService } from "@/services/attendances.service";
import { certificationService, EligibilityResponse } from "@/services/certification.service";

export default function GestionEstudiantesPage() {
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await internshipsService.findAll();
      setInternships(data);
    } catch (error) {
      console.error("Error loading internships:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInternshipDetails = async (id: string, f?: { startDate: string, endDate: string }) => {
    try {
      const [summary, history, eligibility] = await Promise.all([
        attendancesService.getSummary(id),
        attendancesService.findByInternship(id, f?.startDate, f?.endDate),
        certificationService.checkEligibility(id)
      ]);
      setAttendanceData(prev => ({ ...prev, [id]: { summary, history } }));
      setEligibilityData(prev => ({ ...prev, [id]: eligibility }));
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

  const handleReviewClick = (doc: any, internshipId: string) => {
    setSelectedDoc({ ...doc, internshipId });
    setObservations(doc.observations || "");
    setIsReviewDrawerOpen(true);
  };

  const handleReviewSubmit = async (status: 'APROBADO_DEFINITIVO' | 'RECHAZADO_COORDINADOR') => {
    if (status === 'RECHAZADO_COORDINADOR' && !observations.trim()) {
      alert("Las observaciones son obligatorias para rechazar el documento.");
      return;
    }

    setSaving(true);
    try {
      await documentsService.coordinatorReviewDocument(selectedDoc.id, { status, observations });
      alert(status === 'APROBADO_DEFINITIVO' ? "Aprobación definitiva exitosa" : "Documento rechazado por coordinación");
      
      // Recargar datos para actualizar elegibilidad
      await loadData();
      if (expandedInternshipId) {
         const eligibility = await certificationService.checkEligibility(expandedInternshipId);
         setEligibilityData(prev => ({ ...prev, [expandedInternshipId]: eligibility }));
      }
      
      setIsReviewDrawerOpen(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCertificate = async (internshipId: string) => {
    if (!confirm("¿Está seguro de generar el certificado oficial? Esta acción finalizará la pasantía del estudiante.")) {
      return;
    }

    setGeneratingCertId(internshipId);
    try {
      const result = await certificationService.generateCertificate(internshipId);
      alert("Certificado generado con éxito.");
      window.open(result.url, '_blank');
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al generar certificado");
    } finally {
      setGeneratingCertId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-[1600px] mx-auto pb-20">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 block animate-in fade-in slide-in-from-left-4 duration-700">Coordinación de Prácticas</span>
            <h2 className="text-4xl font-black text-[#003366] tracking-tight">
              Gestión de <span className="text-slate-400">Estudiantes</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">Supervisión global y validación final de expedientes.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                <input 
                  type="text"
                  placeholder="Buscar estudiante o empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-[350px] outline-none focus:ring-4 focus:ring-[#003366]/5 focus:border-[#003366] transition-all font-medium text-sm shadow-sm"
                />
             </div>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-[#003366] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando expedientes...</p>
          </div>
        ) : (
          <div className="grid gap-6">
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
              className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-[101] flex flex-col"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-emerald-50/30">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-[#003366] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10">
                      <FileCheck className="text-[#C5A059] w-6 h-6" />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-[#003366] tracking-tight">Validación Final</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Nivel Coordinación</p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsReviewDrawerOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-10 space-y-8 overflow-y-auto">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-[#C5A059] mb-3">Documento</h4>
                   <p className="font-bold text-[#003366] text-lg leading-tight">{selectedDoc?.name}</p>
                   
                   <a 
                      href={selectedDoc?.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 w-full py-4 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#003366] hover:bg-slate-50 transition-all shadow-sm"
                   >
                      <FileText className="w-4 h-4" />
                      Visualizar Archivo
                   </a>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Observaciones Finales</label>
                   <textarea 
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Ingrese el feedback final para el estudiante y el tutor..."
                      className="w-full h-44 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-[#003366]/5 focus:border-[#003366] outline-none transition-all font-medium text-slate-700 resize-none hover:bg-white"
                   />
                </div>
                
                <div className="bg-amber-50 rounded-2xl p-5 flex gap-4 border border-amber-100/50">
                   <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                   <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                      RECUERDE: Un documento con APROBACIÓN DEFINITIVA queda bloqueado para cualquier modificación futura por parte del estudiante.
                   </p>
                </div>
              </div>

              <div className="p-10 border-t border-slate-100 bg-white grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleReviewSubmit('RECHAZADO_COORDINADOR')}
                  disabled={saving || !observations.trim()}
                  className="h-14 bg-white border-2 border-rose-100 text-rose-600 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  Rechazar
                </button>
                <button 
                  onClick={() => handleReviewSubmit('APROBADO_DEFINITIVO')}
                  disabled={saving}
                  className="h-14 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#003366]/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Aprobar
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
  onGenerateCertificate 
}: any) {
  const pendingDocs = internship.documents.filter((d: any) => d.status === 'APROBADO_TUTOR').length;

  return (
    <div className={cn(
      "bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden",
      isExpanded ? "border-[#C5A059] shadow-2xl shadow-amber-900/10 ring-1 ring-[#C5A059]/20" : "border-slate-200 shadow-sm hover:shadow-md"
    )}>
      <div 
        onClick={onToggle}
        className="p-8 cursor-pointer flex items-center justify-between group"
      >
        <div className="flex items-center gap-8">
           <div className={cn(
             "w-16 h-16 rounded-[1.75rem] flex items-center justify-center text-xl font-black transition-all duration-500",
             isExpanded ? "bg-[#003366] text-white scale-110 rotate-3 shadow-lg shadow-blue-900/20" : "bg-slate-50 text-[#003366] group-hover:bg-slate-100 group-hover:scale-105"
           )}>
             {internship.student.fullName.charAt(0)}
           </div>
           
           <div>
              <h3 className="text-xl font-black text-[#003366] mb-1 group-hover:text-[#C5A059] transition-colors">{internship.student.fullName}</h3>
              <div className="flex flex-wrap gap-6 items-center">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                    {internship.company.name}
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#C5A059]">
                    <Users className="w-3.5 h-3.5" />
                    Tutor: <span className="text-[#003366]">{internship.tutor.fullName}</span>
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    Progreso: {attendance?.summary?.progressPercentage || 0}%
                 </div>
                 {internship.status === 'Finalizado' && (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completado
                    </div>
                 )}
              </div>
           </div>
        </div>

        <div className="flex items-center gap-10">
           {pendingDocs > 0 && internship.status !== 'Finalizado' && (
             <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-900/20" />
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{pendingDocs} Revisión Pendiente</span>
             </div>
           )}
           <div className={cn(
             "w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 transition-transform duration-500",
             isExpanded && "bg-[#C5A059] text-white rotate-180"
           )}>
              <ChevronRight className="w-5 h-5" />
           </div>
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
            <div className="p-8 space-y-10">
               {/* Dashboard de Requisitos */}
               {eligibility && (
                 <div className="grid md:grid-cols-3 gap-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="space-y-4 border-r border-slate-100 pr-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentación</h4>
                       <div className="flex items-end gap-3">
                          <span className="text-3xl font-black text-[#003366]">{eligibility.details.approvedDocsCount < 7 ? (
                             <span className="text-rose-500">{eligibility.details.approvedDocsCount}</span>
                          ) : (
                             <span className="text-emerald-500">7</span>
                          )}/7</span>
                          <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Aprobados</span>
                       </div>
                       <p className="text-[11px] font-medium text-slate-500 leading-tight">
                          {eligibility.details.missingDocs.length > 0 
                            ? `Pendiente: ${eligibility.details.missingDocs.join(', ')}`
                            : 'Todos los documentos obligatorios han sido aprobadas.'}
                       </p>
                    </div>

                    <div className="space-y-4 border-r border-slate-100 pr-4 pl-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asistencia Total</h4>
                       <div className="flex items-end gap-3">
                          <span className={cn(
                             "text-3xl font-black",
                             eligibility.details.hoursMet ? "text-emerald-500" : "text-rose-500"
                          )}>{eligibility.details.totalHours}h</span>
                          <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase">de {eligibility.details.requiredHours}h</span>
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

                    <div className="flex flex-col justify-center pl-4">
                       {internship.status === 'Finalizado' ? (
                          <div className="text-center p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                             <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                             <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Pasantía Culminada</p>
                             <button 
                                onClick={(e) => { e.stopPropagation(); const doc = internship.documents.find((d:any) => d.name === 'Certificado de culminación'); if(doc?.filePath) window.open(doc.filePath, '_blank') }}
                                className="mt-2 text-[10px] font-bold text-[#003366] hover:underline"
                             >
                                Descargar Certificado
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
                             <span className="text-[11px] font-black uppercase tracking-[0.2em]">Generar Certificado</span>
                          </button>
                       )}
                       {!eligibility.eligible && internship.status !== 'Finalizado' && (
                          <p className="text-[9px] text-center mt-3 text-rose-500 font-bold uppercase tracking-widest animate-pulse">
                             Requisitos incompletos
                          </p>
                       )}
                    </div>
                 </div>
               )}

               <div className="grid lg:grid-cols-2 gap-10 opacity-80 filter grayscale-[0.3]">
                  {/* Columna Izquierda: Documentos */}
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 pl-2 flex items-center gap-3">
                       <FileText className="w-4 h-4" />
                       Expediente Digital
                     </h4>
                     <div className="grid gap-3">
                        {internship.documents.map((doc: any) => (
                          <div 
                            key={doc.id}
                            className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group"
                          >
                             <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center",
                                  doc.status === 'APROBADO_DEFINITIVO' ? "bg-emerald-50 text-emerald-600" :
                                  doc.status === 'APROBADO_TUTOR' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"
                                )}>
                                   {doc.status === 'APROBADO_DEFINITIVO' ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <div>
                                   <p className="text-[11px] font-bold text-[#003366] line-clamp-1">{doc.name}</p>
                                   <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{doc.status.replace(/_/g, ' ')}</span>
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
                       Vista de Asistencia
                     </h4>

                     <div className="flex items-end gap-3 bg-white p-4 rounded-2xl border border-slate-100 mb-4 shadow-sm">
                        <div className="space-y-1 flex-1">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Desde</label>
                           <input 
                              type="date" 
                              value={attendanceFilters.startDate}
                              onChange={(e) => setAttendanceFilters({...attendanceFilters, startDate: e.target.value})}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-blue-500"
                           />
                        </div>
                        <div className="space-y-1 flex-1">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasta</label>
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
                     
                     {!attendance ? (
                        <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" /></div>
                     ) : (
                       <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                          <table className="w-full text-[10px]">
                             <thead className="bg-slate-50 border-b">
                                <tr>
                                   <th className="px-4 py-3 text-left font-black uppercase text-slate-400">Fecha</th>
                                   <th className="px-4 py-3 text-left font-black uppercase text-slate-400">Entrada</th>
                                   <th className="px-4 py-3 text-left font-black uppercase text-slate-400">Salida</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y text-slate-400">
                                {attendance.history.slice(0, 5).map((h: any) => (
                                   <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-4 py-3 font-bold">{new Date(h.checkIn).toLocaleDateString()}</td>
                                      <td className="px-4 py-3 font-bold">{new Date(h.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                      <td className="px-4 py-3 font-bold">{h.checkOut ? new Date(h.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
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
