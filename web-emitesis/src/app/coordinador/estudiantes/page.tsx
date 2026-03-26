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
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { internshipsService } from "@/services/internships.service";
import { documentsService } from "@/services/documents.service";

export default function GestionEstudiantesPage() {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Review states
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedInternshipId, setExpandedInternshipId] = useState<string | null>(null);

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

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      await loadData();
      setIsReviewDrawerOpen(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
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
                isExpanded={expandedInternshipId === internship.id}
                onToggle={() => setExpandedInternshipId(expandedInternshipId === internship.id ? null : internship.id)}
                onReviewClick={handleReviewClick}
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

function StudentInternshipCard({ internship, isExpanded, onToggle, onReviewClick }: any) {
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
              </div>
           </div>
        </div>

        <div className="flex items-center gap-10">
           {pendingDocs > 0 && (
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
            <div className="p-8 space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 pl-2">Expediente de Documentos</h4>
               <div className="grid gap-4">
                  {internship.documents.map((doc: any) => (
                    <div 
                      key={doc.id}
                      className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between hover:border-[#003366]/20 transition-all group"
                    >
                       <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all",
                            doc.status === 'APROBADO_DEFINITIVO' ? "bg-emerald-50 text-emerald-600" :
                            doc.status === 'APROBADO_TUTOR' ? "bg-blue-50 text-blue-600 shadow-sm" : "bg-slate-50 text-slate-400"
                          )}>
                             {doc.status === 'APROBADO_DEFINITIVO' ? <CheckCircle2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                          </div>
                          
                          <div>
                             <p className="font-bold text-[#003366] mb-1">{doc.name}</p>
                             <div className="flex items-center gap-3">
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm",
                                  doc.status === 'APROBADO_DEFINITIVO' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                  doc.status === 'APROBADO_TUTOR' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-slate-50 text-slate-500 border-slate-200"
                                )}>
                                   {doc.status.replace(/_/g, ' ')}
                                </span>
                                {doc.submittedAt && (
                                   <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1.5">
                                      <Clock className="w-3 h-3" />
                                      {new Date(doc.submittedAt).toLocaleDateString()}
                                   </span>
                                )}
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-4">
                          {doc.status === 'APROBADO_TUTOR' && (
                             <button 
                                onClick={() => onReviewClick(doc, internship.id)}
                                className="px-6 py-3 bg-[#C5A059] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#003366] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-900/10"
                             >
                                <FileCheck className="w-4 h-4" />
                             </button>
                          )}
                          {doc.filePath && (
                             <a 
                                href={doc.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#003366] hover:text-white transition-all shadow-sm"
                             >
                                <ChevronRight className="w-4 h-4" />
                             </a>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
