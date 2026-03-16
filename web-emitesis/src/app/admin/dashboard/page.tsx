"use client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardMain } from "@/components/dashboard/DashboardMain";

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <DashboardMain />
    </DashboardLayout>
  );
}
