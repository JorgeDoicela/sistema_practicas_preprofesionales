"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /tutor-academico/estudiantes redirige al dashboard del tutor,
 * donde ya existe la lista completa de pasantes asignados.
 */
export default function TutorEstudiantesRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/tutor-academico/dashboard");
  }, [router]);
  return null;
}
