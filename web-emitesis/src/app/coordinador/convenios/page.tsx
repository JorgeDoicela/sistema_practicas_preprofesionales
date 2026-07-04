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
import { useLanguage } from "@/providers/LanguageProvider";


export default function RegistrarConvenioPage() {
    const { t } = useLanguage();
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
        accessVerified: false
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
                setError(t.coordinator.agreements.errorFormat);
                return;
            }

            // Regla de Negocio: Max 10MB
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError(t.coordinator.agreements.errorSize);
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
            setError(t.coordinator.agreements.errorRequiredFile);
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
            setError(t.coordinator.agreements.errorRucStandard);
            return;
        }

        if (cleanForm.endDate && new Date(cleanForm.endDate) <= new Date(cleanForm.startDate)) {
            setError(t.documents.detail.errors.invalidDateRange);
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
                router.push("/coordinador/convenios/list");
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || t.common.error);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <DashboardLayout>
                <div className="min-h-[70vh] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-100 max-w-lg w-full text-center"
                    >
                        <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                            <CheckCircle2 className="text-emerald-500" size={48} />
                        </div>
                        <h2 className="text-3xl font-black text-[#003366] mb-4 tracking-tight">
                            {t.coordinator.agreements.successTitle}
                        </h2>
                        <p className="text-slate-500 font-medium leading-relaxed mb-10">
                            {t.coordinator.agreements.successDesc}
                        </p>
                        <button 
                            onClick={() => router.push('/coordinador/convenios/list')}
                            className="w-full bg-[#003366] text-white rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 hover:translate-y-[-2px] transition-all"
                        >
                            {t.common.back}
                        </button>
                    </motion.div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="mb-10">
                    <div className="flex items-center gap-2 text-[#003366] text-[10px] font-bold uppercase tracking-widest mb-4">
                        <FileText size={12} /> {t.coordinator.agreements.mgmt}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight">{t.coordinator.agreements.title}</h1>
                    <p className="text-slate-500 mt-2">{t.coordinator.agreements.subtitle}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Sección 1: Datos de la Empresa */}
                    <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100" data-tour="agreement-form-entity">
                        <div className="flex items-center gap-3 mb-6 md:mb-8 pb-4 border-b border-slate-50">
                            <Building2 className="text-[#C5A059]" size={20} />
                            <h3 className="font-bold text-[#003366] uppercase tracking-widest text-sm">{t.coordinator.agreements.entityInfo}</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.agreements.rucLabel}</label>
                                <div className="relative">
                                    <Hash className={cn(
                                        "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                                        form.ruc && !validateRUC(form.ruc) ? "text-red-400" : "text-slate-300"
                                    )} />
                                    <input 
                                        name="ruc"
                                        value={form.ruc}
                                        onChange={handleInputChange}
                                        placeholder={t.coordinator.agreements.rucPlaceholder}
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
                                        {t.coordinator.agreements.rucInvalid}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.agreements.companyName}</label>
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.agreements.address}</label>
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.agreements.city}</label>
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.agreements.phone}</label>
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.agreements.sector}</label>
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.agreements.representative}</label>
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.agreements.email}</label>
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
                    <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100" data-tour="agreement-form-legal">
                        <div className="flex items-center gap-3 mb-6 md:mb-8 pb-4 border-b border-slate-50">
                            <ShieldCheck className="text-[#C5A059]" size={20} />
                            <h3 className="font-bold text-[#003366] uppercase tracking-widest text-sm">{t.coordinator.agreements.formalization}</h3>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div className="flex items-start gap-3 p-4 bg-[#003366]/5 rounded-2xl border border-[#003366]/10">
                                <input 
                                    type="checkbox" 
                                    id="accessVerified"
                                    required
                                    className="mt-1 w-4 h-4 rounded border-slate-300 text-[#003366] focus:ring-[#003366]/20"
                                    checked={form.accessVerified}
                                    onChange={(e) => setForm(prev => ({ ...prev, accessVerified: e.target.checked }))}
                                />
                                <label htmlFor="accessVerified" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                                    <span className="font-bold text-[#003366]">{t.coordinator.agreements.complianceDecl}</span> {t.coordinator.agreements.complianceText}
                                </label>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.agreements.agreementType}</label>
                                <select
                                    name="type"
                                    value={form.type}
                                    onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                                >
                                    <option value="GENERAL">{t.coordinator.agreements.types.general}</option>
                                    <option value="ESPECIFICO">{t.coordinator.agreements.types.specific}</option>
                                    <option value="MARCO">{t.coordinator.agreements.types.framework}</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.agreements.maxInterns}</label>
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.agreements.signDate}</label>
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.agreements.expiryDate}</label>
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
                                <p className="text-[10px] text-slate-400 ml-1">{t.coordinator.agreements.expiryHint}</p>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.coordinator.agreements.fileLabel}</label>
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
                                                {file ? file.name : t.coordinator.agreements.fileSelect}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{t.coordinator.agreements.fileMaxSize}</p>
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

                        <div className="mt-10 flex flex-col md:flex-row gap-4" data-tour="agreement-form-submit">
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-[#003366] text-white rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        {t.coordinator.agreements.savingBtn}
                                    </>
                                ) : (
                                    <>
                                        <Upload size={16} />
                                        {t.coordinator.agreements.saveBtn}
                                    </>
                                )}
                            </button>
                            <button 
                                type="button"
                                onClick={() => router.back()}
                                className="px-8 border-2 border-slate-200 text-slate-400 rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all font-display"
                            >
                                {t.common.cancel}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
