"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TutorDashboardRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/tutor-academico/dashboard"); }, [router]);
  return null;
}
