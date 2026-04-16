"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AuditLogsView } from "@/components/dashboard/AuditLogsView";

export default function AuditLogsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AuditLogsView />
      </div>
    </DashboardLayout>
  );
}
