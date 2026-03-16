"use client";

import { useEffect, useState } from "react";
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
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { internshipsService } from "@/services/internships.service";

export default function DocumentosPage() {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState("Todos");

  useEffect(() => {
    loadInternships();
  }, []);

  const loadInternships = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      
      let data;
      if (user.role === "TUTOR") {
        data = await internshipsService.findByTutor(user.id);
      } else {
        data = await internshipsService.findAll();
      }
      setInternships(data);
    } catch (error) {
      console.error("Error loading internships:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInternships = internships.filter(item => {
    const matchesSearch = 
      item.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "Todos") return matchesSearch;
    return matchesSearch && item.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-white/10 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#003366] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10">
              <FileStack className="text-[#C5A059] w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#003366] tracking-tight">Gestión de Documentos</h1>
              <p className="text-sm text-slate-500 font-medium">Configuración de plazos y seguimiento de expedientes</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2.5 rounded-lg transition-all",
                    viewMode === 'grid' ? "bg-white shadow-sm text-[#003366]" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2.5 rounded-lg transition-all",
                    viewMode === 'list' ? "bg-white shadow-sm text-[#003366]" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <ListIcon className="w-5 h-5" />
                </button>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 mt-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar por estudiante o empresa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#003366]/10 focus:border-[#003366] transition-all outline-none font-medium text-slate-700"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#003366]/10 outline-none appearance-none font-semibold text-slate-600 cursor-pointer"
              >
                <option>Todos</option>
                <option>En Proceso</option>
                <option>Activo</option>
                <option>Finalizado</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#003366] rounded-full animate-spin" />
            <p className="text-slate-500 font-bold animate-pulse">Cargando expedientes...</p>
          </div>
        ) : filteredInternships.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          item.status === 'Activo' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                        )}>
                          {item.status}
                        </div>
                      </div>

                      <div className="flex flex-col h-full">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#003366] transition-colors">
                          <GraduationCap className="text-[#003366] group-hover:text-white transition-colors w-7 h-7" />
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
                            <span className="text-[11px] font-bold text-slate-400">8 Documentos</span>
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
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Estudiante</th>
                      <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Empresa</th>
                      <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                      <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Inicio</th>
                      <th className="px-8 py-5 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInternships.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#003366]/5 rounded-xl flex items-center justify-center">
                              <GraduationCap className="text-[#003366] w-5 h-5" />
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
                             "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                             item.status === 'Activo' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
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
                             Gestionar
                             <ChevronRight className="w-3 h-3" />
                           </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )
        ) : (
          <div className="bg-white rounded-[2rem] border border-dashed border-slate-300 p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No se encontraron expedientes</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Prueba ajustando tus filtros o términos de búsqueda para encontrar lo que necesitas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
