"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PrivacyAdminView } from "@/components/dashboard/PrivacyAdminView";

export default function PrivacyAdminPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PrivacyAdminView />
      </div>
    </DashboardLayout>
  );
}
