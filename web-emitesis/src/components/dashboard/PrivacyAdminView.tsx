"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { privacyService } from "@/services/privacy.service";
import { toast } from "sonner";
import Link from "next/link";

interface ArcoRequest {
  id: string;
  type: string;
  details: string | null;
  status: string;
  response: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    fullName: string;
    email: string;
    role: string;
  };
}

export function PrivacyAdminView() {
  const [requests, setRequests] = useState<ArcoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ArcoRequest | null>(null);
  const [responseMsg, setResponseMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await privacyService.findAllAdmin();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Error al cargar solicitudes LOPDP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleRespond = async (status: string) => {
    if (!selectedRequest || !responseMsg.trim()) {
      toast.warning("Debe proporcionar una respuesta oficial");
      return;
    }

    setIsSubmitting(true);
    try {
      await privacyService.respondAdmin(selectedRequest.id, responseMsg, status);
      toast.success("Solicitud actualizada correctamente");
      setSelectedRequest(null);
      setResponseMsg("");
      loadRequests();
    } catch (error) {
      toast.error("Error al actualizar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
    const matchesSearch =
      r.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.details || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDIENTE":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        );
      case "EN_REVISION":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <AlertCircle className="w-3 h-3" /> En Revisión
          </span>
        );
      case "COMPLETADA":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <CheckCircle2 className="w-3 h-3" /> Completada
          </span>
        );
      case "RECHAZADA":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <XCircle className="w-3 h-3" /> Rechazada
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.4em] mb-2 block">
            Gobernanza y Privacidad
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-brand-blue tracking-tight">
            Gestión de Derechos <span className="text-slate-400">ARCO</span>
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            Administración institucional de solicitudes bajo la Ley Orgánica de Protección de Datos (LOPDP).
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/privacidad/logs"
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-[10px] font-black uppercase tracking-widest text-[#003366]"
          >
            <ShieldAlert className="w-4 h-4 text-[#C5A059]" />
            Ver Logs de Aceptación
          </Link>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
               <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="pr-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estado LOPDP</p>
              <p className="text-sm font-black text-slate-800">Gobernanza Activa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white/40 shadow-xl shadow-slate-200/50 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, correo o detalles..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              className="pl-12 pr-10 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">TODOS LOS ESTADOS</option>
              <option value="PENDIENTE">PENDIENTES</option>
              <option value="EN_REVISION">EN REVISIÓN</option>
              <option value="COMPLETADA">COMPLETADAS</option>
              <option value="RECHAZADA">RECHAZADAS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario / Solicitante</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Derecho</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Legal</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fecha</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-400">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                          <ShieldAlert className="w-8 h-8" />
                        </motion.div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando expedientes legales...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <p className="text-sm font-medium text-slate-500">No se encontraron solicitudes con los criterios seleccionados.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <motion.tr
                      key={req.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">
                            {req.user.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-700">{req.user.fullName}</p>
                            <p className="text-[10px] font-medium text-slate-400">{req.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black tracking-widest uppercase">
                          {req.type}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-6 text-center">
                         <p className="text-xs font-medium text-slate-600">
                           {new Date(req.createdAt).toLocaleDateString()}
                         </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-400 hover:text-brand-blue transition-all"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-blue text-white rounded-2xl">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-brand-blue tracking-tight">Resolver Solicitud ARCO</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {selectedRequest.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                    <MoreHorizontal className="w-6 h-6 rotate-90" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="grid grid-cols-2 gap-6 mb-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Solicitante</p>
                        <p className="text-sm font-bold text-slate-700">{selectedRequest.user.fullName}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo Doc.</p>
                        <p className="text-sm font-bold text-slate-700">{selectedRequest.type}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Detalles de la Solicitud</p>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {selectedRequest.details || "El usuario no proporcionó detalles adicionales."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Respuesta Institucional Oficial</label>
                    <textarea
                      placeholder="Escriba la respuesta técnica o legal para el usuario..."
                      className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/10 transition-all font-medium resize-none"
                      value={responseMsg}
                      onChange={(e) => setResponseMsg(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <button
                      disabled={isSubmitting}
                      onClick={() => handleRespond("COMPLETADA")}
                      className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {isSubmitting ? "Enviando..." : "Marcar como Completada"}
                    </button>
                    <button
                      disabled={isSubmitting}
                      onClick={() => handleRespond("RECHAZADA")}
                      className="py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-600/20 disabled:opacity-50"
                    >
                      {isSubmitting ? "Confirmando..." : "Rechazar Solicitud"}
                    </button>
                  </div>
                  
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleRespond("EN_REVISION")}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10"
                  >
                    Mantener en Revisión
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
