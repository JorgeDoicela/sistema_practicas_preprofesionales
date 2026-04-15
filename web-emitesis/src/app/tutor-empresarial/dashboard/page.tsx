"use client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardMain } from "@/components/dashboard/DashboardMain";

export default function TutorEmpresarialDashboard() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#003366]">Panel de Tutor Empresarial</h2>
        <p className="text-slate-500 text-sm">Gestión de asistencias y evaluaciones de desempeño en la empresa.</p>
      </div>
      <DashboardMain />
    </DashboardLayout>
  );
}
