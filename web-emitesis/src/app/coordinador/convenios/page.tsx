"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { 
    Building2, 
    FileText, 
    Upload, 
    CheckCircle2, 
    AlertCircle, 
    FileUp,
    ShieldCheck,
    Loader2,
    Calendar,
    User,
    Mail,
    MapPin,
    Hash,
    Phone,
    Layers,
    Users
} from "lucide-react";
import { agreementsService } from "@/services/agreements.service";
import { useRouter } from "next/navigation";
import { sanitizeFormText } from "@/utils/security";
import { validateRUC } from "@/utils/ecuador-validators";
import { cn } from "@/lib/utils";

export default function RegistrarConvenioPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    // Form state
    const [form, setForm] = useState({
        ruc: "",
        companyName: "",
        address: "",
        city: "",
        representative: "",
        email: "",
        phone: "",
        sector: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        type: "GENERAL",
        maxInterns: 1,
        acessVerified: false
    });
    const [file, setFile] = useState<File | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            
            // Regla de Negocio: Solo PDFs
            if (selectedFile.type !== "application/pdf") {
                setError("Solo se aceptan archivos en formato PDF.");
                return;
            }

            // Regla de Negocio: Max 10MB
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError("El archivo no debe superar los 10MB.");
                return;
            }

            setFile(selectedFile);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // A1: Datos incompletos
        if (!file) {
            setError("El documento del convenio firmado es obligatorio.");
            return;
        }

        setError(null);

        const maxByKey: Record<string, number> = {
            ruc: 13,
            companyName: 300,
            address: 500,
            city: 100,
            representative: 200,
            email: 254,
            phone: 20,
            sector: 150,
            startDate: 32,
            endDate: 32,
            type: 20,
        };
        const cleanForm = Object.keys(form).reduce((acc: Record<string, string>, key) => {
            const v = (form as Record<string, unknown>)[key];
            if (typeof v !== "string") return acc;
            const max = maxByKey[key] ?? 2000;
            acc[key] = sanitizeFormText(v, max);
            return acc;
        }, {});

        if (!validateRUC(cleanForm.ruc ?? "")) {
            setError("El RUC ingresado no es válido según los estándares del SRI.");
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            Object.entries(cleanForm).forEach(([key, value]) => formData.append(key, value as string));
            formData.append("maxInterns", String(form.maxInterns));
            formData.append("file", file);

            await agreementsService.create(formData);
            
            // 6. El sistema confirma el registro exitoso
            setSuccess(true);
            setTimeout(() => {
                router.push("/coordinador/dashboard");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Error al registrar el convenio");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6"
                    >
                        <CheckCircle2 size={40} />
                    </motion.div>
                    <h2 className="text-2xl font-black text-[#003366] mb-2">¡Registro Exitoso!</h2>
                    <p className="text-slate-500">El convenio ha sido guardado y la empresa ya está activa en el sistema.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#003366]/5 text-[#003366] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#003366]/10">
                        <FileText size={12} /> Gestión de Convenios
                    </div>
                    <h1 className="text-3xl font-black text-[#003366] tracking-tight">Registrar Nuevo Convenio</h1>
                    <p className="text-slate-500 mt-2">Diligencia la información oficial de la empresa y carga el acuerdo legal.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Sección 1: Datos de la Empresa */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                            <Building2 className="text-[#C5A059]" size={20} />
                            <h3 className="font-bold text-[#003366] uppercase tracking-widest text-sm">Información de la Entidad Receptora</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">RUC de la Empresa</label>
                                <div className="relative">
                                    <Hash className={cn(
                                        "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                                        form.ruc && !validateRUC(form.ruc) ? "text-red-400" : "text-slate-300"
                                    )} />
                                    <input 
                                        name="ruc"
                                        value={form.ruc}
                                        onChange={handleInputChange}
                                        placeholder="Ej: 1790000000001"
                                        className={cn(
                                            "w-full bg-slate-50 border rounded-xl py-3 pl-11 text-sm outline-none transition-all",
                                            form.ruc && !validateRUC(form.ruc) 
                                                ? "border-red-200 focus:ring-red-500/10 focus:border-red-400" 
                                                : "border-slate-200 focus:ring-[#003366]/5 focus:border-[#003366]"
                                        )}
                                        required 
                                        maxLength={13}
                                    />
                                </div>
                                {form.ruc && !validateRUC(form.ruc) && (
                                    <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 animate-pulse">
                                        RUC Inválido: Debe tener 13 dígitos y terminar en 001.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre / Razón Social</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        name="companyName"
                                        value={form.companyName}
                                        onChange={handleInputChange}
                                        placeholder="Nombre de la empresa"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dirección Principal</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        name="address"
                                        value={form.address}
                                        onChange={handleInputChange}
                                        placeholder="Dirección completa"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ciudad / Cantón</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        name="city"
                                        value={form.city}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Quito, Guayaquil"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teléfono de Contacto</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleInputChange}
                                        placeholder="Ej: 0987654321"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sector Económico / Actividad Principal</label>
                                <div className="relative">
                                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        name="sector"
                                        value={form.sector}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Tecnología, Salud, Educación, Manufactura"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Representante Legal</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        name="representative"
                                        value={form.representative}
                                        onChange={handleInputChange}
                                        placeholder="Nombre del representante"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo Electrónico de Contacto</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleInputChange}
                                        placeholder="empresa@ejemplo.com"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 2: Documento y Validación */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                            <ShieldCheck className="text-[#C5A059]" size={20} />
                            <h3 className="font-bold text-[#003366] uppercase tracking-widest text-sm">Formalización del Acuerdo</h3>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div className="flex items-start gap-3 p-4 bg-[#003366]/5 rounded-2xl border border-[#003366]/10">
                                <input 
                                    type="checkbox" 
                                    id="acessVerified"
                                    required
                                    className="mt-1 w-4 h-4 rounded border-slate-300 text-[#003366] focus:ring-[#003366]/20"
                                    checked={form.acessVerified}
                                    onChange={(e) => setForm(prev => ({ ...prev, acessVerified: e.target.checked }))}
                                />
                                <label htmlFor="acessVerified" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                                    <span className="font-bold text-[#003366]">Declaración de Cumplimiento:</span> Confirmo que esta empresa cumple con todos los estándares y requisitos legales exigidos por el <span className="font-bold">ACESS (Ecuador)</span> para la recepción de estudiantes en prácticas preprofesionales.
                                </label>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Convenio</label>
                                <select
                                    name="type"
                                    value={form.type}
                                    onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                                >
                                    <option value="GENERAL">General</option>
                                    <option value="ESPECIFICO">Específico</option>
                                    <option value="MARCO">Marco</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cupos Máximos de Pasantes</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={form.maxInterns}
                                        onChange={(e) => setForm(prev => ({ ...prev, maxInterns: parseInt(e.target.value) || 1 }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha de Firma</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        name="startDate"
                                        type="date"
                                        value={form.startDate}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha de Vencimiento</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        name="endDate"
                                        type="date"
                                        value={form.endDate}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 ml-1">Dejar en blanco si es indefinido</p>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Archivo del Convenio (PDF)</label>
                                <div className={`relative border-2 border-dashed rounded-xl p-4 transition-colors ${file ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50 hover:border-[#003366]/20'}`}>
                                    <input 
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${file ? 'bg-green-600 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                                            {file ? <CheckCircle2 size={18} /> : <FileUp size={18} />}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-xs font-bold text-[#003366] truncate">
                                                {file ? file.name : "Seleccionar PDF firmado"}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Máximo 10MB</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600 items-start">
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <p className="text-xs font-bold">{error}</p>
                            </div>
                        )}

                        <div className="mt-10 flex flex-col md:flex-row gap-4">
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-[#003366] text-white rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Registrando...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={16} />
                                        Guardar Convenio Oficial
                                    </>
                                )}
                            </button>
                            <button 
                                type="button"
                                onClick={() => router.back()}
                                className="px-8 border-2 border-slate-200 text-slate-400 rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all font-display"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
