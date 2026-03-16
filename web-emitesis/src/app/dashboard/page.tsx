"use client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardMain } from "@/components/dashboard/DashboardMain";

export default function UniversalDashboard() {
  return (
    <DashboardLayout>
      <DashboardMain />
    </DashboardLayout>
  );
}
