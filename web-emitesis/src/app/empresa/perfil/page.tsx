"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProfileView } from "@/components/profile/ProfileView";

export default function PerfilEmpresaPage() {
  return (
    <DashboardLayout>
      <div className="py-8 px-4 md:px-8">
        <ProfileView />
      </div>
    </DashboardLayout>
  );
}
